import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Rocket, BookOpen, FileText, Play, Mail } from 'lucide-react';
import type { ComponentType } from 'react';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, sortedNewsletters } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   One search across both halves of the hub: features, modules, guides, videos
   and newsletters. It is the thing on the Overview that works regardless of
   whether a release just shipped, which is why it sits at the top.

   Everything searchable is already in memory, so this filters the list rather
   than calling anything - no debounce needed, and results appear as you type.
   --------------------------------------------------------------------------- */

type Kind = 'Feature' | 'Module' | 'Guide' | 'Video' | 'Newsletter';

const KIND_ICON: Record<Kind, ComponentType<{ size?: number | string; className?: string }>> = {
  Feature: Rocket,
  Module: BookOpen,
  Guide: FileText,
  Video: Play,
  Newsletter: Mail,
};

interface Hit {
  key: string;
  kind: Kind;
  title: string;
  sub: string;
  path: string;
  /** Lowercased text the query is matched against. */
  haystack: string;
}

const MAX_HITS = 8;

const HubSearch = ({ className = '' }: { className?: string }) => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  /* Drafts are excluded by reading visibleFeatures, so search cannot be used
     to discover an unpublished feature by guessing its name. */
  const index = useMemo<Hit[]>(() => {
    const hits: Hit[] = [];

    visibleFeatures.forEach((f) => {
      hits.push({
        key: `f-${f.id}`,
        kind: 'Feature',
        title: f.title,
        sub: `${f.productModule} · ${f.releaseMonth}`,
        path: `/release-hub/features/${f.id}`,
        haystack: [f.title, f.summary, f.description, f.productModule, f.id, f.releaseMonth]
          .join(' ')
          .toLowerCase(),
      });
    });

    KB_MODULES.forEach((m) => {
      hits.push({
        key: `m-${m.slug}`,
        kind: 'Module',
        title: m.name,
        sub: 'Module documentation',
        path: `/release-hub/knowledge/modules/${m.slug}`,
        haystack: `${m.name} ${m.blurb}`.toLowerCase(),
      });
      // A guide or video leads to the module page that lists it, which is
      // more use than a bare link to the file.
      m.docs.forEach((d) =>
        hits.push({
          key: d.id,
          kind: 'Guide',
          title: d.title,
          sub: m.name,
          path: `/release-hub/knowledge/modules/${m.slug}`,
          haystack: `${d.title} ${d.blurb} ${m.name}`.toLowerCase(),
        }),
      );
      m.videos.forEach((v) =>
        hits.push({
          key: v.id,
          kind: 'Video',
          title: v.title,
          sub: `${m.name} · ${v.duration}`,
          path: `/release-hub/knowledge/modules/${m.slug}`,
          haystack: `${v.title} ${m.name}`.toLowerCase(),
        }),
      );
    });

    sortedNewsletters().forEach((n) =>
      hits.push({
        key: n.id,
        kind: 'Newsletter',
        title: n.title,
        sub: `Newsletter · ${n.month}`,
        path: '/release-hub/knowledge/newsletters',
        haystack: `${n.title} ${n.summary} ${n.month}`.toLowerCase(),
      }),
    );

    return hits;
  }, [visibleFeatures]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    // Every word has to appear somewhere, so "payroll tax" doesn't match a
    // row that only mentions payroll.
    const words = q.split(/\s+/);
    return index
      .filter((h) => words.every((w) => h.haystack.includes(w)))
      .map((h) => {
        const t = h.title.toLowerCase();
        // A title match beats a match buried in a description.
        const score = t.startsWith(q) ? 0 : t.includes(q) ? 1 : 2;
        return { h, score };
      })
      .sort((a, b) => a.score - b.score || a.h.title.localeCompare(b.h.title))
      .slice(0, MAX_HITS)
      .map((r) => r.h);
  }, [index, query]);

  useEffect(() => setCursor(0), [query]);

  // Click-away and Escape both close the panel.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const go = (hit: Hit) => {
    setOpen(false);
    setQuery('');
    navigate(hit.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[cursor]);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    /* No margin of its own - HubHeader owns the spacing, so the search sits
       the same distance from the lede on every tab. */
    <div ref={wrap} className={`relative ${className}`}>
      <input
        className="h-11 w-full rounded-xl border border-ink-150 bg-white pl-11 pr-10 text-15 text-ink-900 shadow-elev1 outline-none placeholder:text-ink-500 focus:border-brand-border"
        placeholder="Search features, modules and documentation…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Search the Feature Hub"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="hub-search-results"
      />
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
      {query && (
        <button
          onClick={() => { setQuery(''); setOpen(false); }}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}

      {showPanel && (
        <div
          id="hub-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-floater overflow-hidden rounded-xl border border-ink-200 bg-white shadow-floater"
        >
          {results.length ? (
            results.map((h, i) => {
              const Icon = KIND_ICON[h.kind];
              return (
                <button
                  key={h.key}
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(h)}
                  className={[
                    'flex w-full items-center gap-3 border-b border-ink-150 p-3 text-left last:border-b-0',
                    i === cursor ? 'bg-brand-soft' : 'bg-white',
                  ].join(' ')}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">{h.title}</span>
                    <span className="block truncate text-xs text-ink-500">{h.sub}</span>
                  </span>
                  <span className="shrink-0 text-2xs uppercase tracking-[.04em] text-ink-500">
                    {h.kind}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-sm text-ink-600">
              Nothing matches “{query.trim()}”. Try a module, a feature name, or a topic.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HubSearch;
