import { useEffect, useMemo, useState } from "react";
import { PiX } from "react-icons/pi";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MODULES, FEATURE_TYPES, addDays, formatDate, releaseMonthOf } from "@/data/features";

/* Every field in the pane is required. The list is declared once and drives
   both the labels and the validation, so a new field can't be added to the
   form and silently skip the check. */
const FIELDS = [
  { key: "title", label: "Feature Title", error: "Feature title is required." },
  { key: "featureTag", label: "Feature Tag", error: "Feature tag is required." },
  { key: "summary", label: "Feature Summary", error: "Feature summary is required." },
  { key: "productModule", label: "Product Module", error: "Product module is required." },
  { key: "featureType", label: "Feature Type", error: "Feature type is required." },
  { key: "releaseNotes", label: "Release Notes URL", error: "Release notes URL is required." },
  { key: "demoVideo", label: "Demo Video URL", error: "Demo video URL is required." },
  { key: "prodEnablementDate", label: "Production Enablement Date", error: "Production enablement date is required." },
  { key: "productGate", label: "Feature Flag (Internal)", error: "Feature flag is required." },
  { key: "configurationDoc", label: "Configuration Document URL", error: "Configuration document URL is required." },
];

const EMPTY = {
  title: "",
  featureTag: "Enhancement",
  summary: "",
  productModule: MODULES[0],
  featureType: "Default On",
  releaseNotes: "",
  demoVideo: "",
  prodEnablementDate: "2026-07-01",
  productGate: "",
  configurationDoc: "",
};

/* Raw, fully-controlled inputs rather than the barrel Input/Select
   components - this matches how production's own DepartmentsManagement
   builds its Sheet-based create/edit form. Those wrapper components are
   genuinely uncontrolled (Input seeds from defaultValue once and ignores
   further value changes), which doesn't fit a form that has to reset and
   re-prefill every time it's reopened for a different feature. */
const fieldClasses = (error) =>
  `w-full h-10 px-3 rounded-lg border text-base text-zinc-900 placeholder:text-[#999] focus:outline-none transition-colors ${
    error ? "border-red-500 focus:border-red-500" : "border-zinc-300 hover:border-zinc-400 focus:border-zinc-400"
  }`;

