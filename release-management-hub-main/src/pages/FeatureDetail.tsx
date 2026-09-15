import { useNavigate, useParams } from 'react-router-dom';
import {
  MagnifyingGlass as Search, ArrowRight, Calendar, SlidersHorizontal, CheckCircle,
  Play, BookOpen, FileText, ArrowSquareOut as ExternalLink, Info, RocketLaunch as Rocket,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import FeatureTag from '@/components/hub/FeatureTag';
import Crumb from '@/components/primitives/Crumb';
import EmptyState from '@/components/primitives/EmptyState';
import { useFeatureStore } from '@/components/FeatureStore';
import { formatDate, valueOf } from '@/data/features';
import { moduleByName, plural } from '@/data/knowledge';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One feature.

   The page reads top to bottom in the order the questions get asked: what is
   it and is it on (header), which release brought it (banner), what changed
   and what it gets you (main), where to read more (references).
   --------------------------------------------------------------------------- */

/** A fact about the feature, as the guidelines' neutral --su2 chip. Facts are
 *  static configuration, so they are never tinted - the badges above the title
 *  are the only coloured things in the header, and they carry state. */
const MetaChip = ({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ size?: number | string }>;
  children: React.ReactNode;
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: `0 ${SPACE.x2}px`,
      borderRadius: RADIUS.tag,
      background: T.su2,
      color: T.tx3,
      fontSize: 12,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}
  >
    <Icon size={13} />
    {children}
  </span>
);

