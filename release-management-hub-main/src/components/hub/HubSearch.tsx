import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Rocket, BookOpen, FileText, Play, Mail, Newspaper } from 'lucide-react';
import type { ComponentType } from 'react';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   One search across both halves of the hub: features, modules, documents, videos
   and newsletters. It is the thing on the Overview that works regardless of
   whether a release just shipped, which is why it sits at the top.

   Everything searchable is already in memory, so this filters the list rather
   than calling anything - no debounce needed, and results appear as you type.
   --------------------------------------------------------------------------- */

type Kind = 'Feature' | 'Module' | 'Document' | 'Video' | 'Newsletter' | 'Release Note';

const KIND_ICON: Record<Kind, ComponentType<{ size?: number | string; className?: string }>> = {
  Feature: Rocket,
  Module: BookOpen,
  Document: FileText,
  Video: Play,
  Newsletter: Mail,
  'Release Note': Newspaper,
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

const HubSearch = ({
  className = '',
  variant = 'default',
  suggestions,
}: {
  className?: string;
  /** `hero` is the Overview's large field; `default` is the toolbar size the
   *  other tabs use. */
  variant?: 'default' | 'hero' | 'heroC';
  /** Example queries offered under a hero field. Clicking one runs it. */
  suggestions?: string[];
}) => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        path: `/product-hub/features/${f.id}`,
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
        path: `/product-hub/knowledge/modules/${m.slug}`,
        haystack: `${m.name} ${m.blurb}`.toLowerCase(),
      });
      // A document leads straight to its own page now, not the module list it
      // sits in.
      m.docs.forEach((d) =>
        hits.push({
          key: d.id,
          kind: 'Document',
          title: d.title,
          sub: m.name,
          path: `/product-hub/knowledge/modules/${m.slug}/documents/${d.id}`,
          haystack: `${d.title} ${d.blurb} ${m.name}`.toLowerCase(),
        }),
      );
      m.videos.forEach((v) =>
        hits.push({
          key: v.id,
          kind: 'Video',
          title: v.title,
          sub: `${m.name} · ${v.duration}`,
          path: `/product-hub/knowledge/modules/${m.slug}`,
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
        path: `/product-hub/knowledge/newsletters/${n.id}`,
        haystack: `${n.title} ${n.summary} ${n.month}`.toLowerCase(),
      }),
    );

    releaseNoteGroups(visibleFeatures).forEach((g) =>
      hits.push({
        key: `rn-${g.slug}`,
        kind: 'Release Note',
        title: `${g.month} Release Notes`,
        sub: `Release notes · ${g.month}`,
        path: `/product-hub/knowledge/release-notes/${g.slug}`,
        haystack: `${g.month} release notes ${g.modules.join(' ')}`.toLowerCase(),
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
  const hero = variant === 'hero';
  const heroC = variant === 'heroC';

  /* Home C: the placeholder cycles through example queries ("Search for
     …"), and "/" anywhere on the page focuses the field. */
  const [tick, setTick] = useState(0);
  const [focused, setFocused] = useState(false);
  const [hoverC, setHoverC] = useState(false);
  useEffect(() => {
    if (!heroC || !suggestions?.length) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => window.clearInterval(id);
  }, [heroC, suggestions]);
  useEffect(() => {
    if (!heroC) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [heroC]);

  if (heroC) {
    const ticker = suggestions?.length ? `“${suggestions[tick % suggestions.length]}”` : '';
    return (
      <div
        ref={wrap}
        className={className}
        onMouseEnter={() => setHoverC(true)}
        onMouseLeave={() => setHoverC(false)}
        style={{
          position: 'relative',
          width: '100%',
          textAlign: 'left',
          zIndex: 5,
          transform: hoverC ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 200ms cubic-bezier(0.2,0,0,1)',
        }}
      >
        {/* The radiating ring and the gradient stroke that draws round the
            field, both decorative. */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none', animation: 'rhRadiateLt 6s linear infinite' }} />
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}>
          <defs>
            <linearGradient id="rhAiGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style={{ stopColor: 'var(--ai-grad-a)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--ai-grad-b)' }} />
            </linearGradient>
          </defs>
          <rect
            x="0.5" y="0.5" rx="8" ry="8" pathLength={100} fill="none" stroke="url(#rhAiGrad)" strokeWidth={3} strokeDashoffset={-23}
            style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)', strokeDasharray: '0 100', animation: 'rhFill 6s infinite' }}
          />
        </svg>
        <Search
          size={20}
          style={{
            position: 'absolute', left: 16, top: 18, zIndex: 2, pointerEvents: 'none',
            color: hoverC || focused ? 'var(--brand)' : 'var(--tx4)',
            transform: hoverC ? 'rotate(-12deg) scale(1.12)' : 'none',
            transition: 'color 200ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setFocused(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          aria-label="Search the Product Hub"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="hub-search-results"
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box', height: 56, borderRadius: 8,
            border: `1px solid ${hoverC ? 'var(--brand-border)' : 'var(--bd2)'}`, background: 'var(--card)', color: 'var(--tx)',
            fontFamily: 'inherit', fontSize: 16, padding: '0 96px 0 44px', outline: 'none',
            boxShadow: focused ? '0 0 0 4px var(--ai-ring)' : hoverC ? '0 12px 28px rgba(16,24,40,0.22)' : '0 8px 24px rgba(0,0,0,0.18)',
            transition: 'box-shadow 200ms ease, border-color 200ms ease',
          }}
        />
        {!query && (
          <div aria-hidden style={{ position: 'absolute', left: 44, top: 0, height: 56, right: 56, display: 'flex', alignItems: 'center', gap: 5, fontSize: 16, color: 'var(--tx4)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span>Search for</span>
            <span key={tick} style={{ animation: 'riseIn 240ms ease' }}>{ticker}</span>
          </div>
        )}
        <div style={{ position: 'absolute', right: 12, top: 0, bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          {query ? (
            <>
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onMouseDown={(e) => { e.preventDefault(); setQuery(''); }}
                style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 6, background: 'var(--su2)', color: 'var(--tx3)', fontSize: 12, fontWeight: 600 }}>Enter</span>
            </>
          ) : (
            !focused && (
              <span title="Press / anywhere to search" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, height: 24, padding: '0 6px', boxSizing: 'border-box', borderRadius: 6, border: '1px solid var(--bd2)', background: 'var(--su1)', color: 'var(--tx3)', fontSize: 12, fontWeight: 600 }}>/</span>
            )
          )}
        </div>

        {showPanel && (
          <div
            id="hub-search-results"
            role="listbox"
            style={{ position: 'absolute', left: 0, right: 0, top: 62, zIndex: 60, background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--elev3)', padding: 4, animation: 'riseIn 160ms ease', display: 'flex', flexDirection: 'column' }}
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
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 8, border: 'none', borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: i === cursor ? 'var(--su2)' : 'transparent' }}
                  >
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--su2)', color: 'var(--tx3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Icon size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</span>
                      <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.sub}</span>
                    </span>
                    <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx4)' }}>{h.kind}</span>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: 12, fontSize: 14, color: 'var(--tx3)' }}>
                Nothing matches “{query.trim()}”. Try a module, a feature name, or a topic.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    /* No margin of its own - HubHeader owns the spacing, so the search sits
       the same distance from the lede on every tab.

       The field, its two icons and the results panel share an inner relative
       box rather than sitting directly in this one. They are positioned
       against the input, and once the hero variant added suggestion chips
       below it, centring them on the outer box put the magnifier under the
       field instead of inside it. */
    <div ref={wrap} className={className}>
      <div className="relative">
      <input
        ref={inputRef}
        className={[
          'w-full rounded-xl border bg-white text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-border',
          /* 46px is the reference design's field height. */
          hero
            ? 'h-[46px] border-ink-150 pl-12 pr-12 text-base shadow-elev1'
            : 'h-11 border-ink-150 pl-11 pr-10 text-15 shadow-elev1',
        ].join(' ')}
        placeholder="Search features, modules and documentation…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Search the Product Hub"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="hub-search-results"
      />
      <Search
        size={hero ? 20 : 18}
        className={[
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-500',
          hero ? 'left-4' : 'left-4',
        ].join(' ')}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setOpen(false); }}
          className={[
            'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900',
            hero ? 'right-4 h-7 w-7' : 'right-3 h-6 w-6',
          ].join(' ')}
          aria-label="Clear search"
        >
          <X size={hero ? 17 : 15} />
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

      {/* Example queries. They run the search rather than navigating, so the
          reader sees what the field can do instead of being told. */}
      {hero && suggestions && suggestions.length > 0 && (
        /* 28px below the field, matching the reference design. */
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {/* "Try", not "Try searching for": the chips beside it already say
              what they are, and the long form pushed the third one off the
              line at the widths this hero is read at. */}
          <span className="mr-1 text-sm text-ink-600">Try</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="rounded-lg border border-warm-200 bg-white/70 px-3 py-1 text-sm text-ink-700 transition-colors hover:border-brand-border hover:bg-white hover:text-brand-text"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HubSearch;