const CreateFeatureSheet = ({ open, feature, onClose, onSubmit }) => {
  const [form, setForm] = useState(EMPTY);
  const [invalid, setInvalid] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setInvalid(new Set());
    setForm(
      feature
        ? {
            title: feature.title,
            featureTag: feature.featureTag,
            summary: feature.summary ?? "",
            productModule: feature.productModule,
            featureType: feature.featureType ?? "Default On",
            releaseNotes: feature.releaseNotes ?? "",
            demoVideo: feature.demoVideo ?? "",
            prodEnablementDate: feature.prodEnablementDate,
            productGate: feature.productGate ?? "",
            configurationDoc: feature.configurationDoc ?? "",
          }
        : EMPTY,
    );
  }, [open, feature]);

  // Non Deferrable features have no deferment window to show.
  const deferrable = useMemo(() => {
    if (form.featureType === "Non Deferrable") return "Not deferrable";
    if (!form.prodEnablementDate) return "";
    return formatDate(addDays(form.prodEnablementDate, 90));
  }, [form.featureType, form.prodEnablementDate]);

  // A field stops complaining as soon as it's filled in.
  const set = (key, value) => {
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
    const missing = FIELDS.filter((f) => !String(form[f.key] ?? "").trim()).map((f) => f.key);
    if (missing.length) {
      setInvalid(new Set(missing));
      document.getElementById(`in-${missing[0]}`)?.focus();
      return;
    }

    const type = form.featureType;
    // Feature Type carries enablement: Default Off ships disabled, the other
    // two ship on. There is no separate Enabled switch to disagree with it.
    const isEnabled = type !== "Default Off";
    const prod = form.prodEnablementDate;

    onSubmit(
      {
        ...(feature ?? {}),
        id: feature?.id ?? "FEAT-NEW",
        title: form.title.trim(),
        featureTag: form.featureTag,
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
        deferrableTill: type === "Non Deferrable" ? undefined : addDays(prod, 90),
        supportNeeded: feature?.supportNeeded ?? false,
        isEnabled,
        status: isEnabled ? "Enabled" : "Disabled",
        published: feature?.published ?? false,
        announcementBullets: feature?.announcementBullets ?? [form.summary.split("\n")[0]].filter(Boolean),
        enabledCustomers: feature?.enabledCustomers ?? 0,
        activeCustomers: feature?.activeCustomers ?? 0,
        mauLast30Days: feature?.mauLast30Days ?? 0,
        dauLast30DayAvg: feature?.dauLast30DayAvg ?? 0,
      },
      Boolean(feature),
    );
  };

  const errorOf = (key) => (invalid.has(key) ? FIELDS.find((f) => f.key === key).error : undefined);
  const Req = () => <span className="text-red-600">*</span>;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[600px]">
        <SheetHeader className="bg-[#E7EEF6] px-6 py-4 border-b border-gray-200 flex-shrink-0 flex-row items-start justify-between">
          <div>
            <SheetTitle className="text-xl text-[#0D59A3]">{feature ? "Edit feature" : "New feature"}</SheetTitle>
            <SheetDescription>Fields marked with * are required.</SheetDescription>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-[#0D59A3] hover:bg-black/5 flex-shrink-0">
            <PiX size={20} />
          </button>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <Label htmlFor="in-title" className="block text-sm font-medium text-grey-400 mb-1.5">Feature Title <Req /></Label>
              <input id="in-title" placeholder="e.g. Skills Gap Analysis" value={form.title} onChange={(e) => set("title", e.target.value)} className={fieldClasses(invalid.has("title"))} />
              <ErrorMessage message={errorOf("title")} />
            </div>

            <div>
              <Label htmlFor="in-featureTag" className="block text-sm font-medium text-grey-400 mb-1.5">Feature Tag <Req /></Label>
              <select id="in-featureTag" value={form.featureTag} onChange={(e) => set("featureTag", e.target.value)} className={fieldClasses(invalid.has("featureTag"))}>
                <option>Enhancement</option>
                <option>New Feature</option>
              </select>
              <ErrorMessage message={errorOf("featureTag")} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="in-summary" className="block text-sm font-medium text-grey-400 mb-1.5">Feature Summary <Req /></Label>
              <textarea
                id="in-summary"
                placeholder="First line is the summary shown in the table. Any further lines appear under Show more."
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={3}
                className={`${fieldClasses(invalid.has("summary"))} h-auto py-2 resize-y`}
              />
              <p className="text-xs text-grey-100 mt-1">Line 1 shows in the table; later lines expand behind "Show more".</p>
              <ErrorMessage message={errorOf("summary")} />
            </div>

            <div>
              <Label htmlFor="in-productModule" className="block text-sm font-medium text-grey-400 mb-1.5">Product Module <Req /></Label>
              <select id="in-productModule" value={form.productModule} onChange={(e) => set("productModule", e.target.value)} className={fieldClasses(invalid.has("productModule"))}>
                {MODULES.map((m) => <option key={m}>{m}</option>)}
              </select>
              <ErrorMessage message={errorOf("productModule")} />
            </div>

            <div>
              <Label htmlFor="in-featureType" className="block text-sm font-medium text-grey-400 mb-1.5">Feature Type <Req /></Label>
              <select id="in-featureType" value={form.featureType} onChange={(e) => set("featureType", e.target.value)} className={fieldClasses(invalid.has("featureType"))}>
                {FEATURE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <p className="text-xs text-grey-100 mt-1">Default On ships enabled. Default Off waits for the customer. Non Deferrable cannot be postponed.</p>
              <ErrorMessage message={errorOf("featureType")} />
            </div>

            <div>
              <Label htmlFor="in-releaseNotes" className="block text-sm font-medium text-grey-400 mb-1.5">Release Notes URL <Req /></Label>
              <input id="in-releaseNotes" placeholder="https://" value={form.releaseNotes} onChange={(e) => set("releaseNotes", e.target.value)} className={fieldClasses(invalid.has("releaseNotes"))} />
              <ErrorMessage message={errorOf("releaseNotes")} />
            </div>

            <div>
              <Label htmlFor="in-demoVideo" className="block text-sm font-medium text-grey-400 mb-1.5">Demo Video URL <Req /></Label>
              <input id="in-demoVideo" placeholder="https://" value={form.demoVideo} onChange={(e) => set("demoVideo", e.target.value)} className={fieldClasses(invalid.has("demoVideo"))} />
              <ErrorMessage message={errorOf("demoVideo")} />
            </div>

            <div>
              <Label htmlFor="in-prodEnablementDate" className="block text-sm font-medium text-grey-400 mb-1.5">Production Enablement Date <Req /></Label>
              <input id="in-prodEnablementDate" type="date" value={form.prodEnablementDate} onChange={(e) => set("prodEnablementDate", e.target.value)} className={fieldClasses(invalid.has("prodEnablementDate"))} />
              <ErrorMessage message={errorOf("prodEnablementDate")} />
            </div>

            <div>
              <Label htmlFor="in-deferrable" className="block text-sm font-medium text-grey-400 mb-1.5">Deferrable Till Date</Label>
              <input id="in-deferrable" readOnly value={deferrable} className={`${fieldClasses(false)} bg-gray-50 text-grey-300`} />
              <p className="text-xs text-grey-100 mt-1">Auto-calculated as Production Enablement Date + 90 days.</p>
            </div>

            <div>
              <Label htmlFor="in-productGate" className="block text-sm font-medium text-grey-400 mb-1.5">Feature Flag (Internal) <Req /></Label>
              <input id="in-productGate" placeholder="module.area.flag_name" value={form.productGate} onChange={(e) => set("productGate", e.target.value)} className={fieldClasses(invalid.has("productGate"))} />
              <ErrorMessage message={errorOf("productGate")} />
            </div>

            <div>
              <Label htmlFor="in-configurationDoc" className="block text-sm font-medium text-grey-400 mb-1.5">Configuration Document URL <Req /></Label>
              <input id="in-configurationDoc" placeholder="https://" value={form.configurationDoc} onChange={(e) => set("configurationDoc", e.target.value)} className={fieldClasses(invalid.has("configurationDoc"))} />
              <ErrorMessage message={errorOf("configurationDoc")} />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{feature ? "Update Feature" : "Create Feature"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateFeatureSheet;
