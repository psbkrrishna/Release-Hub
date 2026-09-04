import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, Play, ExternalLink, ArrowRight, Search, Clock, Rocket,
} from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import EmptyState from '@/components/primitives/EmptyState';
import { moduleIcon, TONE_TINT } from '@/components/hub/moduleVisuals';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, moduleBySlug, plural } from '@/data/knowledge';
import { formatDate } from '@/data/features';

/* One module: its evergreen guides, its videos, and every feature that has
   shipped in it. That last section is the point of merging the two halves -
   from a module you can reach the feature, and from the feature you can reach
   the module. */

const ModuleDocs = () => {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const { visibleFeatures, toast } = useFeatureStore();

  const module = moduleBySlug(moduleSlug);

  if (!module) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That module isn't in the Knowledge Hub"
        action={
          <Button variant="secondary" onClick={() => navigate('/release-hub/knowledge')}>
            <ArrowRight size={18} />Back to the Knowledge Hub
          </Button>
        }
      >
        It may have been renamed. Every module is listed on the Knowledge Hub home.
      </EmptyState>
    );
  }

  const open = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} isn't attached yet.`, 'info');

  const Icon = moduleIcon(module.name);
  const features = visibleFeatures
    .filter((f) => f.productModule === module.name)
    .sort((a, b) => b.prodEnablementDate.localeCompare(a.prodEnablementDate));

  const others = KB_MODULES.filter((m) => m.slug !== module.slug);

  return (
    <>
      <div className="mb-5 rounded-lg border border-brand-border bg-brand-soft p-6">
        <div className="mb-3 flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${TONE_TINT[module.tone]}`}>
            <Icon size={22} />
          </span>
          <div>
            <h1 className="text-22 font-semibold leading-tight tracking-[-0.01em]">{module.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-13 text-ink-600">
              <span className="flex items-center gap-1"><FileText size={13} />{plural(module.docs.length, 'guide')}</span>
              <span className="flex items-center gap-1"><Play size={13} />{plural(module.videos.length, 'video')}</span>
              <span className="flex items-center gap-1"><Rocket size={13} />{plural(features.length, 'feature')} shipped</span>
            </div>
          </div>
        </div>
        <p className="max-w-lede text-sm text-ink-700">{module.blurb}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[1181px]:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <FileText size={18} />Guides
            </h2>
            {module.docs.length ? (
              <div className="flex flex-col gap-3">
                {module.docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-ink-150 bg-ink-25 p-4"
                  >
                    <div>
                      <h3 className="text-sm font-semibold">{doc.title}</h3>
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
                No module guides yet. The features below carry their own release notes.
              </p>
            )}
          </Panel>

          <Panel>
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <Rocket size={18} />Features in this module
            </h2>
            <p className="mb-4 text-13 text-ink-600">
              Everything released in {module.name}, newest first.
            </p>
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
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={f.featureTag === 'New Feature' ? 'purple' : 'neutral'}>
                          {f.featureTag}
                        </Badge>
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

        <div className="flex flex-col gap-5">
          <Panel>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <Play size={18} />Videos
            </h2>
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

          <Panel>
            <h2 className="mb-3 text-base font-semibold">Other modules</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
                  className="rounded-lg border border-ink-150 px-2 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand-text"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default ModuleDocs;
