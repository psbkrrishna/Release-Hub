import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  if (!open) return null;

  const fieldClass = (key: FieldKey, extra = '') =>
    `fld${extra ? ` ${extra}` : ''}${invalid.has(key) ? ' invalid' : ''}`;
  const errorOf = (key: FieldKey) => FIELDS.find((f) => f.key === key)!.error;
  const Req = () => <span className="req">*</span>;

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={feature ? 'Edit feature' : 'New feature'}>
        <div className="modal-head">
          <h3>{feature ? 'Edit feature' : 'New feature'}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><i className="ph ph-x" /></button>
        </div>

        <div className="modal-body">
          <div className="f2">
            <div className={fieldClass('title')}>
              <label htmlFor="in-title">Feature Title <Req /></label>
              <input id="in-title" placeholder="e.g. Skills Gap Analysis" value={form.title} onChange={(e) => set('title', e.target.value)} />
              <span className="err">{errorOf('title')}</span>
            </div>

            <div className={fieldClass('featureTag')}>
              <label htmlFor="in-featureTag">Feature Tag <Req /></label>
              <select id="in-featureTag" value={form.featureTag} onChange={(e) => set('featureTag', e.target.value)}>
                <option>Enhancement</option>
                <option>New Feature</option>
              </select>
              <span className="err">{errorOf('featureTag')}</span>
            </div>

            <div className={fieldClass('summary', 'span2')}>
              <label htmlFor="in-summary">Feature Summary <Req /></label>
              <textarea id="in-summary" placeholder="First line is the summary shown in the table. Any further lines appear under Show more." value={form.summary} onChange={(e) => set('summary', e.target.value)} />
              <span className="hint">Line 1 shows in the table; later lines expand behind "Show more".</span>
              <span className="err">{errorOf('summary')}</span>
            </div>

            <div className={fieldClass('productModule')}>
              <label htmlFor="in-productModule">Product Module <Req /></label>
              <select id="in-productModule" value={form.productModule} onChange={(e) => set('productModule', e.target.value)}>
                {MODULES.map((m) => <option key={m}>{m}</option>)}
              </select>
              <span className="err">{errorOf('productModule')}</span>
            </div>

            <div className={fieldClass('featureType')}>
              <label htmlFor="in-featureType">Feature Type <Req /></label>
              <select id="in-featureType" value={form.featureType} onChange={(e) => set('featureType', e.target.value)}>
                {FEATURE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <span className="hint">Default On ships enabled. Default Off waits for the customer. Non Deferrable cannot be postponed.</span>
              <span className="err">{errorOf('featureType')}</span>
            </div>

            <div className={fieldClass('releaseNotes')}>
              <label htmlFor="in-releaseNotes">Release Notes URL <Req /></label>
              <input id="in-releaseNotes" placeholder="https://" value={form.releaseNotes} onChange={(e) => set('releaseNotes', e.target.value)} />
              <span className="err">{errorOf('releaseNotes')}</span>
            </div>

            <div className={fieldClass('demoVideo')}>
              <label htmlFor="in-demoVideo">Demo Video URL <Req /></label>
              <input id="in-demoVideo" placeholder="https://" value={form.demoVideo} onChange={(e) => set('demoVideo', e.target.value)} />
              <span className="err">{errorOf('demoVideo')}</span>
            </div>

            <div className={fieldClass('prodEnablementDate')}>
              <label htmlFor="in-prodEnablementDate">Production Enablement Date <Req /></label>
              <input id="in-prodEnablementDate" type="date" value={form.prodEnablementDate} onChange={(e) => set('prodEnablementDate', e.target.value)} />
              <span className="err">{errorOf('prodEnablementDate')}</span>
            </div>

            <div className="fld">
              <label htmlFor="in-deferrable">Deferrable Till Date</label>
              <input id="in-deferrable" readOnly value={deferrable} />
              <span className="hint">Auto-calculated as Production Enablement Date + 90 days.</span>
            </div>

            <div className={fieldClass('productGate')}>
              <label htmlFor="in-productGate">Feature Flag (Internal) <Req /></label>
              <input id="in-productGate" placeholder="module.area.flag_name" value={form.productGate} onChange={(e) => set('productGate', e.target.value)} />
              <span className="err">{errorOf('productGate')}</span>
            </div>

            <div className={fieldClass('configurationDoc')}>
              <label htmlFor="in-configurationDoc">Configuration Document URL <Req /></label>
              <input id="in-configurationDoc" placeholder="https://" value={form.configurationDoc} onChange={(e) => set('configurationDoc', e.target.value)} />
              <span className="err">{errorOf('configurationDoc')}</span>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{feature ? 'Update Feature' : 'Create Feature'}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateFeatureModal;
