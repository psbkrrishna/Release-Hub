import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PiBookOpen, PiPlay, PiFileText, PiWarningCircle, PiClockCounterClockwise,
  PiDotsThreeVertical, PiPencilSimple, PiArrowRight, PiRocketLaunch, PiTrash, PiCheck,
} from "react-icons/pi";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

/* ---------------------------------------------------------------------------
   ag-grid cellRenderer components for the Release Hub table. Each receives
   ag-grid's ICellRendererParams as props - `.data` is the row's Feature (or
   support-queue row), `.context` is whatever ReleaseManagementSuite passed
   to <AgGridReact context={...}>, carrying navigate/openRes/store actions
   that aren't part of the row data itself.
   --------------------------------------------------------------------------- */

export const FeatureNameCell = (params) => {
  const f = params.data;
  const { navigate } = params.context;
  const isNew = f.featureTag === "New Feature";
  return (
    <div className="py-2 leading-tight">
      <button
        onClick={() => navigate(`/release-hub/features/${f.id}`)}
        className="text-sm font-semibold text-grey-500 hover:text-blue-600 hover:underline text-left rounded"
      >
        {f.title}
      </button>
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        {isNew ? <Badge variant="purple">New Feature</Badge> : <Badge variant="base" backgroundColor="bg-gray-100" textColor="text-grey-400">Enhancement</Badge>}
        <span className="text-[11px] font-mono text-grey-300 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 leading-none">{f.id}</span>
      </div>
    </div>
  );
};

export const CustomerNameCell = (params) => (
  <span className="text-sm font-semibold text-grey-500">{params.data.customer}</span>
);

/* Two-line clamp with a "More" link that opens a floating popover holding
   the full text - this keeps every row a fixed height, which ag-grid needs
   (rows don't reflow when their content grows the way a plain HTML table's
   would), while still letting a reader see the whole summary without
   leaving the table. */
export const SummaryCell = (params) => {
  const text = (params.data.summary || "").split("\n").join(" ");
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [pos, setPos] = useState(null);
  const textRef = useRef(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !popRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const p = popRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(b.left, window.innerWidth - p.width - 8));
    const top = Math.min(b.bottom + 4, window.innerHeight - p.height - 8);
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", () => setOpen(false), true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="py-2">
      <p ref={textRef} className="text-sm text-grey-400 overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {text}
      </p>
      {overflows && (
        <button ref={btnRef} onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-blue-600 hover:underline mt-0.5">
          {open ? "Hide" : "Show more"}
        </button>
      )}
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
            className="z-[70] w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-xl text-sm text-grey-500"
          >
            {text}
          </div>,
          document.body,
        )}
    </div>
  );
};

export const ModulePillCell = (params) => (
  <Badge variant="base" backgroundColor="bg-gray-100" textColor="text-grey-400">{params.value}</Badge>
);

export const ContentCell = (params) => {
  const f = params.data;
  const { openRes } = params.context;
  const items = [];
  if (f.releaseNotes) items.push(["notes", PiBookOpen, "Release notes", f.releaseNotes]);
  if (f.demoVideo) items.push(["video", PiPlay, "Demo video", f.demoVideo]);
  if (f.configurationDoc) items.push(["config", PiFileText, "Config document", f.configurationDoc]);
  if (!items.length) return <span className="text-grey-100 text-sm">—</span>;
  return (
    <div className="flex items-center gap-1">
      {items.map(([key, Icon, label, url]) => (
        <button key={key} title={label} onClick={() => openRes(label, url)} className="p-1.5 text-blue-600 hover:bg-[#E7EEF6] rounded">
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};

export const ConfigDocCell = (params) => {
  const f = params.data;
  const { openRes } = params.context;
  if (!f.configurationDoc) return <span className="text-grey-100 text-sm">—</span>;
  return (
    <button title="Config document" onClick={() => openRes("Config document", f.configurationDoc)} className="p-1.5 text-blue-600 hover:bg-[#E7EEF6] rounded">
      <PiFileText size={16} />
    </button>
  );
};

export const QueueStatusCell = (params) =>
  params.data.queueStatus === "support" ? (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#FBF6E8] px-2 py-1 text-xs font-medium text-[#99770F]">
      <PiWarningCircle size={13} /> Support Requested
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#EBF4EC] px-2 py-1 text-xs font-medium text-[#1F4E21]">
      <PiCheck size={13} /> Enabled
    </span>
  );

export const StatusCell = (params) => {
  const f = params.data;
  const { canToggle, toggleEnabled } = params.context;

  if (f.status === "Contact CSM") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#FBF6E8] px-2 py-1 text-xs font-medium text-[#99770F]">
        <PiWarningCircle size={13} /> Contact CSM
      </span>
    );
  }
  if (f.status === "Enablement requested") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#E7EEF6] px-2 py-1 text-xs font-medium text-[#07315A]">
        <PiClockCounterClockwise size={13} /> Enablement requested
      </span>
    );
  }
  const tip = canToggle ? `Toggle ${f.title}` : "Read-only for this role — open the feature to request enablement";
  return (
    <div className="flex items-center gap-2" title={tip}>
      <Switch checked={f.isEnabled} onChange={() => toggleEnabled(f.id)} disabled={!canToggle} color="green" variant="small" />
      <span className="text-sm font-medium text-grey-400">{f.isEnabled ? "Enabled" : "Disabled"}</span>
    </div>
  );
};

/* Actions follow publication state: a published feature is already in
   customers' hands, so it can be corrected but not withdrawn or deleted; an
   unpublished one is still the creator's to change or drop. Uses Headless
   UI's Menu (via DropdownMenu) rather than a hand-rolled portal menu -
   its `anchor` prop already portals and positions the panel, which is what
   keeps a row action menu from being clipped by ag-grid's own cell overflow. */
export const ActionsCell = (params) => {
  const f = params.data;
  const { navigate, onEdit, onPublish, onDeleteRequest } = params.context;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label={`Actions for ${f.title}`} className="p-1.5 text-grey-300 hover:text-grey-500 hover:bg-gray-100 rounded">
            <PiDotsThreeVertical size={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {f.published ? (
            <>
              <DropdownMenuItem onSelect={() => onEdit(f)}>
                <PiPencilSimple className="mr-2" size={16} /> Edit feature
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate(`/release-hub/features/${f.id}`)}>
                <PiArrowRight className="mr-2" size={16} /> View feature details
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => onPublish(f.id)}>
                <PiRocketLaunch className="mr-2" size={16} /> Publish feature
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(f)}>
                <PiPencilSimple className="mr-2" size={16} /> Edit feature
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onDeleteRequest(f.id)} className="text-red-600">
                <PiTrash className="mr-2" size={16} /> Delete feature
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
