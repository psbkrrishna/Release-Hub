import { useNavigate, useParams } from "react-router-dom";
import {
  PiMagnifyingGlass, PiArrowRight, PiCalendarBlank, PiSlidersHorizontal, PiCheckCircle,
  PiPlay, PiBookOpen, PiFileText, PiArrowSquareOut,
} from "react-icons/pi";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useFeatureStore } from "@/components/FeatureStore";
import { formatDate } from "@/data/features";

// Passed to Badge's backgroundColor/textColor props, not className - Badge's
// "base" variant already defaults those same slots, and layering a second
// bg-*/text-* pair on top via className leaves two conflicting utility
// classes in one string with no reliable winner.
const STATUS_STYLE = {
  Enabled: { bg: "bg-[#EBF4EC]", text: "text-[#1F4E21]" },
  "Enablement requested": { bg: "bg-[#E7EEF6]", text: "text-[#07315A]" },
  "Contact CSM": { bg: "bg-[#FBF6E8]", text: "text-[#99770F]" },
  Disabled: { bg: "bg-gray-100", text: "text-grey-400" },
};

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const { byId, visibleFeatures, isCreator, toast } = useFeatureStore();
  const feature = featureId ? byId(featureId) : undefined;

  // A draft is only the creator's to see; anyone else lands back on the hub.
  if (!feature || (!feature.published && !isCreator)) {
    return (
      <div className="p-6 flex flex-col items-center text-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-grey-100 mb-4">
          <PiMagnifyingGlass size={26} />
        </div>
        <h4 className="text-base font-semibold text-grey-500 mb-1">That feature isn't available</h4>
        <p className="text-sm text-grey-300 max-w-sm mb-4">It may have been removed, or it hasn't been published yet.</p>
        <Button variant="secondary" onClick={() => navigate("/release-hub")} icon={<PiArrowRight />}>
          Back to the Release Hub
        </Button>
      </div>
    );
  }

  const openRes = (label, url) => toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, "info");
  const [summary, ...rest] = (feature.summary || "").split("\n");
  const more = rest.join(" ");
  const inRelease = visibleFeatures.filter((f) => f.releaseMonth === feature.releaseMonth).length;
  const statusLabel = feature.status === "Contact CSM" ? "Contact CSM" : feature.status;

  return (
    <div className="p-6">
      <PageBreadcrumb items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Release Hub", path: "/release-hub" }, { label: "Feature Details" }]} />

      <div className="rounded-lg border border-blue-200 bg-[#E7EEF6] p-6 mb-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="base" backgroundColor="bg-blue-600" textColor="text-white">{feature.featureTag}</Badge>
          <Badge variant="base" backgroundColor="bg-white" textColor="text-grey-400" className="border border-gray-200">{feature.productModule}</Badge>
          {feature.published ? (
            <Badge variant="base" backgroundColor={(STATUS_STYLE[statusLabel] ?? STATUS_STYLE.Disabled).bg} textColor={(STATUS_STYLE[statusLabel] ?? STATUS_STYLE.Disabled).text}>
              {statusLabel}
            </Badge>
          ) : (
            <Badge variant="yellow">Unpublished</Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold text-grey-500 mb-2">{feature.title}</h2>
        <p className="text-sm text-grey-400 max-w-3xl">{summary}</p>
        {more && <p className="text-sm text-grey-400 max-w-3xl mt-1">{more}</p>}
        <div className="flex items-center gap-4 text-sm text-grey-300 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <PiCalendarBlank size={15} /> {feature.published ? "Released" : "Planned for"} {formatDate(feature.prodEnablementDate)}
          </span>
          <span className="font-mono text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{feature.id}</span>
          <span className="flex items-center gap-1.5"><PiSlidersHorizontal size={15} /> {feature.featureType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="text-base font-semibold text-grey-500 mb-2">What's new</h3>
          <p className="text-sm text-grey-400 mb-5">{[summary, more].filter(Boolean).join(" ")}</p>

          <h3 className="text-base font-semibold text-grey-500 mb-2">What this helps you do</h3>
          <ul className="flex flex-col gap-2 mb-5">
            {(feature.announcementBullets ?? []).map((b) => (
              <li key={b} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-grey-500">
                <PiCheckCircle className="text-[#338137] flex-shrink-0 mt-0.5" size={18} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="primary"
            icon={<PiArrowRight />}
            iconPosition="right"
            onClick={() => (feature.productRoute ? navigate(feature.productRoute) : toast(`Opening ${feature.productModule} — this is where the capability lives.`))}
          >
            View it in the product
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
            <h3 className="text-base font-semibold text-grey-500 mb-3">Release resources</h3>
            <div className="flex flex-col">
              {feature.demoVideo && (
                <a href="#" onClick={(e) => { e.preventDefault(); openRes("Demo video", feature.demoVideo); }} className="flex items-center gap-2.5 py-2.5 text-blue-600 text-sm font-medium hover:bg-[#E7EEF6] rounded px-2 -mx-2">
                  <PiPlay size={18} /> Watch demo <PiArrowSquareOut className="ml-auto text-grey-100" size={15} />
                </a>
              )}
              <a href="#" onClick={(e) => { e.preventDefault(); openRes("Release notes", feature.releaseNotes); }} className="flex items-center gap-2.5 py-2.5 text-blue-600 text-sm font-medium hover:bg-[#E7EEF6] rounded px-2 -mx-2">
                <PiBookOpen size={18} /> Read release notes <PiArrowRight className="ml-auto text-grey-100" size={15} />
              </a>
              {feature.configurationDoc && (
                <a href="#" onClick={(e) => { e.preventDefault(); openRes("Config document", feature.configurationDoc); }} className="flex items-center gap-2.5 py-2.5 text-blue-600 text-sm font-medium hover:bg-[#E7EEF6] rounded px-2 -mx-2">
                  <PiFileText size={18} /> Configuration document <PiArrowSquareOut className="ml-auto text-grey-100" size={15} />
                </a>
              )}
            </div>
          </div>

          {isCreator && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
              <h3 className="text-base font-semibold text-grey-500 mb-3">Adoption</h3>
              <dl className="flex flex-col">
                {[
                  ["Enabled customers", feature.enabledCustomers ?? 0],
                  ["Active customers", feature.activeCustomers ?? 0],
                  ["MAU (last 30 days)", (feature.mauLast30Days ?? 0).toLocaleString()],
                  ["DAU (30-day avg)", feature.dauLast30DayAvg ?? 0],
                ].map(([dt, dd]) => (
                  <div key={dt} className="flex justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0 text-sm">
                    <dt className="text-grey-300">{dt}</dt>
                    <dd className="font-medium text-grey-500 tabular-nums text-right">{dd}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 py-2 text-sm">
                  <dt className="text-grey-300">Feature flag</dt>
                  <dd className="text-grey-300 text-right">{feature.productGate}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-[#E7EEF6] p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#07315A] mb-1">Included in</div>
            <h4 className="text-base font-semibold text-grey-500 mb-1">{feature.releaseMonth} Release</h4>
            <p className="text-sm text-grey-400 mb-3">{inRelease} features in this release.</p>
            <Button variant="secondary" icon={<PiArrowRight />} onClick={() => navigate(`/release-hub?month=${encodeURIComponent(feature.releaseMonth)}`)}>
              View this release
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetail;
