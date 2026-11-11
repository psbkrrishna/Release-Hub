import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretDown, CaretRight, FunnelSimple, MagnifyingGlass, PlayCircle, X } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import DesignPager from '@/components/hub/DesignPager';
import { SecHead } from '@/pages/hub/ModuleDocs';
import { useFeatureStore } from '@/components/FeatureStore';
import { MODULES } from '@/data/features';
import { plural, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';
import { fmtDate } from '@/lib/featureUi';

/* Release notes, newsletters and the video library - the three lists
   "across all modules" in the Release Hub V2 design's Documentation. Each has
   a search and a module filter, and pages like the design's tables. */

type Section = 'release-notes' | 'newsletters' | 'videos';

const META: Record<Section, { title: string; sub: string; q: string; empty: string }> = {
  'release-notes': { title: 'Release notes', sub: 'What changed in each release, month by month.', q: 'Search by month or feature', empty: 'No release notes for' },
  newsletters: { title: 'Newsletters', sub: 'The monthly round-up of what shipped.', q: 'Search newsletters', empty: 'No newsletters cover' },
  videos: { title: 'Video library', sub: 'Walkthroughs and demos for each module.', q: 'Search videos', empty: 'No videos for' },
};

const rowStyle = { width: '100%', padding: '10px 16px', border: 'none', borderBottom: '1px solid var(--bd)', background: 'var(--card)', fontFamily: 'inherit', textAlign: 'left' as const, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' };
const titleStyle = { fontSize: 14, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' };
const subStyle = { fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' };

const KnowledgeSection = ({ section }: { section: Section }) => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('all');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [focus, setFocus] = useState(false);
  const meta = META[section];
  const sq = q.trim().toLowerCase();
  const hit = (...xs: Array<string | undefined>) => !sq || xs.some((x) => x?.toLowerCase().includes(sq));
  const inMod = (m: string) => mod === 'all' || m === mod;

  const rows = useMemo(() => {
    const pub = visibleFeatures.filter((f) => f.published);
    if (section === 'release-notes') {
      return releaseNoteGroups(pub)
        .map((g) => ({ g, its: g.features.filter((f) => inMod(f.productModule)) }))
        .filter(({ g, its }) => its.length && (hit(`${g.month} release notes`) || its.some((f) => hit(f.title, f.id))))
        .map(({ g, its }) => {
          const nf = its.filter((f) => f.featureTag === 'New Feature').length;
          return {
            key: g.slug,
            title: `${g.month} release notes`,
            sub: `${plural(nf, 'new feature')} · ${plural(its.length - nf, 'enhancement')}`,
            right: fmtDate(g.date),
            onClick: () => navigate(`/product-hub/knowledge/release-notes/${g.slug}`),
          };
        });
    }
    if (section === 'newsletters') {
      return sortedNewsletters()
        .filter((n) => (mod === 'all' || n.featureIds.some((id) => pub.find((f) => f.id === id)?.productModule === mod)) && hit(n.title, n.summary, n.month))
        .map((n) => ({ key: n.id, title: n.title, sub: n.summary, right: fmtDate(n.date), onClick: () => navigate(`/product-hub/knowledge/newsletters/${n.id}`) }));
    }
    return pub
      .filter((f) => f.demoVideo && inMod(f.productModule) && hit(f.title, f.productModule, f.releaseMonth))
      .map((f) => ({ key: f.id, title: f.title, sub: f.productModule, right: f.releaseMonth, onClick: () => navigate(`/product-hub/features/${f.id}`), video: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, section, sq, mod]);

  const pages = Math.max(1, Math.ceil(rows.length / per));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * per, cur * per);

  return (
    <>
      <SecHead title={meta.title} sub={meta.sub}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <MagnifyingGlass size={14} color="var(--tx4)" aria-hidden style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder={meta.q}
              aria-label={meta.q}
              style={{ width: '100%', boxSizing: 'border-box', height: 36, borderRadius: 8, border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: '0 32px 0 32px', outline: 'none' }}
            />
            {q && (
              <button type="button" aria-label="Clear search" title="Clear search" onClick={() => setQ('')} style={{ position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <select aria-label="Product module" value={mod} onChange={(e) => { setMod(e.target.value); setPage(1); }} style={{ appearance: 'none', WebkitAppearance: 'none', height: 36, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: '0 36px 0 12px', cursor: 'pointer', minWidth: 220 }}>
              <option value="all">All modules</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <CaretDown size={14} color="var(--tx3)" style={{ position: 'absolute', right: 12, top: 11, pointerEvents: 'none' }} />
          </div>
        </div>
      </SecHead>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
          <FunnelSimple size={30} color="var(--tx4)" />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginTop: 8 }}>{sq ? `No results for “${q.trim()}”` : `${meta.empty} ${mod}`}</div>
          <div style={{ fontSize: 13, color: 'var(--tx3)' }}>{sq ? 'Try another word, or clear the search.' : 'Pick another module to see more.'}</div>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden' }}>
          {slice.map((r) => (
            <Hoverable as="button" type="button" key={r.key} onClick={r.onClick} aria-label={'video' in r ? `Play ${r.title} demo` : undefined} style={rowStyle} hoverStyle={{ background: 'var(--su1)' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span style={titleStyle}>{r.title}</span>
                <span style={subStyle}>{r.sub}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--tx3)', whiteSpace: 'nowrap', flex: 'none' }}>{r.right}</span>
              {'video' in r
                ? <PlayCircle size={24} weight="fill" color="var(--brand)" aria-hidden style={{ flex: 'none' }} />
                : <CaretRight size={12} weight="bold" color="var(--tx4)" aria-hidden style={{ flex: 'none' }} />}
            </Hoverable>
          ))}
          <DesignPager total={rows.length} page={cur} per={per} onPage={setPage} onPer={(v) => { setPer(v); setPage(1); }} borderTop="none" />
        </div>
      )}
    </>
  );
};

export default KnowledgeSection;
