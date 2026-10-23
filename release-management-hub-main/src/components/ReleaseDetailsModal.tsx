import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FileText, UploadSimple, X as XIcon } from '@phosphor-icons/react';
import { X } from 'lucide-react';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import { inputStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { useReleaseStore } from '@/components/ReleaseStore';
import {
  RELEASE_NOTES_ACCEPT, RELEASE_NOTES_MAX_BYTES, formatBytes, isHttpUrl, isReleaseNotesFile,
} from '@/data/releases';
import type { ReleaseNotesFile } from '@/types/Feature';
import { RADIUS, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The details that belong to a release rather than to a feature in it: its one
   release notes document, uploaded here once, and the webinar that walks
   customers through it. Read by every surface that announces the release.

   The webinar is all-or-nothing. Leave all three of its fields empty and the
   release has no webinar; fill any of them and the rest are required, so a
   banner can never promote a registration link with no date or no name.
   --------------------------------------------------------------------------- */

interface FormState {
  webinarTitle: string;
  webinarUrl: string;
  webinarStartsAt: string;
}

type ErrorKey = keyof FormState | 'notes';
type Errors = Partial<Record<ErrorKey, string>>;

const Field = ({
  id, label, required = false, error, hint, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-12 font-semibold text-ink-600">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
    {error ? (
      <span className="text-xs text-red-600">{error}</span>
    ) : (
      hint && <span className="text-xs text-ink-500">{hint}</span>
    )}
  </div>
);

const ReleaseDetailsModal = ({
  open,
  month,
  onClose,
}: {
  open: boolean;
  month: string;
  onClose: () => void;
}) => {
  const { releaseFor, saveRelease } = useReleaseStore();
  const { toast } = useFeatureStore();
  const titleId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>({ webinarTitle: '', webinarUrl: '', webinarStartsAt: '' });
  const [notes, setNotes] = useState<ReleaseNotesFile | undefined>();
  /* The blob URL of a file picked in this sitting and not yet saved. Freed if
     the dialog is cancelled or the pick is replaced; kept once saved. */
  const unsaved = useRef<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const dropUnsaved = () => {
    if (unsaved.current) URL.revokeObjectURL(unsaved.current);
    unsaved.current = null;
  };

  useEffect(() => {
    if (!open) return;
    const meta = releaseFor(month);
    setErrors({});
    unsaved.current = null;
    setNotes(meta?.releaseNotes);
    setForm({
      webinarTitle: meta?.webinar?.title ?? '',
      webinarUrl: meta?.webinar?.url ?? '',
      webinarStartsAt: meta?.webinar?.startsAt ?? '',
    });
    // Reads the record once per opening; later saves must not reset a form
    // the creator is typing into.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, month]);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!isReleaseNotesFile(file)) {
      setErrors((e) => ({ ...e, notes: 'Upload a PDF or Word document (.pdf, .doc, .docx).' }));
      return;
    }
    if (file.size > RELEASE_NOTES_MAX_BYTES) {
      setErrors((e) => ({ ...e, notes: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(RELEASE_NOTES_MAX_BYTES)}.` }));
      return;
    }
    dropUnsaved();
    const url = URL.createObjectURL(file);
    unsaved.current = url;
    setNotes({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', url });
    setErrors((e) => ({ ...e, notes: undefined }));
  };

  const removeNotes = () => {
    dropUnsaved();
    setNotes(undefined);
    setErrors((e) => ({ ...e, notes: undefined }));
  };

  const close = () => {
    dropUnsaved();
    onClose();
  };

  const submit = () => {
    const next: Errors = {};
    const wTitle = form.webinarTitle.trim();
    const wUrl = form.webinarUrl.trim();
    const wWhen = form.webinarStartsAt.trim();

    const hasWebinar = Boolean(wTitle || wUrl || wWhen);
    if (hasWebinar) {
      if (!wTitle) next.webinarTitle = 'Give the webinar a title.';
      if (!wUrl) next.webinarUrl = 'Registration link is required.';
      else if (!isHttpUrl(wUrl)) next.webinarUrl = 'Enter a full link starting with https://.';
      if (!wWhen) next.webinarStartsAt = 'Choose when it starts.';
    }

    if (Object.keys(next).length) {
      setErrors(next);
      const first = (['webinarTitle', 'webinarUrl', 'webinarStartsAt'] as const).find((k) => next[k]);
      if (first) document.getElementById(`rel-${first}`)?.focus();
      return;
    }

    saveRelease({
      month,
      releaseNotes: notes,
      webinar: hasWebinar ? { title: wTitle, url: wUrl, startsAt: wWhen } : undefined,
    });
    // Saved: the store owns this blob now.
    unsaved.current = null;
    toast(`${month} release details saved.`);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} width={560}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-150 p-5">
        <h3 id={titleId} className="text-lg font-semibold">{month} release details</h3>
        <IconButton onClick={close} title="Close" aria-label="Close">
          <X size={16} />
        </IconButton>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <Field
          id="rel-notes"
          label="Release notes"
          error={errors.notes}
          hint="One document for the whole release. PDF or Word, up to 10 MB. Without one, customers see the release notes page in the hub."
        >
          <input
            ref={fileInput}
            id="rel-notes"
            type="file"
            accept={RELEASE_NOTES_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              // Lets the same file be chosen again after a remove.
              e.target.value = '';
            }}
          />
          {notes ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 52,
                padding: '8px 12px',
                border: `1px solid ${T.bd2}`,
                borderRadius: RADIUS.control,
                background: T.su1,
              }}
            >
              <FileText size={24} color={T.brand} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="block truncate text-sm font-semibold text-ink-900">{notes.name}</span>
                <span className="block text-xs tabular-nums text-ink-500">{formatBytes(notes.size)}</span>
              </span>
              <Button variant="secondary" compact onClick={() => fileInput.current?.click()}>
                Replace
              </Button>
              <IconButton onClick={removeNotes} title="Remove file" aria-label="Remove release notes file">
                <XIcon size={14} weight="bold" />
              </IconButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files?.[0]);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 72,
                padding: 12,
                border: `1px dashed ${errors.notes ? T.dangBorder : T.bd2}`,
                borderRadius: RADIUS.control,
                background: T.card,
                color: T.brand,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <UploadSimple size={18} weight="bold" />
              Upload release notes
              <span style={{ fontWeight: 400, color: T.tx3 }}>or drop a file here</span>
            </button>
          )}
        </Field>

        <div className="flex flex-col gap-3 border-t border-ink-150 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-ink-900">Webinar</h4>
            <p className="text-xs text-ink-500">
              Promoted to every role across the Product Hub, the banner and the What&apos;s New
              popup until it starts. Clear all three fields to remove it.
            </p>
          </div>

          <Field id="rel-webinarTitle" label="Title" error={errors.webinarTitle}>
            <input
              id="rel-webinarTitle"
              style={inputStyle({ invalid: Boolean(errors.webinarTitle) })}
              placeholder={`e.g. ${month} release walkthrough`}
              value={form.webinarTitle}
              onChange={(e) => set('webinarTitle', e.target.value)}
            />
          </Field>

          <Field id="rel-webinarUrl" label="Registration link" error={errors.webinarUrl}>
            <input
              id="rel-webinarUrl"
              style={inputStyle({ invalid: Boolean(errors.webinarUrl) })}
              placeholder="https://"
              value={form.webinarUrl}
              onChange={(e) => set('webinarUrl', e.target.value)}
            />
          </Field>

          <Field id="rel-webinarStartsAt" label="Starts" error={errors.webinarStartsAt}>
            <input
              id="rel-webinarStartsAt"
              type="datetime-local"
              style={inputStyle({ invalid: Boolean(errors.webinarStartsAt) })}
              value={form.webinarStartsAt}
              onChange={(e) => set('webinarStartsAt', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-ink-150 bg-ink-50 px-5 py-4">
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button onClick={submit}>Save details</Button>
      </div>
    </Modal>
  );
};

export default ReleaseDetailsModal;
