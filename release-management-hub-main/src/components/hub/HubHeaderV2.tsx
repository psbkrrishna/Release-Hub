import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowSquareOut, CalendarBlank, CaretRight, Hash, SlidersHorizontal, SquaresFour } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import ManageInConfigure from '@/components/hub/ManageInConfigure';
import { useFeatureStore } from '@/components/FeatureStore';
import { useTickets } from '@/components/TicketStore';
import { useShell } from '@/components/shell/ShellContext';
import { resolveJourney } from '@/components/hub/hubJourney';
import { badgeFor, fmtDate, tagLabel, tagStyle, typeLabel } from '@/lib/featureUi';

/* ---------------------------------------------------------------------------
   The Get help page header from the Release Hub V2 design: sticky under the
   shell, breadcrumb, a 20px title with one line under it (or, on a feature,
   its tag and status pills and a row of facts), and the page's actions.
   --------------------------------------------------------------------------- */

export const HubActionSlotContext = createContext<HTMLElement | null>(null);
export const useHubActionSlot = () => useContext(HubActionSlotContext);
export const useActionSlotState = () => useState<HTMLElement | null>(null);

const pill = (bg: string, fg: string, bd: string) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 20, padding: '0 8px', borderRadius: 999,
  background: bg, color: fg, border: `1px solid ${bd}`, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' as const,
});

const HubHeaderV2 = ({ setSlot }: { setSlot: (el: HTMLElement | null) => void }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { visibleFeatures, isCreator } = useFeatureStore();
  const { openCreate } = useTickets();
  const { shellTop } = useShell();
  /* The header's height, published as --hub-hdr-h so sticky table heads and
     the documentation nav can sit flush under it. */
  const measure = useRef<ResizeObserver>();
  const headerRef = useCallback((el: HTMLElement | null) => {
    measure.current?.disconnect();
    if (!el) { document.documentElement.style.setProperty('--hub-hdr-h', '0px'); return; }
    measure.current = new ResizeObserver(() => document.documentElement.style.setProperty('--hub-hdr-h', `${el.offsetHeight}px`));
    measure.current.observe(el);
  }, []);

  const { crumbs, title, subtext } = resolveJourney(pathname, visibleFeatures);
  const parts = pathname.replace(/\/+$/, '').split('/');
  const area = parts[2];
  const feature = area === 'features' ? visibleFeatures.find((f) => f.id === parts[3]) : undefined;

  const meta = feature
    ? [
        { name: 'Module', icon: SquaresFour, label: feature.productModule },
        { name: 'Default state', icon: SlidersHorizontal, label: typeLabel(feature) },
        { name: 'Feature code', icon: Hash, label: feature.id },
        { name: feature.published ? 'Release date' : 'Planned date', icon: CalendarBlank, label: `${feature.published ? 'Released' : 'Planned for'} ${fmtDate(feature.prodEnablementDate)}` },
      ]
    : [];

  return (
    <header
      ref={headerRef}
      style={{
        position: 'sticky', top: shellTop, zIndex: 100, background: 'var(--card)', borderBottom: '1px solid var(--bd2)',
        padding: '8px 16px 12px', margin: '-16px -16px 16px',
      }}
    >
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 4, lineHeight: '16px', fontSize: 12, fontWeight: 500 }}>
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={`${i}-${c.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {!last && c.path ? (
                  <>
                    <a href={c.path} onClick={(e) => { e.preventDefault(); navigate(c.path!); }} style={{ color: 'var(--brand)' }}>{c.label}</a>
                    <CaretRight size={10} weight="bold" color="var(--tx4)" />
                  </>
                ) : (
                  <span aria-current={last ? 'page' : undefined} style={{ color: 'var(--tx3)' }}>{c.label}</span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '28px', color: 'var(--tx)' }}>{title}</h1>
            {feature && (() => {
              const t = tagStyle(feature); const b = badgeFor(feature);
              return (
                <>
                  <span style={pill(t.bg, t.fg, t.bd)}>{tagLabel(feature)}</span>
                  <span style={pill(b.bg, b.fg, b.bd)}>{b.label}</span>
                </>
              );
            })()}
          </div>
          {feature ? (
            <ul aria-label="Feature details" style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'flex', alignItems: 'center', gap: '8px 12px', flexWrap: 'wrap' }}>
              {meta.map((m, i) => (
                <span key={m.name} style={{ display: 'contents' }}>
                  {i > 0 && <li aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--tx5)', flex: 'none' }} />}
                  <li title={m.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--tx2)', fontSize: 13, cursor: 'default', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                    <m.icon size={16} color="var(--tx4)" aria-hidden />
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{m.name}:</span>
                    {m.label}
                  </li>
                </span>
              ))}
            </ul>
          ) : (
            subtext && <p style={{ margin: 0, fontSize: 12, color: 'var(--tx3)', lineHeight: 1.4 }}>{subtext}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {area === 'tickets' && (
            <Hoverable
              as="button"
              type="button"
              onClick={openCreate}
              style={{ height: 36, padding: '0 20px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'var(--card)', color: 'var(--brand)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'pointer' }}
              hoverStyle={{ background: 'var(--brand-soft)' }}
            >
              Raise a ticket
            </Hoverable>
          )}
          <div ref={setSlot} style={{ display: 'contents' }} />
          {/* Last in the row, on every page Configure manages (creators only). */}
          <ManageInConfigure />
        </div>
      </div>
    </header>
  );
};

export default HubHeaderV2;
