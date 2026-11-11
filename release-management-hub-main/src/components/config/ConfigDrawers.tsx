import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  type Icon as PhIcon, CaretRight, Check, EnvelopeSimpleOpen, FileText, Image as ImageIcon, Info, PlayCircle, Plus, VideoCamera, X,
} from '@phosphor-icons/react';
import Drawer from '@/components/adoption/Drawer';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import Hoverable from '@/components/primitives/Hoverable';
import { inputStyle, readonlyInputStyle, selectStyle, textareaStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { useReleaseStore } from '@/components/ReleaseStore';
import { MODULES, addDays, formatDate, releaseMonthOf, valueOf } from '@/data/features';
import {
  RELEASE_NOTES_ACCEPT, RELEASE_NOTES_MAX_BYTES, formatBytes, isHttpUrl, isReleaseNotesFile, toLocalInput,
} from '@/data/releases';
import { FEATURE_TYPES, type Feature, type FeatureType, type ReleaseNotesFile } from '@/types/Feature';
import { GAP, RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The creator console's side panels and confirmations, after the Product Hub
   Configuration design: one drawer per object (feature, release, help
   content), a publish confirmation, and a type-DELETE confirmation.
   --------------------------------------------------------------------------- */

export type ContentKind = 'Document' | 'Newsletter' | 'Video';

export interface HelpContent {
  id: string;
  kind: ContentKind;
  title: string;
  module: string;
  /** Feature id, or '' when not linked. */
  link: string;
  published: boolean;
  /** ISO date. */
  updated: string;
  views: number;
  file?: { name: string; size: number; url?: string };
  url?: string;
  desc: string;
}

export const KIND_ICON = { Document: FileText, Newsletter: EnvelopeSimpleOpen, Video: PlayCircle } as const;

/* ---- Small form parts -------------------------------------------------- */

const LABEL: CSSProperties = { ...TYPE.fieldLabel, display: 'block', marginBottom: GAP.label };
const HINT: CSSProperties = { marginTop: SPACE.x1, fontSize: 12, lineHeight: 1.4, color: T.tx3 };
const ERR: CSSProperties = { marginTop: SPACE.x1, fontSize: 12, lineHeight: 1.4, color: T.dangText };

const Req = () => <span style={{ color: T.dangText }}>*</span>;

const Field = ({
  label, required, hint, error, htmlFor, children,
}: { label: string; required?: boolean; hint?: ReactNode; error?: string | false; htmlFor?: string; children: ReactNode }) => (
  <div>
    <label htmlFor={htmlFor} style={LABEL}>{label}{required && <> <Req /></>}</label>
    {children}
    {error ? <div style={ERR}>{error}</div> : hint ? <div style={HINT}>{hint}</div> : null}
  </div>
);

/** An input that tracks its own focus for the ring. */
const Input = ({ invalid, style, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => {
  const [f, setF] = useState(false);
  return (
    <input
      {...rest}
      onFocus={(e) => { setF(true); rest.onFocus?.(e); }}
      onBlur={(e) => { setF(false); rest.onBlur?.(e); }}
      style={{ ...inputStyle({ invalid, focused: f }), ...style }}
    />
  );
};

const Select = ({ style, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [f, setF] = useState(false);
  return (
    <select {...rest} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{ ...selectStyle({ focused: f }), ...style }}>
      {children}
    </select>
  );
};

const TextArea = ({ invalid, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) => {
  const [f, setF] = useState(false);
  return <textarea {...rest} onFocus={() => setF(true)} onBlur={() => setF(false)} style={textareaStyle({ invalid, focused: f })} />;
};

/** A segmented single choice: the feature tag, the content type. */
const Segmented = <V extends string>({
  options, value, onChange, icons,
}: { options: V[]; value: V; onChange: (v: V) => void; icons?: Partial<Record<V, PhIcon>> }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x2 }}>
    {options.map((o) => {
      const on = o === value;
      const Ic = icons?.[o] as PhIcon | undefined;
      return (
        <button
          key={o}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(o)}
          style={{
            height: 36, padding: '0 14px', borderRadius: RADIUS.control, display: 'inline-flex', alignItems: 'center', gap: 8,
            border: `1px solid ${on ? T.brandBorder : T.bd2}`, background: on ? T.brandSoft : T.card,
            color: on ? T.brand : T.tx2, fontFamily: 'inherit', ...TYPE.button, cursor: 'pointer',
          }}
        >
          {Ic && <Ic size={16} />}{o}
        </button>
      );
    })}
  </div>
);

/** A file drop zone, or the chosen file with Replace / Remove. */
const FilePick = ({
  file, accept, onPick, onRemove, emptyLabel, invalid, onView,
}: {
  file?: { name: string; size: number } | null;
  accept: string;
  onPick: (f: File) => void;
  onRemove: () => void;
  emptyLabel: string;
  invalid?: boolean;
  onView?: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
      />
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x3, padding: '10px 12px', border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control, background: T.card }}>
          <span style={{ width: 32, height: 32, borderRadius: RADIUS.control, background: T.su2, color: T.tx3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <FileText size={16} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
            <span style={{ display: 'block', fontSize: 12, color: T.tx3 }}>{formatBytes(file.size)}</span>
          </span>
          {onView && <Button variant="ghost" compact onClick={onView}>View</Button>}
          <Button variant="ghost" compact onClick={() => ref.current?.click()}>Replace</Button>
          <IconButton size="compact" title="Remove file" aria-label="Remove file" onClick={onRemove}><X size={14} /></IconButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onPick(f); }}
          style={{
            width: '100%', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: `1px dashed ${invalid ? T.dangBorder : drag ? T.brand : T.bd2}`, borderRadius: RADIUS.control,
            background: drag ? T.brandSoft : T.su1, color: T.brand, fontFamily: 'inherit', ...TYPE.button, cursor: 'pointer',
            animation: invalid ? 'shakeX 200ms ease' : undefined,
          }}
        >
          <Plus size={14} weight="bold" />{emptyLabel}
          <span style={{ fontWeight: 400, color: T.tx3 }}>or drop a file here</span>
        </button>
      )}
    </>
  );
};

