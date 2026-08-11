import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import {
  inputCls, readonlyInputCls, selectCls, textareaCls, caretBackground,
} from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { MODULES, addDays, formatDate, releaseMonthOf } from '@/data/features';
import { FEATURE_TYPES, type Feature, type FeatureType } from '@/types/Feature';

/* Every field in the pane is required. The list is declared once and drives
   both the labels and the validation, so a new field can't be added to the
   form and silently skip the check. */
const FIELDS = [
  { key: 'title', label: 'Feature Title', error: 'Feature title is required.' },
  { key: 'featureTag', label: 'Feature Tag', error: 'Feature tag is required.' },
  { key: 'summary', label: 'Feature Summary', error: 'Feature summary is required.' },
  { key: 'productModule', label: 'Product Module', error: 'Product module is required.' },
  { key: 'featureType', label: 'Feature Type', error: 'Feature type is required.' },
  { key: 'releaseNotes', label: 'Release Notes URL', error: 'Release notes URL is required.' },
  { key: 'demoVideo', label: 'Demo Video URL', error: 'Demo video URL is required.' },
  { key: 'prodEnablementDate', label: 'Production Enablement Date', error: 'Production enablement date is required.' },
  { key: 'productGate', label: 'Feature Flag (Internal)', error: 'Feature flag is required.' },
  { key: 'configurationDoc', label: 'Configuration Document URL', error: 'Configuration document URL is required.' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];
type FormState = Record<FieldKey, string>;

const EMPTY: FormState = {
  title: '',
  featureTag: 'Enhancement',
  summary: '',
  productModule: MODULES[0],
  featureType: 'Default On',
  releaseNotes: '',
  demoVideo: '',
  prodEnablementDate: '2026-07-01',
  productGate: '',
  configurationDoc: '',
};

/* Label, control, and one line of guidance beneath it. When a field fails, its
   error replaces the hint rather than stacking under it - two lines of
   guidance for one input is one too many. */
const Field = ({
  id, label, required = true, invalid = false, error, hint, span2 = false, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  invalid?: boolean;
  error?: string;
  hint?: string;
  span2?: boolean;
  children: ReactNode;
}) => (
  <div className={`flex flex-col gap-2${span2 ? ' min-[861px]:col-span-2' : ''}`}>
    <label htmlFor={id} className="text-13 font-medium text-ink-600">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
    {invalid && error ? (
      <span className="text-xs text-red-600">{error}</span>
    ) : (
      hint && <span className="text-xs text-ink-500">{hint}</span>
    )}
  </div>
);

const CreateFeatureModal = ({
  open,
  feature,
  onClose,
}: {
  open: boolean;
  feature: Feature | null;
  onClose: () => void;
}) => {
  const { upsert } = useFeatureStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [invalid, setInvalid] = useState<Set<FieldKey>>(new Set());
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setInvalid(new Set());
    setForm(
      feature
        ? {
            title: feature.title,
            featureTag: feature.featureTag,
            summary: feature.summary ?? '',
            productModule: feature.productModule,
            featureType: feature.featureType ?? 'Default On',
            releaseNotes: feature.releaseNotes ?? '',
            demoVideo: feature.demoVideo ?? '',
            prodEnablementDate: feature.prodEnablementDate,
            productGate: feature.productGate ?? '',
            configurationDoc: feature.configurationDoc ?? '',
          }
        : EMPTY,
    );
  }, [open, feature]);

  // Escape is handled by Modal, so there is no key listener here any more.

  // Non Deferrable features have no deferment window to show.
  const deferrable = useMemo(() => {
    if (form.featureType === 'Non Deferrable') return 'Not deferrable';
    if (!form.prodEnablementDate) return '';
    return formatDate(addDays(form.prodEnablementDate, 90));
  }, [form.featureType, form.prodEnablementDate]);

  // A field stops complaining as soon as it's filled in.
  const set = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (value.trim()) {
      setInvalid((s) => {
        if (!s.has(key)) return s;
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  const submit = () => {
    const missing = FIELDS.filter((f) => !String(form[f.key] ?? '').trim()).map((f) => f.key);
    if (missing.length) {
      setInvalid(new Set(missing));
      document.getElementById(`in-${missing[0]}`)?.focus();
      return;
    }

    const type = form.featureType as FeatureType;
    // Feature Type carries enablement: Default Off ships disabled, the other
    // two ship on. There is no separate Enabled switch to disagree with it.
    const isEnabled = type !== 'Default Off';
    const prod = form.prodEnablementDate;

    upsert(
      {
        ...(feature ?? ({} as Feature)),
        id: feature?.id ?? 'FEAT-NEW',
        title: form.title.trim(),
        featureTag: form.featureTag as Feature['featureTag'],
        summary: form.summary.trim(),
        productModule: form.productModule,
        featureType: type,
        releaseNotes: form.releaseNotes.trim(),
        demoVideo: form.demoVideo.trim(),
        configurationDoc: form.configurationDoc.trim(),
        productGate: form.productGate.trim(),
        prodEnablementDate: prod,
        enablementDate: feature?.enablementDate ?? prod,
        releaseMonth: releaseMonthOf(prod),
        deferrableTill: type === 'Non Deferrable' ? undefined : addDays(prod, 90),
        supportNeeded: feature?.supportNeeded ?? false,
        isEnabled,
        status: isEnabled ? 'Enabled' : 'Disabled',
        published: feature?.published ?? false,
        announcementBullets: feature?.announcementBullets ?? [form.summary.split('\n')[0]].filter(Boolean),
        enabledCustomers: feature?.enabledCustomers ?? 0,
        activeCustomers: feature?.activeCustomers ?? 0,
        mauLast30Days: feature?.mauLast30Days ?? 0,
        dauLast30DayAvg: feature?.dauLast30DayAvg ?? 0,
      },
      Boolean(feature),
    );
    onClose();
  };

  const bad = (key: FieldKey) => invalid.has(key);
  const errorOf = (key: FieldKey) => FIELDS.find((f) => f.key === key)!.error;

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} width={720}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-150 p-5">
        <h3 id={titleId} className="text-lg font-semibold">
          {feature ? 'Edit feature' : 'New feature'}
        </h3>
        <IconButton onClick={onClose} aria-label="Close">
          <X size={16} />
        </IconButton>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 min-[861px]:grid-cols-2">
          <Field id="in-title" label="Feature Title" invalid={bad('title')} error={errorOf('title')}>
            <input
              id="in-title"
              className={inputCls(bad('title'))}
              placeholder="e.g. Skills Gap Analysis"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <Field id="in-featureTag" label="Feature Tag" invalid={bad('featureTag')} error={errorOf('featureTag')}>
            <select
              id="in-featureTag"
              className={selectCls(bad('featureTag'))}
              style={caretBackground}
              value={form.featureTag}
              onChange={(e) => set('featureTag', e.target.value)}
            >
              <option>Enhancement</option>
              <option>New Feature</option>
            </select>
          </Field>

          <Field
            id="in-summary"
            label="Feature Summary"
            span2
            invalid={bad('summary')}
            error={errorOf('summary')}
            hint='Line 1 shows in the table; later lines expand behind "Show more".'
          >
            <textarea
              id="in-summary"
              className={textareaCls(bad('summary'))}
              placeholder="First line is the summary shown in the table. Any further lines appear under Show more."
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>

          <Field id="in-productModule" label="Product Module" invalid={bad('productModule')} error={errorOf('productModule')}>
            <select
              id="in-productModule"
              className={selectCls(bad('productModule'))}
              style={caretBackground}
              value={form.productModule}
              onChange={(e) => set('productModule', e.target.value)}
            >
              {MODULES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>

          <Field
            id="in-featureType"
            label="Feature Type"
            invalid={bad('featureType')}
            error={errorOf('featureType')}
            hint="Default On ships enabled. Default Off waits for the customer. Non Deferrable cannot be postponed."
          >
            <select
              id="in-featureType"
              className={selectCls(bad('featureType'))}
              style={caretBackground}
              value={form.featureType}
              onChange={(e) => set('featureType', e.target.value)}
            >
              {FEATURE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field id="in-releaseNotes" label="Release Notes URL" invalid={bad('releaseNotes')} error={errorOf('releaseNotes')}>
            <input
              id="in-releaseNotes"
              className={inputCls(bad('releaseNotes'))}
              placeholder="https://"
              value={form.releaseNotes}
              onChange={(e) => set('releaseNotes', e.target.value)}
            />
          </Field>

          <Field id="in-demoVideo" label="Demo Video URL" invalid={bad('demoVideo')} error={errorOf('demoVideo')}>
            <input
              id="in-demoVideo"
              className={inputCls(bad('demoVideo'))}
              placeholder="https://"
              value={form.demoVideo}
              onChange={(e) => set('demoVideo', e.target.value)}
            />
          </Field>

          <Field
            id="in-prodEnablementDate"
            label="Production Enablement Date"
            invalid={bad('prodEnablementDate')}
            error={errorOf('prodEnablementDate')}
          >
            <input
              id="in-prodEnablementDate"
              type="date"
              className={inputCls(bad('prodEnablementDate'))}
              value={form.prodEnablementDate}
              onChange={(e) => set('prodEnablementDate', e.target.value)}
            />
          </Field>

          <Field
            id="in-deferrable"
            label="Deferrable Till Date"
            required={false}
            hint="Auto-calculated as Production Enablement Date + 90 days."
          >
            <input id="in-deferrable" className={readonlyInputCls} readOnly value={deferrable} />
          </Field>

          <Field id="in-productGate" label="Feature Flag (Internal)" invalid={bad('productGate')} error={errorOf('productGate')}>
            <input
              id="in-productGate"
              className={inputCls(bad('productGate'))}
              placeholder="module.area.flag_name"
              value={form.productGate}
              onChange={(e) => set('productGate', e.target.value)}
            />
          </Field>

          <Field
            id="in-configurationDoc"
            label="Configuration Document URL"
            invalid={bad('configurationDoc')}
            error={errorOf('configurationDoc')}
          >
            <input
              id="in-configurationDoc"
              className={inputCls(bad('configurationDoc'))}
              placeholder="https://"
              value={form.configurationDoc}
              onChange={(e) => set('configurationDoc', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-ink-150 bg-ink-50 px-5 py-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>{feature ? 'Update Feature' : 'Create Feature'}</Button>
      </div>
    </Modal>
  );
};

export default CreateFeatureModal;
