import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, Play, ArrowSquareOut as ExternalLink, ArrowRight,
  MagnifyingGlass as Search, Clock, RocketLaunch as Rocket, MonitorPlay,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import Panel from '@/components/primitives/Panel';
import FeatureTag from '@/components/hub/FeatureTag';
import Button from '@/components/primitives/Button';
import Crumb from '@/components/primitives/Crumb';
import IconButton from '@/components/primitives/IconButton';
import EmptyState from '@/components/primitives/EmptyState';
import { useFeatureStore } from '@/components/FeatureStore';
import { moduleBySlug, plural } from '@/data/knowledge';
import { formatDate } from '@/data/features';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One module: its documents, its videos, and every feature that has shipped in
   it. That last section is the point of merging the two halves - from a module
   you can reach the feature, and from the feature you can reach the module.

   Its own page, with the module list as a rail down the left rather than a
   panel at the foot of the right-hand column. Navigation belongs beside the
   content, not after all of it.
   --------------------------------------------------------------------------- */

/** A count, as the guidelines' neutral --su2 chip. These are facts about the
 *  module, so none of them is tinted. */
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

const ModuleDocs = () => {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const { visibleFeatures, toast } = useFeatureStore();

  const module = moduleBySlug(moduleSlug);

  if (!module) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That module isn't in the documentation"
        action={
          <Button variant="secondary" onClick={() => navigate('/release-hub/knowledge')}>
            <ArrowRight size={18} />Back to all modules
          </Button>
        }
      >
        It may have been renamed. Every module is listed on the documentation home.
      </EmptyState>
    );
  }

  const open = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} isn't attached yet.`, 'info');

  const features = visibleFeatures
    .filter((f) => f.productModule === module.name)
    .sort((a, b) => b.prodEnablementDate.localeCompare(a.prodEnablementDate));

  return (
    <>
      {/* ---- Page header -------------------------------------------------
          Crumb, the module's name as the title, and its counts as neutral
          chips beneath. The brand-soft hero tile this replaced said nothing
          the title did not, and pushed the documents below the fold. */}
      <Crumb
        levels={[
          { label: 'Documentation', path: '/release-hub/knowledge' },
          { label: module.name },
        ]}
      />

      <div style={{ marginBottom: SPACE.x6 }}>
        {/* h2: the shell owns the page's h1. Styled as a page title. */}
        <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.pageTitle, lineHeight: 1.25 }}>
          {module.name}
        </h2>
        {/* One line only - the blurb wrapped to three here, which is what
            made the header block look unsettled. */}
        <p
          style={{
            margin: `0 0 ${SPACE.x3}px`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...TYPE.body,
          }}
        >
          {module.tagline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x2 }}>
          <MetaChip icon={FileText}>{plural(module.docs.length, 'document')}</MetaChip>
          <MetaChip icon={MonitorPlay}>{plural(module.videos.length, 'video')}</MetaChip>
          <MetaChip icon={Rocket}>{plural(features.length, 'feature')} released</MetaChip>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 min-[1181px]:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE.x2,
                margin: `0 0 ${SPACE.x4}px`,
                ...TYPE.sectionTitle,
              }}
            >
              <FileText size={18} />Documents
            </h3>
            {module.docs.length ? (
              <div className="flex flex-col gap-3">
                {module.docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-ink-150 bg-ink-25 p-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold">{doc.title}</h4>
                      <p className="mt-1 text-13 text-ink-600">{doc.blurb}</p>
                      <span className="mt-2 flex items-center gap-1 text-xs text-ink-500">
                        <Clock size={12} />{doc.minutes} min read
                      </span>
                    </div>
                    <IconButton
                      tone="brand"
                      className="shrink-0"
                      title={`Open ${doc.title}`}
                      aria-label={`Open ${doc.title}`}
                      onClick={() => open(doc.title, doc.url)}
                    >
                      <ExternalLink size={16} />
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-600">
                No documents yet. The features below carry their own release notes.
              </p>
            )}
          </Panel>

          <Panel>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE.x2,
                margin: `0 0 ${SPACE.x4}px`,
                ...TYPE.sectionTitle,
              }}
            >
              <Rocket size={18} />Features
            </h3>
            {features.length ? (
              <div className="flex flex-col gap-2">
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => navigate(`/release-hub/features/${f.id}`)}
                    className="flex items-center gap-3 rounded-lg border border-ink-150 bg-white p-3 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{f.title}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <FeatureTag tag={f.featureTag} />
                        <span className="text-xs text-ink-500">
                          {f.releaseMonth} · {formatDate(f.prodEnablementDate)}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-ink-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-600">Nothing has shipped in this module yet.</p>
            )}
          </Panel>
        </div>

        <Panel>
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACE.x2,
              margin: `0 0 ${SPACE.x4}px`,
              ...TYPE.sectionTitle,
            }}
          >
            <MonitorPlay size={18} />Videos
          </h3>
          {module.videos.length ? (
            <div className="flex flex-col gap-2">
              {module.videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => open(v.title, v.url)}
                  className="flex items-center gap-3 rounded-lg border border-ink-150 bg-ink-25 p-3 text-left transition-colors hover:bg-brand-soft"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Play size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{v.title}</span>
                    <span className="text-xs tabular-nums text-ink-500">{v.duration}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-600">No videos for this module yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
};

export default ModuleDocs;
