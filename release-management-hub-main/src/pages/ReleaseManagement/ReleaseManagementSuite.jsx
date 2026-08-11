import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-material.css";
import { PiPlus, PiMagnifyingGlass, PiFunnel, PiCalendarBlank, PiArrowRight } from "react-icons/pi";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useFeatureStore } from "@/components/FeatureStore";
import { MODULES, formatDate, sortReleaseMonths, supportQueue } from "@/data/features";
import CreateFeatureSheet from "./CreateFeatureSheet";
import {
  FeatureNameCell, CustomerNameCell, SummaryCell, ModulePillCell,
  ContentCell, ConfigDocCell, QueueStatusCell, StatusCell, ActionsCell,
} from "./cells";

ModuleRegistry.registerModules([AllCommunityModule]);

const StatChip = ({ n, label, tint }) => (
  <div className={`flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 h-10 whitespace-nowrap`}>
    <span className={`text-base font-semibold tabular-nums ${tint}`}>{n}</span>
    <span className="text-xs text-grey-300">{label}</span>
  </div>
);

const EmptyState = ({ isImplementation, onClear }) => (
  <div className="flex flex-col items-center text-center py-16 px-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-grey-100 mb-4">
      <PiMagnifyingGlass size={26} />
    </div>
    <h4 className="text-base font-semibold text-grey-500 mb-1">No {isImplementation ? "queue rows" : "features"} match your filters</h4>
    <p className="text-sm text-grey-300 max-w-sm mb-4">Try a broader search, or clear the module and release month filters to see everything.</p>
    <Button variant="secondary" onClick={onClear} icon={<PiArrowRight />}>Clear filters</Button>
  </div>
);

/* One rules-grid instance. `rows` are already this section's page slice - the
   surrounding component owns filtering, sorting-order and pagination, this
   just renders. domLayout="autoHeight" sizes the grid to its own row count,
   so a short Unpublished section and a longer Published one both render at
   their natural height with no internal scrollbar. */
const FeatureGrid = ({ rows, columnDefs, context, tall = true }) => (
  <div className={`rules-grid${tall ? " rules-grid--tall" : ""} ag-theme-material`}>
    <AgGridReact
      // ag-grid 33+ defaults to the new Theming API, which conflicts with
      // the legacy CSS-file theme (ag-grid.css + ag-theme-material.css) that
      // the .rules-grid overrides are written against - same as production's
      // own ApprovalMatrix.jsx. "legacy" opts back into CSS-file theming.
      theme="legacy"
      rowData={rows}
      columnDefs={columnDefs}
      defaultColDef={{ sortable: false, resizable: true, filter: false }}
      getRowId={(p) => (p.data.customer ? `${p.data.featureId}-${p.data.customer}` : p.data.id)}
      headerHeight={36}
      rowHeight={tall ? 68 : 44}
      domLayout="autoHeight"
      suppressCellFocus
      suppressRowClickSelection
      context={context}
    />
  </div>
);

const SectionBand = ({ label, count, note, tone = "default" }) => (
  <div className={`flex items-center gap-2 px-4 py-2 border-b border-t border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide ${tone === "amber" ? "text-[#99770F]" : "text-grey-300"}`}>
    {label}
    <span className="rounded-full bg-white border border-gray-200 px-1.5 text-grey-400 normal-case font-semibold tabular-nums">{count}</span>
    <span className="font-normal normal-case text-grey-100">{note}</span>
  </div>
);

