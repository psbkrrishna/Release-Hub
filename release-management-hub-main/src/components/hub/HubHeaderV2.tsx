import { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/primitives/Button';
import { useFeatureStore } from '@/components/FeatureStore';
import { resolveJourney } from '@/components/hub/hubJourney';
import { SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The V2 page header: breadcrumb (absent on the landing page - a trail needs
   somewhere to have come from), then the section's name with one line under
   it on the left, and its calls to action on the right.

   It is not sticky - the taller header would cost a fifth of the viewport on
   every page if it stayed pinned, so it scrolls away and the pages' own
   sticky parts (the documentation nav) take over.

   A page's own primary action (Releases' Create Feature) is rendered by the
   page, because the page owns the state behind it, and lands here through the
   slot below. Cross-links to the other sections are the header's own.
   --------------------------------------------------------------------------- */

/** The element a page's primary action is portalled into. Null until the
 *  header has mounted. */
export const HubActionSlotContext = createContext<HTMLElement | null>(null);
export const useHubActionSlot = () => useContext(HubActionSlotContext);

/** Owns the slot element so the header and the pages beneath it can share it.
 *  Held in state, not a ref, so a page re-renders once the element exists. */
export const useActionSlotState = () => useState<HTMLElement | null>(null);

const HubHeaderV2 = ({ setSlot }: { setSlot: (el: HTMLElement | null) => void }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  const { crumbs, title, subtext, ctas } = resolveJourney(pathname, visibleFeatures);

  return (
    <header
      style={{
        margin: `-${SPACE.x4}px -${SPACE.x4}px ${SPACE.x4}px`,
        padding: `${SPACE.x3}px ${SPACE.x4}px ${SPACE.x4}px`,
        background: T.card,
        borderBottom: `1px solid ${T.bd2}`,
      }}
    >
      {crumbs.length > 0 && (
      <nav
        aria-label="Breadcrumb"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.x1, fontSize: 12, fontWeight: 500 }}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${i}-${crumb.label}`} style={{ display: 'contents' }}>
              {isLast || !crumb.path ? (
                <span aria-current={isLast ? 'page' : undefined} style={{ color: T.tx3 }}>
                  {crumb.label}
                </span>
              ) : (
                <a
                  href={crumb.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(crumb.path!);
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  {crumb.label}
                </a>
              )}
              {!isLast && <CaretRight size={10} weight="bold" color="var(--tx4)" aria-hidden />}
            </span>
          );
        })}
      </nav>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACE.x3,
          marginTop: title && crumbs.length > 0 ? SPACE.x2 : 0,
        }}
      >
        {title && (
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                lineHeight: '28px',
                letterSpacing: '-0.01em',
                color: T.tx,
              }}
            >
              {title}
            </h1>
            {subtext && <p style={{ margin: `${SPACE.x1}px 0 0`, ...TYPE.helper }}>{subtext}</p>}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.x2, marginLeft: 'auto' }}>
          {ctas.map((cta) => (
            <Button key={cta.path} variant="secondary" onClick={() => navigate(cta.path)}>
              {cta.label}
              <ArrowRight size={16} />
            </Button>
          ))}
          <div ref={setSlot} style={{ display: 'contents' }} />
        </div>
      </div>
    </header>
  );
};

export default HubHeaderV2;