const Checkbox = ({ checked, onChange, children, title }: { checked: boolean; onChange: () => void; children: ReactNode; title?: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onChange}
    title={title}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: T.tx2 }}
  >
    <span style={{ width: 16, height: 16, borderRadius: RADIUS.tag - 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${checked ? 'transparent' : T.bd2}`, background: checked ? T.brandSolid : T.card }}>
      {checked && <Check size={11} weight="bold" color="#FFFFFF" />}
    </span>
    {children}
  </button>
);

const SwitchCtl = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    style={{ width: 36, height: 20, borderRadius: 999, border: 'none', padding: 2, background: on ? T.brandSolid : T.tx5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'background 120ms ease', flex: 'none' }}
  >
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#FFFFFF', transform: on ? 'translateX(16px)' : 'none', transition: 'transform 120ms ease' }} />
  </button>
);

/* ---- Feature drawer ---------------------------------------------------- */

const TYPE_LABEL: Record<FeatureType, { label: string; sub: string }> = {
  'Default On': { label: 'Default on', sub: 'Ships enabled. Customer admins can turn it off.' },
  'Default Off': { label: 'Default off', sub: 'Ships off and waits for a customer admin to turn it on.' },
  'Non Deferrable': { label: 'Non deferrable', sub: 'Ships enabled for everyone and cannot be postponed.' },
};

export const featureTypeLabel = (t?: FeatureType) => (t ? TYPE_LABEL[t].label : '-');
export const featureTypeSub = (t?: FeatureType) => (t ? TYPE_LABEL[t].sub : '');

interface FeatureDraft {
  title: string;
  tag: Feature['featureTag'];
  summary: string;
  desc: string;
  bullets: [string, string, string];
  module: string;
  type: FeatureType;
  prodDate: string;
  video: string;
  gate: string;
  doc: string;
  whatsNew: boolean;
}

const nextMonthStart = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
};

const toDraft = (f?: Feature | null): FeatureDraft => {
  if (!f) {
    return {
      title: '', tag: 'Enhancement', summary: '', desc: '', bullets: ['', '', ''], module: MODULES[0],
      type: 'Default On', prodDate: nextMonthStart(), video: '', gate: '', doc: '', whatsNew: true,
    };
  }
  const v = valueOf(f);
  return {
    title: f.title, tag: f.featureTag, summary: f.summary ?? '', desc: f.description ?? '',
    bullets: [v[0] ?? '', v[1] ?? '', v[2] ?? ''], module: f.productModule, type: f.featureType ?? 'Default On',
    prodDate: f.prodEnablementDate, video: f.demoVideo, gate: f.productGate ?? '', doc: f.configurationDoc ?? '',
    whatsNew: f.showInWhatsNew !== false,
  };
};

export const FeatureDrawer = ({ open, feature, onClose }: { open: boolean; feature: Feature | null; onClose: () => void }) => {
  const { upsert } = useFeatureStore();
  const [d, setD] = useState<FeatureDraft>(() => toDraft(feature));
  const [errs, setErrs] = useState<Record<string, boolean>>({});

  useEffect(() => { if (open) { setD(toDraft(feature)); setErrs({}); } }, [open, feature]);

  const set = <K extends keyof FeatureDraft>(k: K, v: FeatureDraft[K]) => {
    setD((cur) => ({ ...cur, [k]: v }));
    if (errs[k as string]) setErrs((e) => ({ ...e, [k]: false }));
  };

  const save = () => {
    const e: Record<string, boolean> = {
      title: !d.title.trim(), summary: !d.summary.trim(), desc: !d.desc.trim(), b0: !d.bullets[0].trim(),
      prodDate: !d.prodDate, video: !d.video.trim(), gate: !d.gate.trim(), doc: !d.doc.trim(),
    };
    setErrs(e);
    if (Object.values(e).some(Boolean)) return;
    const base: Feature = feature
      ? { ...feature }
      : {
          id: '', demoVideo: '', enablementDate: d.prodDate, prodEnablementDate: d.prodDate, supportNeeded: false,
          isEnabled: false, status: 'Disabled', published: false, releaseMonth: '', productModule: d.module, title: '',
          featureTag: 'Enhancement', enabledCustomers: 0, activeCustomers: 0, mauLast30Days: 0, dauLast30DayAvg: 0,
        };
    upsert(
      {
        ...base,
        title: d.title.trim(),
        featureTag: d.tag,
        summary: d.summary.trim(),
        description: d.desc.trim(),
        valueDelivered: d.bullets.map((b) => b.trim()).filter(Boolean),
        productModule: d.module,
        featureType: d.type,
        prodEnablementDate: d.prodDate,
        enablementDate: d.prodDate,
        deferrableTill: addDays(d.prodDate, 90),
        releaseMonth: releaseMonthOf(d.prodDate),
        demoVideo: d.video.trim(),
        productGate: d.gate.trim(),
        configurationDoc: d.doc.trim(),
        showInWhatsNew: d.whatsNew,
      },
      !!feature,
    );
    onClose();
  };

  const pub = feature?.published;
  const stats = pub
    ? [
        ['Enabled', String(feature?.enabledCustomers ?? 0)],
        ['Active', String(feature?.activeCustomers ?? 0)],
        ['MAU · 30 days', (feature?.mauLast30Days ?? 0).toLocaleString('en-IN')],
        ['DAU · 30-day avg', String(feature?.dauLast30DayAvg ?? 0)],
      ]
    : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={feature ? 'Edit feature' : 'Add new feature'}
      subtitle={feature ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {feature.id} · {feature.productModule}
          <StatusPill published={!!feature.published} />
        </span>
      ) : 'Saved as unpublished. Only creators see it until you publish.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{feature ? 'Update feature' : 'Add feature'}</Button></>}
    >
      {stats.length > 0 && (
        <div>
          <div style={{ ...TYPE.eyebrow, marginBottom: SPACE.x2 }}>Adoption</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control, overflow: 'hidden' }}>
            {stats.map(([l, v], i) => (
              <div key={l} style={{ padding: '8px 12px', borderLeft: i ? `1px solid ${T.bd}` : 'none' }}>
                <div style={{ fontSize: 11, color: T.tx3, whiteSpace: 'nowrap' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Field label="Feature title" required htmlFor="pf-title" error={errs.title && 'Feature title is required'}>
        <Input id="pf-title" value={d.title} invalid={errs.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Skills gap analysis" />
      </Field>
      <Field label="Feature tag" required>
        <Segmented options={['Enhancement', 'New Feature'] as Feature['featureTag'][]} value={d.tag} onChange={(v) => set('tag', v)} />
      </Field>
      <Field label="Feature summary" required htmlFor="pf-summary" error={errs.summary && 'Feature summary is required'} hint="Line 1 shows in the table; later lines expand behind Show more.">
        <TextArea id="pf-summary" rows={3} invalid={errs.summary} value={d.summary} onChange={(e) => set('summary', e.target.value)} placeholder="First line is the summary shown in the table." />
      </Field>
      <Field label="Feature description" required htmlFor="pf-desc" error={errs.desc && 'Feature description is required'} hint="The long-form explanation shown under What's new on the feature page.">
        <TextArea id="pf-desc" rows={4} invalid={errs.desc} value={d.desc} onChange={(e) => set('desc', e.target.value)} placeholder="How the feature works, and what it changes for the customer." />
      </Field>
      <Field label="Value delivered" required error={errs.b0 && 'At least one value point is required'} hint="Up to three points, listed on the feature page. The first is required.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
          {d.bullets.map((b, i) => (
            <Input
              key={i}
              aria-label={`Value point ${i + 1}`}
              value={b}
              invalid={i === 0 && errs.b0}
              onChange={(e) => { const next = [...d.bullets] as FeatureDraft['bullets']; next[i] = e.target.value; set('bullets', next); if (i === 0) setErrs((x) => ({ ...x, b0: false })); }}
              placeholder={['e.g. Surface review themes automatically', 'Second point (optional)', 'Third point (optional)'][i]}
            />
          ))}
        </div>
      </Field>
      <Field label="Product module" required htmlFor="pf-module">
        <Select id="pf-module" value={d.module} onChange={(e) => set('module', e.target.value)}>
          {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>
      <Field label="Feature type" required>
        <div role="radiogroup" aria-label="Feature type" style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
          {FEATURE_TYPES.map((t) => {
            const on = d.type === t;
            return (
              <div
                key={t}
                role="radio"
                tabIndex={0}
                aria-checked={on}
                onClick={() => set('type', t)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set('type', t); } }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: RADIUS.control, cursor: 'pointer', border: `1px solid ${on ? T.brandBorder : T.bd2}`, background: on ? T.brandSoft : T.card }}
              >
                <span style={{ width: 16, height: 16, marginTop: 2, borderRadius: '50%', border: `${on ? 5 : 1}px solid ${on ? T.brandSolid : T.bd2}`, background: T.card, flex: 'none', boxSizing: 'border-box' }} />
                <span>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.tx }}>{TYPE_LABEL[t].label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: T.tx3 }}>{TYPE_LABEL[t].sub}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.x3 }}>
        <Field label="Production enablement date" required htmlFor="pf-date" error={errs.prodDate && 'Production enablement date is required'} hint={d.prodDate ? `Puts the feature in the ${releaseMonthOf(d.prodDate)} release.` : undefined}>
          <Input id="pf-date" type="date" value={d.prodDate} invalid={errs.prodDate} onChange={(e) => set('prodDate', e.target.value)} />
        </Field>
        <Field label="Deferrable till date" hint="Production enablement date + 90 days.">
          <input readOnly value={d.prodDate ? formatDate(addDays(d.prodDate, 90)) : ''} style={readonlyInputStyle} />
        </Field>
      </div>
      <Field label="Demo video URL" required htmlFor="pf-video" error={errs.video && 'Demo video URL is required'}>
        <Input id="pf-video" value={d.video} invalid={errs.video} onChange={(e) => set('video', e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Feature flag (internal)" required htmlFor="pf-gate" error={errs.gate && 'Feature flag is required'}>
        <Input id="pf-gate" value={d.gate} invalid={errs.gate} onChange={(e) => set('gate', e.target.value)} placeholder="module.area.flag_name" />
      </Field>
      <Field label="Configuration document URL" required htmlFor="pf-doc" error={errs.doc && 'Configuration document URL is required'} hint="For the implementation team. Customers never see it.">
        <Input id="pf-doc" value={d.doc} invalid={errs.doc} onChange={(e) => set('doc', e.target.value)} placeholder="https://" />
      </Field>
      <Checkbox checked={d.whatsNew} onChange={() => set('whatsNew', !d.whatsNew)} title="Lists it in the What's new pop-up and among the Overview highlights">
        Show in What's new
      </Checkbox>
    </Drawer>
  );
};

/* ---- Release drawer ---------------------------------------------------- */

interface Speaker { name: string; role: string }

export const ReleaseDrawer = ({
  open, month, create, monthOptions, onClose,
}: { open: boolean; month: string; create: boolean; monthOptions: string[]; onClose: () => void }) => {
  const { features, toast } = useFeatureStore();
  const { releaseFor, saveRelease } = useReleaseStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [m, setM] = useState(month);
  const [notes, setNotes] = useState<ReleaseNotesFile | undefined>();
  const [notesErr, setNotesErr] = useState('');
  const [web, setWeb] = useState(false);
  const [w, setW] = useState({ title: '', date: '', tz: 'IST', start: '15:00', end: '15:45', venue: 'Zoom', url: '', agenda: '' });
  const [banner, setBanner] = useState<string | undefined>();
  const [speakers, setSpeakers] = useState<Speaker[]>([{ name: '', role: '' }]);
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const mm = create ? monthOptions[0] ?? month : month;
    const rec = releaseFor(mm);
    setStep(1);
    setM(mm);
    setNotes(rec?.releaseNotes);
    setNotesErr('');
    const wb = rec?.webinar;
    setWeb(!!wb);
    setW({
      title: wb?.title ?? `${mm} release walkthrough`,
      date: wb?.startsAt?.slice(0, 10) ?? '',
      tz: wb?.timeZone ?? 'IST',
      start: wb?.startsAt?.slice(11, 16) ?? '15:00',
      end: wb?.endsAt ?? '15:45',
      venue: wb?.venue ?? 'Zoom',
      url: wb?.url ?? '',
      agenda: wb?.agenda ?? '',
    });
    setBanner(wb?.bannerUrl);
    setSpeakers(wb?.speakers?.length ? wb.speakers : [{ name: '', role: '' }]);
    setErrs({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, month, create]);

  const incl = useMemo(() => features.filter((f) => f.releaseMonth === m), [features, m]);

  const pickNotes = (file: File) => {
    if (!isReleaseNotesFile(file)) { setNotesErr('Upload a PDF or Word document'); return; }
    if (file.size > RELEASE_NOTES_MAX_BYTES) { setNotesErr('That file is over 10 MB'); return; }
    setNotesErr('');
    setNotes({ name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) });
  };

  const setWf = (k: keyof typeof w, v: string) => {
    setW((cur) => ({ ...cur, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: false }));
  };

  const save = () => {
    if (web) {
      const e: Record<string, boolean> = {
        title: !w.title.trim(), date: !w.date, start: !w.start, end: !w.end || w.end <= w.start,
        url: !isHttpUrl(w.url), agenda: !w.agenda.trim(), speakers: !speakers.some((s) => s.name.trim()),
      };
      setErrs(e);
      if (Object.values(e).some(Boolean)) return;
    }
    saveRelease({
      month: m,
      releaseNotes: notes,
      webinar: web
        ? {
            title: w.title.trim(), url: w.url.trim(), startsAt: `${w.date}T${w.start}`, endsAt: w.end, timeZone: w.tz,
            venue: w.venue, agenda: w.agenda.trim(), speakers: speakers.filter((s) => s.name.trim()), bannerUrl: banner,
          }
        : undefined,
    });
    toast(create ? `${m} release created` : `${m} release saved`);
    onClose();
  };

  const StepBtn = ({ n, label: l }: { n: 1 | 2; label: string }) => {
    const cur = step === n;
    const done = n === 1 && step === 2;
    return (
      <button
        type="button"
        role="listitem"
        aria-current={cur ? 'step' : undefined}
        onClick={() => setStep(n)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: cur ? 600 : 500, color: cur ? T.tx : T.tx3 }}
      >
        <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: cur || done ? T.brandSolid : T.su2, color: cur || done ? '#FFFFFF' : T.tx3 }}>
          {done ? <Check size={12} weight="bold" /> : n}
        </span>
        {l}
      </button>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={create ? 'Create release' : `${month} release`}
      subtitle={create ? 'Release notes and a webinar, for every feature in the month.' : `${incl.length} features · release notes and webinar`}
      footer={
        <>
          {step === 2 && <Button variant="secondary" onClick={() => setStep(1)} style={{ marginRight: 'auto' }}>Back</Button>}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {step === 1 ? <Button onClick={() => setStep(2)}>Continue</Button> : <Button onClick={save}>{create ? 'Create release' : 'Save release'}</Button>}
        </>
      }
    >
      <div role="list" aria-label="Steps" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StepBtn n={1} label="Release details" />
        <CaretRight size={12} weight="bold" color="var(--tx4)" aria-hidden />
        <StepBtn n={2} label="Webinar" />
      </div>

      {step === 1 && (
        <>
          {create && (
            <Field label="Release month" required htmlFor="rd-month" hint="Lists months that have features and no release yet.">
              <Select id="rd-month" value={m} onChange={(e) => setM(e.target.value)}>
                {monthOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </Field>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: SPACE.x2 }}>
              <span style={TYPE.fieldLabel}>Included features</span>
              <span style={{ height: 18, padding: '0 6px', borderRadius: 999, background: T.su2, color: T.tx2, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{incl.length}</span>
            </div>
            <div style={{ border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control, overflow: 'hidden' }}>
              {incl.length ? incl.map((f, i) => (
                <div key={f.id} style={{ padding: '8px 12px', borderTop: i ? `1px solid ${T.bd}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: T.tx3 }}>{f.id} · {f.productModule}</span>
                  </span>
                  <StatusPill published={f.published} />
                </div>
              )) : <div style={{ padding: 12, ...TYPE.helper }}>No features in this month yet.</div>}
            </div>
            <div style={HINT}>Features join a release by their production enablement date. Only published ones reach customers.</div>
          </div>
          <Field label="Release notes" error={notesErr} hint="One document for the whole release. PDF or Word, up to 10 MB.">
            <FilePick
              file={notes}
              accept={RELEASE_NOTES_ACCEPT}
              onPick={pickNotes}
              onRemove={() => setNotes(undefined)}
              emptyLabel="Upload release notes"
              invalid={!!notesErr}
              onView={notes ? () => window.open(notes.url, '_blank', 'noopener') : undefined}
            />
          </Field>
        </>
      )}

      {step === 2 && (
        web ? (
          <>
            <div onClick={() => setWeb(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.tx }}>Host a webinar for this release</span>
              <SwitchCtl on={web} onChange={() => setWeb(false)} label="Host a webinar" />
            </div>
            <Field label="Banner image" hint="Shown at the top of the webinar page. PNG or JPG, 1200 × 400 px works best.">
              <input ref={bannerRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setBanner(URL.createObjectURL(f)); e.target.value = ''; }} />
              {banner ? (
                <div role="img" aria-label="Webinar banner" style={{ position: 'relative', height: 120, borderRadius: RADIUS.control, border: `1px solid ${T.bd2}`, background: `center / cover no-repeat url(${banner})` }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                    <Button variant="secondary" compact onClick={() => bannerRef.current?.click()}>Replace</Button>
                    <IconButton size="compact" title="Remove banner" aria-label="Remove banner" onClick={() => setBanner(undefined)} style={{ background: T.card }}><X size={14} /></IconButton>
                  </div>
                </div>
              ) : (
                <Hoverable as="button" type="button" onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1px dashed ${T.bd2}`, borderRadius: RADIUS.control, background: T.su1, color: T.brand, fontFamily: 'inherit', ...TYPE.button, cursor: 'pointer' }} hoverStyle={{ background: T.brandSoft, borderColor: T.brandBorder }}>
                  <ImageIcon size={16} />Upload banner
                </Hoverable>
              )}
            </Field>
            <Field label="Title" required htmlFor="rd-title" error={errs.title && 'Add a title'}>
              <Input id="rd-title" value={w.title} invalid={errs.title} onChange={(e) => setWf('title', e.target.value)} placeholder="e.g. July 2026 release walkthrough" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.x3 }}>
              <Field label="Date" required htmlFor="rd-date" error={errs.date && 'Pick a date'}>
                <Input id="rd-date" type="date" value={w.date} invalid={errs.date} onChange={(e) => setWf('date', e.target.value)} min={toLocalInput(new Date()).slice(0, 10)} />
              </Field>
              <Field label="Time zone" required htmlFor="rd-tz">
                <Select id="rd-tz" value={w.tz} onChange={(e) => setWf('tz', e.target.value)}>
                  {['IST', 'GMT', 'SGT', 'GST', 'EST'].map((z) => <option key={z}>{z}</option>)}
                </Select>
              </Field>
              <Field label="Starts" required htmlFor="rd-start" error={errs.start && 'Add a start time'}>
                <Input id="rd-start" type="time" value={w.start} invalid={errs.start} onChange={(e) => setWf('start', e.target.value)} />
              </Field>
              <Field label="Ends" required htmlFor="rd-end" error={errs.end && (w.end ? 'End after the start time' : 'Add an end time')}>
                <Input id="rd-end" type="time" value={w.end} invalid={errs.end} onChange={(e) => setWf('end', e.target.value)} />
              </Field>
            </div>
            <Field label="Venue" required htmlFor="rd-venue">
              <Select id="rd-venue" value={w.venue} onChange={(e) => setWf('venue', e.target.value)}>
                {['Zoom', 'Microsoft Teams', 'Google Meet'].map((v) => <option key={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Join link" required htmlFor="rd-url" error={errs.url && (w.url ? 'Use a full https:// link' : 'Add the join link')} hint="Registered customers get this link. It goes live 10 minutes before the start.">
              <Input id="rd-url" value={w.url} invalid={errs.url} onChange={(e) => setWf('url', e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Agenda" required htmlFor="rd-agenda" error={errs.agenda && 'Add the agenda'} hint={`${w.agenda.length} / 600`}>
              <TextArea id="rd-agenda" rows={4} maxLength={600} invalid={errs.agenda} value={w.agenda} onChange={(e) => setWf('agenda', e.target.value)} placeholder="e.g. Welcome, product walkthrough, live Q&A" />
            </Field>
            <Field label="Speakers" required error={errs.speakers && 'Add at least one speaker'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
                {speakers.map((sp, i) => {
                  const ini = sp.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
                  const upd = (k: keyof Speaker, v: string) => {
                    setSpeakers((cur) => cur.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                    if (errs.speakers) setErrs((e) => ({ ...e, speakers: false }));
                  };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2 }}>
                      <span aria-hidden style={{ width: 32, height: 32, borderRadius: '50%', background: T.brandSoft, color: T.brand, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{ini}</span>
                      <Input aria-label="Speaker name" value={sp.name} onChange={(e) => upd('name', e.target.value)} placeholder="e.g. Ananya Rao" />
                      <Input aria-label="Speaker role" value={sp.role} onChange={(e) => upd('role', e.target.value)} placeholder="e.g. Host · Product" />
                      <IconButton size="compact" title={speakers.length > 1 ? 'Remove speaker' : 'A webinar needs at least one speaker'} aria-label="Remove speaker" disabled={speakers.length <= 1} onClick={() => setSpeakers((cur) => cur.filter((_, j) => j !== i))}><X size={14} /></IconButton>
                    </div>
                  );
                })}
                <Button variant="ghost" compact style={{ alignSelf: 'flex-start', color: T.brand }} onClick={() => setSpeakers((cur) => [...cur, { name: '', role: '' }])}>
                  <Plus size={12} weight="bold" />Add speaker
                </Button>
              </div>
            </Field>
          </>
        ) : (
          <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', border: `1px dashed ${T.bd2}`, borderRadius: RADIUS.control }}>
            <VideoCamera size={28} color="var(--tx4)" />
            <div style={{ ...TYPE.cellPrimary, marginTop: 8 }}>No webinar for this release</div>
            <div style={TYPE.helper}>Add one now or later from release details.</div>
            <Button style={{ marginTop: 12 }} onClick={() => setWeb(true)}>Add webinar</Button>
          </div>
        )
      )}
    </Drawer>
  );
};

/* ---- Help content drawer ------------------------------------------------ */

export const CONTENT_MODULES = ['General', ...MODULES];

export const ContentDrawer = ({
  open, content, initialKind, onClose, onSave,
}: {
  open: boolean;
  content: HelpContent | null;
  initialKind: ContentKind;
  onClose: () => void;
  onSave: (c: Omit<HelpContent, 'id' | 'published' | 'updated' | 'views'>, editId?: string) => void;
}) => {
  const { features } = useFeatureStore();
  const [kind, setKind] = useState<ContentKind>(initialKind);
  const [title, setTitle] = useState('');
  const [module, setModule] = useState(CONTENT_MODULES[0]);
  const [link, setLink] = useState('');
  const [file, setFile] = useState<HelpContent['file']>();
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [errs, setErrs] = useState<Record<string, string | false>>({});

  useEffect(() => {
    if (!open) return;
    setKind(content?.kind ?? initialKind);
    setTitle(content?.title ?? '');
    setModule(content?.module ?? CONTENT_MODULES[0]);
    setLink(content?.link ?? '');
    setFile(content?.file);
    setUrl(content?.url ?? '');
    setDesc(content?.desc ?? '');
    setErrs({});
  }, [open, content, initialKind]);

  const isVideo = kind === 'Video';

  const save = () => {
    const e: Record<string, string | false> = {
      title: !title.trim() && 'Title is required',
      file: !isVideo && !file && 'Upload the file',
      url: isVideo && (!url.trim() ? 'Video URL is required' : !isHttpUrl(url) && 'Use a full https:// link'),
    };
    setErrs(e);
    if (Object.values(e).some(Boolean)) return;
    onSave({ kind, title: title.trim(), module, link, file: isVideo ? undefined : file, url: isVideo ? url.trim() : '', desc: desc.trim() }, content?.id);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={content ? `Edit ${content.kind.toLowerCase()}` : 'Add help content'}
      subtitle={content ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{content.id} · {content.module}<StatusPill published={content.published} /></span>
      ) : 'Saved as unpublished. Only creators see it until you publish.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{content ? 'Update content' : 'Add content'}</Button></>}
    >
      <Field label="Content type" required>
        <Segmented options={['Document', 'Newsletter', 'Video'] as ContentKind[]} value={kind} onChange={(v) => setKind(v)} icons={KIND_ICON} />
      </Field>
      <Field label="Title" required htmlFor="cd-title" error={errs.title}>
        <Input id="cd-title" value={title} invalid={!!errs.title} onChange={(e) => { setTitle(e.target.value); setErrs((x) => ({ ...x, title: false })); }} placeholder="e.g. Custom report builder setup guide" />
      </Field>
      <Field label="Product module" required htmlFor="cd-module">
        <Select id="cd-module" value={module} onChange={(e) => setModule(e.target.value)}>
          {CONTENT_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>
      <Field label="Linked feature" htmlFor="cd-link" hint="Shows this content on the feature's page.">
        <Select id="cd-link" value={link} onChange={(e) => setLink(e.target.value)}>
          <option value="">Not linked</option>
          {features.map((f) => <option key={f.id} value={f.id}>{f.id} · {f.title}</option>)}
        </Select>
      </Field>
      {isVideo ? (
        <Field label="Video URL" required htmlFor="cd-url" error={errs.url} hint="A YouTube, Vimeo or Zwayam video link.">
          <Input id="cd-url" value={url} invalid={!!errs.url} onChange={(e) => { setUrl(e.target.value); setErrs((x) => ({ ...x, url: false })); }} placeholder="https://" />
        </Field>
      ) : (
        <Field label="File" required error={errs.file} hint={kind === 'Newsletter' ? 'The issue as a PDF, up to 10 MB.' : 'PDF or Word, up to 10 MB.'}>
          <FilePick
            file={file}
            accept={RELEASE_NOTES_ACCEPT}
            onPick={(f) => {
              if (!isReleaseNotesFile(f)) { setErrs((x) => ({ ...x, file: 'Upload a PDF or Word document' })); return; }
              if (f.size > RELEASE_NOTES_MAX_BYTES) { setErrs((x) => ({ ...x, file: 'That file is over 10 MB' })); return; }
              setErrs((x) => ({ ...x, file: false }));
              setFile({ name: f.name, size: f.size, url: URL.createObjectURL(f) });
            }}
            onRemove={() => setFile(undefined)}
            emptyLabel="Upload file"
            invalid={!!errs.file}
            onView={file?.url ? () => window.open(file.url, '_blank', 'noopener') : undefined}
          />
        </Field>
      )}
      <Field label="Short description" htmlFor="cd-desc" hint="Shown under the title in the Product Hub.">
        <TextArea id="cd-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One or two lines on what this covers." />
      </Field>
    </Drawer>
  );
};

/* ---- Pills and confirmations -------------------------------------------- */

export const StatusPill = ({ published }: { published: boolean }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: RADIUS.pill, fontSize: 12,
      fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: 0,
      background: published ? T.succSoft : T.warnSoft, color: published ? T.succText : T.warnText,
      border: `1px solid ${published ? T.succBorder : T.warnBorder}`,
    }}
  >
    {published ? 'Published' : 'Unpublished'}
  </span>
);

export const PublishConfirm = ({
  open, title, month, what = 'feature', onCancel, onConfirm,
}: { open: boolean; title: string; month?: string; what?: string; onCancel: () => void; onConfirm: () => void }) => (
  <Modal open={open} onClose={onCancel} labelledBy="publish-confirm-title" align="center" width={480} animate>
    <div role="alertdialog" aria-labelledby="publish-confirm-title" style={{ padding: SPACE.x5, display: 'flex', gap: SPACE.x3 }}>
      <Info size={24} weight="fill" color="var(--brand)" style={{ flex: 'none' }} />
      <div>
        <h2 id="publish-confirm-title" style={{ margin: 0, ...TYPE.sectionTitle }}>Publish this {what}?</h2>
        <p style={{ margin: '8px 0 0', ...TYPE.body }}>
          <b style={{ color: T.tx }}>{title}</b> becomes visible to every customer
          {month ? <> in the <b style={{ color: T.tx }}>{month}</b> release</> : ' in the Product Hub'}.
        </p>
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACE.x2, padding: `${SPACE.x3}px ${SPACE.x4}px`, borderTop: `1px solid ${T.bd2}` }}>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Publish</Button>
    </div>
  </Modal>
);

export const DeleteConfirm = ({
  open, heading, title, tail, onCancel, onConfirm,
}: { open: boolean; heading: string; title: string; tail: string; onCancel: () => void; onConfirm: () => void }) => {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const ok = typed === 'DELETE';
  return (
    <Modal open={open} onClose={onCancel} labelledBy="delete-confirm-title" align="center" width={480} animate>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x3, padding: SPACE.x4, borderBottom: `1px solid ${T.bd2}` }}>
        <h2 id="delete-confirm-title" style={{ margin: 0, flex: 1, ...TYPE.sectionTitle }}>{heading}</h2>
        <IconButton size="compact" title="Close" aria-label="Close" onClick={onCancel}><X size={16} /></IconButton>
      </div>
      <div style={{ padding: SPACE.x4, display: 'flex', flexDirection: 'column', gap: GAP.field }}>
        <p style={{ margin: 0, ...TYPE.body }}><b style={{ color: T.tx }}>{title}</b> {tail}</p>
        <Field label="Type DELETE to confirm" htmlFor="del-typed">
          <Input id="del-typed" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACE.x2, padding: `${SPACE.x3}px ${SPACE.x4}px`, borderTop: `1px solid ${T.bd2}` }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <span title={ok ? undefined : 'Type DELETE to turn this on'}>
          <Button
            variant="danger"
            onClick={() => ok && onConfirm()}
            aria-disabled={!ok}
            style={!ok ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Delete
          </Button>
        </span>
      </div>
    </Modal>
  );
};