const ReleaseManagementSuite = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useFeatureStore();
  const { features, visibleFeatures, isCreator, isImplementation, canToggle, toggleEnabled, publish, requestDelete, upsert, toast } = store;

  const [query, setQuery] = useState("");
  const [productModule, setProductModule] = useState("all");
  const [month, setMonth] = useState(() => searchParams.get("month") ?? "all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [resetKey, setResetKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  const openRes = (label, url) => toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, "info");

  const releaseMonths = useMemo(
    () => sortReleaseMonths([...new Set(visibleFeatures.map((f) => f.releaseMonth).filter(Boolean))]),
    [visibleFeatures],
  );

  const matches = (f) => {
    if (productModule !== "all" && f.productModule !== productModule) return false;
    if (month !== "all" && f.releaseMonth !== month) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [f.title, f.id, f.summary, f.productModule, f.featureTag, f.featureType, f.releaseMonth].join(" ").toLowerCase().includes(q);
  };

  const featureRows = useMemo(() => {
    const list = visibleFeatures.filter(matches);
    // Unpublished first: it is the creator's working set, and the published
    // rows below it are already out of their hands.
    return isCreator ? [...list.filter((f) => !f.published), ...list.filter((f) => f.published)] : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, productModule, month, query, isCreator]);

  const queueRows = useMemo(
    () =>
      supportQueue
        .filter((row) => {
          const f = features.find((x) => x.id === row.featureId);
          if (!f || !f.published) return false;
          if (productModule !== "all" && f.productModule !== productModule) return false;
          if (month !== "all" && f.releaseMonth !== month) return false;
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return [row.customer, f.title, f.id, f.productModule].join(" ").toLowerCase().includes(q);
        })
        // Feature fields first, then the queue row's own customer/status on
        // top - both the feature and the queue row carry a `status` field
        // with different meanings, and spreading the other way corrupts the
        // queue's support/enabled pill with the feature's Enabled/Disabled one.
        .map((row) => ({ ...features.find((x) => x.id === row.featureId), customer: row.customer, featureId: row.featureId, queueStatus: row.status })),
    [features, productModule, month, query],
  );

  const list = isImplementation ? queueRows : featureRows;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(page, pages);
  const from = (current - 1) * perPage;
  const to = Math.min(from + perPage, list.length);
  const slice = list.slice(from, to);

  const setFilter = (fn) => {
    fn();
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setProductModule("all");
    setMonth("all");
    setSearchParams({});
    setPage(1);
    setResetKey((k) => k + 1);
  };

  const publishedCount = features.filter((f) => f.published).length;
  const enabledCount = features.filter((f) => f.published && f.isEnabled).length;
  const draftCount = features.filter((f) => !f.published).length;
  const utilisation = publishedCount ? Math.round((100 * enabledCount) / publishedCount) : 0;
  const supportCount = supportQueue.filter((r) => r.status === "support").length;
  const queueEnabled = supportQueue.filter((r) => r.status === "enabled").length;

  const context = useMemo(
    () => ({ navigate, openRes, canToggle, toggleEnabled, onEdit: (f) => { setEditingFeature(f); setSheetOpen(true); }, onPublish: publish, onDeleteRequest: requestDelete }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, canToggle, toggleEnabled, publish, requestDelete],
  );

  const implColumns = useMemo(
    () => [
      { headerName: "Customer", pinned: "left", width: 170, cellRenderer: CustomerNameCell },
      { headerName: "Feature", pinned: "left", width: 260, cellRenderer: FeatureNameCell },
      { headerName: "Summary", flex: 1, minWidth: 260, cellRenderer: SummaryCell },
      { headerName: "Module", field: "productModule", width: 170, cellRenderer: ModulePillCell },
      { headerName: "Release Content", width: 130, cellRenderer: ContentCell },
      { headerName: "Config Doc", width: 110, cellRenderer: ConfigDocCell },
      { headerName: "Status", width: 170, cellRenderer: QueueStatusCell },
    ],
    [],
  );

  const hubColumns = useMemo(() => {
    const cols = [
      { headerName: "Release Date", pinned: "left", width: 120, valueFormatter: (p) => formatDate(p.data.prodEnablementDate) },
      { headerName: "Feature Name", pinned: "left", width: 260, cellRenderer: FeatureNameCell },
      { headerName: "Summary", flex: 1, minWidth: 220, cellRenderer: SummaryCell },
      { headerName: "Product Module", field: "productModule", width: 170, cellRenderer: ModulePillCell },
    ];
    if (isCreator) cols.push({ headerName: "Feature Type", field: "featureType", width: 130 });
    cols.push({ headerName: "Release Content", width: 130, cellRenderer: ContentCell, cellClass: isCreator ? "sepr" : undefined, headerClass: isCreator ? "sepr" : undefined });
    if (isCreator) {
      cols.push(
        { headerName: "# Enabled Customers", field: "enabledCustomers", width: 110, type: "rightAligned", valueFormatter: (p) => p.value ?? 0 },
        { headerName: "# Active Customers", field: "activeCustomers", width: 110, type: "rightAligned", valueFormatter: (p) => p.value ?? 0 },
        { headerName: "# MAU (Last 30 Days)", field: "mauLast30Days", width: 110, type: "rightAligned", valueFormatter: (p) => (p.value ?? 0).toLocaleString() },
        { headerName: "# DAU (Last 30 Day Avg)", field: "dauLast30DayAvg", width: 110, type: "rightAligned", valueFormatter: (p) => p.value ?? 0 },
        { headerName: "", pinned: "right", width: 56, cellRenderer: ActionsCell },
      );
    } else {
      cols.push({ headerName: "Status", width: 190, cellRenderer: StatusCell });
    }
    return cols;
  }, [isCreator]);

  const title = isImplementation ? "Implementation Support Queue" : "Release Management Suite";
  const unpublishedSlice = isCreator ? slice.filter((f) => !f.published) : [];
  const publishedSlice = isCreator ? slice.filter((f) => f.published) : slice;

  return (
    <div className="p-6">
      <PageBreadcrumb items={[{ label: "Dashboard", path: "/dashboard" }, { label: isImplementation ? "Implementation Support Queue" : "Release Management Hub" }]} />

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-grey-500">{title}</h1>
          {/* The customer-facing hub spans several releases now, so it carries
              no single-release strapline; the month filter states the scope. */}
          {isImplementation && <p className="mt-1 text-sm text-grey-300">Every customer awaiting enablement support for a released feature.</p>}
        </div>
        {isCreator && (
          <Button variant="primary" icon={<PiPlus />} onClick={() => { setEditingFeature(null); setSheetOpen(true); }}>
            Create Feature
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative w-full max-w-xs">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-100" size={16} />
          <Input
            key={resetKey}
            defaultValue=""
            placeholder={isImplementation ? "Search customers or features…" : "Search features…"}
            className="!pl-9"
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
          />
        </div>

        <div className="relative w-48">
          <PiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-grey-300" size={16} />
          <Select
            name="module"
            className="!pl-9"
            value={productModule}
            onChange={(e) => setFilter(() => setProductModule(e.target.value))}
            options={[{ value: "all", label: "All Modules" }, ...MODULES.map((m) => ({ value: m, label: m }))]}
          />
        </div>

        <div className="relative w-52">
          <PiCalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-grey-300" size={16} />
          <Select
            name="month"
            className="!pl-9"
            value={month}
            onChange={(e) => setFilter(() => setMonth(e.target.value))}
            options={[{ value: "all", label: "All Release Months" }, ...releaseMonths.map((m) => ({ value: m, label: m }))]}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {isImplementation ? (
            <>
              <StatChip n={supportCount} label="Support Required" tint="text-[#99770F]" />
              <StatChip n={queueEnabled} label="Enabled" tint="text-[#1F4E21]" />
            </>
          ) : (
            <>
              {isCreator && <StatChip n={draftCount} label="Unpublished" tint="text-[#99770F]" />}
              <StatChip n={publishedCount} label="Published Features" tint="text-blue-600" />
              <StatChip n={enabledCount} label="Enabled Features" tint="text-[#1F4E21]" />
              <StatChip n={`${utilisation}%`} label="Platform Utilization" tint="text-blue-600" />
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState isImplementation={isImplementation} onClear={clearFilters} />
        ) : isImplementation ? (
          <FeatureGrid rows={slice} columnDefs={implColumns} context={context} />
        ) : isCreator ? (
          <>
            {unpublishedSlice.length > 0 && (
              <>
                <SectionBand label="Unpublished" count={featureRows.filter((f) => !f.published).length} note="Not visible to customers until published" tone="amber" />
                <FeatureGrid rows={unpublishedSlice} columnDefs={hubColumns} context={context} />
              </>
            )}
            {publishedSlice.length > 0 && (
              <>
                <SectionBand label="Published" count={featureRows.filter((f) => f.published).length} note="Live for customers" />
                <FeatureGrid rows={publishedSlice} columnDefs={hubColumns} context={context} />
              </>
            )}
          </>
        ) : (
          <FeatureGrid rows={slice} columnDefs={hubColumns} context={context} />
        )}

        {list.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-2">
            <Pagination
              currentPage={current}
              totalPages={pages}
              totalCount={list.length}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => setFilter(() => setPerPage(n))}
              perPageOptions={["10", "20", "50"]}
            />
          </div>
        )}
      </div>

      <CreateFeatureSheet
        open={sheetOpen}
        feature={editingFeature}
        onClose={() => { setSheetOpen(false); setEditingFeature(null); }}
        onSubmit={(feature, isEdit) => { upsert(feature, isEdit); setSheetOpen(false); setEditingFeature(null); }}
      />
    </div>
  );
};

export default ReleaseManagementSuite;