/** What happens to this feature at release, in the customer's words. */
const DEFAULT_LABEL: Record<string, string> = {
  'Default On': 'Default: On',
  'Default Off': 'Default: Off',
  'Non Deferrable': 'Not deferrable',
};

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const { byId, visibleFeatures, isCreator, toast } = useFeatureStore();
  const feature = featureId ? byId(featureId) : undefined;

  // A draft is only the creator's to see; anyone else lands back on the hub.
  if (!feature || (!feature.published && !isCreator)) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That feature isn't available"
        action={
          <Button variant="secondary" onClick={() => navigate('/release-hub/releases')}>
            <ArrowRight size={18} />Back to the Release Hub
          </Button>
        }
      >
        It may have been removed, or it hasn't been published yet.
      </EmptyState>
    );
  }

  const openRes = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, 'info');

  const [summary, ...rest] = (feature.summary || '').split('\n');
  const more = rest.join(' ');
  const value = valueOf(feature);
  const inRelease = visibleFeatures.filter((f) => f.releaseMonth === feature.releaseMonth).length;

  const statusTag =
    feature.status === 'Enabled' ? <Badge variant="success">Enabled</Badge>
    : feature.status === 'Enablement requested' ? <Badge variant="warning">Enablement requested</Badge>
    : feature.status === 'Contact CSM' ? <Badge variant="warning">Contact CSM</Badge>
    : <Badge variant="static">Disabled</Badge>;

  /* Resource links share a shape, so they share one class string rather than
     three near-identical ones. */
  const resLink = 'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand no-underline hover:bg-brand-soft';

  const kbModule = moduleByName(feature.productModule);

  return (
    <>
      <Crumb
        levels={[
          { label: 'Release Hub', path: '/release-hub/releases' },
          { label: feature.title },
        ]}
      />

      {/* ---- Header ------------------------------------------------------
          The feature's own name is the page title here, with its state above
          it and its facts below it. It used to sit on a brand-soft panel,
          which made the whole header read as a banner about the feature
          rather than as the page's own head. */}
      <Panel style={{ marginBottom: SPACE.x4 }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <FeatureTag tag={feature.featureTag} />
          <Badge variant="static">{feature.productModule}</Badge>
          {feature.published ? statusTag : <Badge variant="warning">Unpublished</Badge>}
        </div>

        {/* h2: the shell owns the page's h1. Styled as a page title. */}
        <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.pageTitle, lineHeight: 1.25 }}>
          {feature.title}
        </h2>

        <p style={{ margin: 0, maxWidth: '70ch', ...TYPE.body }}>
          {[summary, more].filter(Boolean).join(' ')}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: SPACE.x2,
            marginTop: SPACE.x3,
          }}
        >
          <MetaChip icon={Calendar}>
            {feature.published ? 'Released' : 'Planned for'} {formatDate(feature.prodEnablementDate)}
          </MetaChip>
          <MetaChip icon={Rocket}>{plural(inRelease, 'feature')} in this release</MetaChip>
          {feature.featureType && (
            <MetaChip icon={SlidersHorizontal}>
              {DEFAULT_LABEL[feature.featureType] ?? feature.featureType}
            </MetaChip>
          )}
          <MetaChip icon={FileText}>{feature.id}</MetaChip>
        </div>
      </Panel>

      {/* ---- Release banner ----------------------------------------------
          Full content width, one line, one action - the guidelines' banner.
          This was a card in the right-hand column, three lines tall, below
          everything else on the page; the release a feature shipped in is a
          fact about the whole page, so it belongs across the top of it. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACE.x2,
          marginBottom: SPACE.x4,
          background: T.brandSoft,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: T.brandBorder,
          borderRadius: RADIUS.control,
          padding: `${SPACE.x2}px ${SPACE.x3}px`,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, color: T.brand }} />
        <span
          style={{
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13,
            color: T.tx2,
          }}
        >
          Included in the {feature.releaseMonth} release.
        </span>
        <button
          type="button"
          onClick={() =>
            navigate(`/release-hub/releases?month=${encodeURIComponent(feature.releaseMonth)}`)
          }
          className="inline-flex shrink-0 items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
        >
          View release <ArrowRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 min-[901px]:grid-cols-[1.6fr_1fr]">
        <div>
          <Panel>
            <h3 style={{ margin: `0 0 ${SPACE.x3}px`, ...TYPE.sectionTitle }}>What&apos;s new</h3>
            {/* The summary is the header's description now, so this is the
                long-form explanation only. Repeating the summary here put the
                same two sentences twice on one screen; a feature that has no
                long form falls back to it rather than showing an empty
                section. */}
            <p className="mb-3 max-w-prose text-ink-700">
              {feature.description || [summary, more].filter(Boolean).join(' ')}
            </p>

            {value.length > 0 && (
              <>
                <h3 style={{ margin: `${SPACE.x5}px 0 ${SPACE.x3}px`, ...TYPE.sectionTitle }}>
                  Value delivered
                </h3>
                <ul className="mb-4 flex max-w-prose list-none flex-col gap-2 p-0">
                  {value.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-3 rounded-md border border-ink-150 bg-ink-25 p-3 text-sm"
                    >
                      <CheckCircle size={18} className="shrink-0 text-green-600" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* The page's one primary action. */}
            <Button
              onClick={() =>
                feature.productRoute
                  ? navigate(feature.productRoute)
                  : toast(`Opening ${feature.productModule} — this is where the capability lives.`)
              }
            >
              View live <ArrowRight size={18} />
            </Button>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <h3 style={{ margin: `0 0 ${SPACE.x3}px`, ...TYPE.sectionTitle }}>References</h3>
            <div className="flex flex-col gap-0.5">
              {feature.demoVideo && (
                <a
                  className={resLink}
                  href="#"
                  onClick={(e) => { e.preventDefault(); openRes('Demo video', feature.demoVideo); }}
                >
                  <Play size={18} />Watch demo
                  <ExternalLink size={14} className="ml-auto text-ink-500" />
                </a>
              )}
              <a
                className={resLink}
                href="#"
                onClick={(e) => { e.preventDefault(); openRes('Release notes', feature.releaseNotes); }}
              >
                <BookOpen size={18} />Read release notes
                <ArrowRight size={14} className="ml-auto text-ink-500" />
              </a>
              {feature.configurationDoc && (
                <a
                  className={resLink}
                  href="#"
                  onClick={(e) => { e.preventDefault(); openRes('Config document', feature.configurationDoc); }}
                >
                  <FileText size={18} />Configuration document
                  <ExternalLink size={14} className="ml-auto text-ink-500" />
                </a>
              )}
              {/* The other half of the hub: how the module works, rather than
                  what changed in it this release. */}
              {kbModule && (
                <a
                  className={resLink}
                  href={`/release-hub/knowledge/modules/${kbModule.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/release-hub/knowledge/modules/${kbModule.slug}`);
                  }}
                >
                  <BookOpen size={18} />{feature.productModule} documentation
                  <ArrowRight size={14} className="ml-auto text-ink-500" />
                </a>
              )}
            </div>
          </Panel>

          {isCreator && (
            <Panel>
              <h3 style={{ margin: `0 0 ${SPACE.x3}px`, ...TYPE.sectionTitle }}>Adoption</h3>
              <dl className="m-0">
                {([
                  ['Enabled customers', feature.enabledCustomers ?? 0, true],
                  ['Active customers', feature.activeCustomers ?? 0, true],
                  ['MAU (last 30 days)', (feature.mauLast30Days ?? 0).toLocaleString(), true],
                  ['DAU (30-day avg)', feature.dauLast30DayAvg ?? 0, true],
                  ['Feature flag', feature.productGate, false],
                ] as const).map(([term, value, isNumber]) => (
                  <div
                    key={term}
                    className="flex justify-between gap-4 border-b border-ink-150 py-3 text-sm last:border-b-0"
                  >
                    <dt className="text-ink-500">{term}</dt>
                    <dd
                      className={[
                        'm-0 text-right',
                        isNumber ? 'font-medium tabular-nums' : 'font-normal text-ink-500',
                      ].join(' ')}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
};

export default FeatureDetail;
