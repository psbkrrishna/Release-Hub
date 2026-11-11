import { useNavigate, useParams } from 'react-router-dom';
import { CaretRight, FileText, PlayCircle, Ticket } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import { useFeatureStore } from '@/components/FeatureStore';
import { useTickets } from '@/components/TicketStore';
import { moduleBySlug, plural } from '@/data/knowledge';

/* A module in Documentation, as the Release Hub V2 design shows it: Guides,
   the features that shipped in the module, its videos, and a way to raise a
   ticket when none of it answers the question. */

export const SecHead = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 240 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: '24px', color: 'var(--tx)' }}>{title}</h2>
      {sub && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: 'var(--tx3)' }}>{sub}</p>}
    </div>
    {children}
  </div>
);

const card = { background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8 } as const;
const head = { padding: '12px 16px', borderBottom: '1px solid var(--bd)', fontSize: 14, fontWeight: 700, color: 'var(--tx)' } as const;
const rowBtn = { width: '100%', display: 'flex', alignItems: 'center', gap: 12, border: 'none', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', textAlign: 'left' as const, cursor: 'pointer' };

const ModuleDocs = () => {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const { openCreate } = useTickets();
  const m = moduleBySlug(moduleSlug);

  if (!m) return <SecHead title="Module not found" sub="Pick a module from the list on the left." />;

  const feats = visibleFeatures.filter((f) => f.published && f.productModule === m.name);
  const vids = feats.filter((f) => f.demoVideo);

  return (
    <>
      <SecHead title={m.name} sub={m.blurb} />

      <div style={card}>
        <div style={head}>Guides</div>
        <div style={{ padding: 4 }}>
          {m.docs.map((d) => (
            <Hoverable
              as="button"
              type="button"
              key={d.id}
              onClick={() => navigate(`/product-hub/knowledge/modules/${m.slug}/documents/${d.id}`)}
              style={{ ...rowBtn, minHeight: 48, padding: '8px 12px' }}
              hoverStyle={{ background: 'var(--su1)' }}
            >
              <FileText size={16} color="var(--tx3)" style={{ flex: 'none' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{d.title}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--tx3)' }}>{d.blurb}</span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--tx4)', whiteSpace: 'nowrap' }}>{d.minutes} min read</span>
              <CaretRight size={10} weight="bold" color="var(--tx4)" aria-hidden style={{ flex: 'none' }} />
            </Hoverable>
          ))}
          {m.docs.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--tx3)' }}>No guides for this module yet.</div>}
        </div>
      </div>

      <div style={card}>
        <div style={head}>Features in this module</div>
        <div style={{ padding: 4 }}>
          {feats.map((f) => (
            <Hoverable
              as="button"
              type="button"
              key={f.id}
              onClick={() => navigate(`/product-hub/features/${f.id}`)}
              style={{ ...rowBtn, minHeight: 40, padding: '6px 12px' }}
              hoverStyle={{ background: 'var(--su1)' }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{f.title}</span>
              <span style={{ fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{f.releaseMonth}</span>
              <CaretRight size={10} weight="bold" color="var(--tx4)" />
            </Hoverable>
          ))}
          {feats.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--tx3)' }}>No features have shipped in this module yet.</div>}
        </div>
      </div>

      <div style={card}>
        <div style={{ ...head, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Videos</span>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--tx3)' }}>{plural(vids.length, 'video')}</span>
        </div>
        <div style={{ padding: 4 }}>
          {vids.map((f) => (
            <Hoverable
              as="button"
              type="button"
              key={f.id}
              aria-label={`Play ${f.title} demo`}
              onClick={() => navigate(`/product-hub/features/${f.id}`)}
              style={{ ...rowBtn, minHeight: 48, padding: '8px 12px' }}
              hoverStyle={{ background: 'var(--su1)' }}
            >
              <PlayCircle size={24} weight="fill" color="var(--brand)" aria-hidden style={{ flex: 'none' }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
              <span style={{ fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{f.releaseMonth}</span>
              <CaretRight size={10} weight="bold" color="var(--tx4)" aria-hidden style={{ flex: 'none' }} />
            </Hoverable>
          ))}
          {vids.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--tx3)' }}>No videos for this module yet.</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 0', fontSize: 14, color: 'var(--tx3)' }}>
        <span>Still can't find what you're looking for?</span>
        <Hoverable
          as="button"
          type="button"
          onClick={openCreate}
          style={{ height: 32, padding: '0 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--brand)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          hoverStyle={{ background: 'var(--brand-soft)' }}
        >
          <Ticket size={16} />Raise a ticket
        </Hoverable>
      </div>
    </>
  );
};

export default ModuleDocs;
