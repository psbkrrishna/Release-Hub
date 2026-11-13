import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type Icon as PhIcon, ArrowRight, ArrowUpRight, BookOpen, Books, CalendarBlank, CaretRight, Clock, EnvelopeSimpleOpen,
  FileText, Link as LinkIcon, PlayCircle, RocketLaunch, VideoCamera,
} from '@phosphor-icons/react';
import HubSearch from '@/components/hub/HubSearch';
import CreatorTabs from '@/components/hub/CreatorTabs';
import Hoverable from '@/components/primitives/Hoverable';
import { TicketsTable } from '@/components/hub/Tickets';
import { useTickets } from '@/components/TicketStore';
import { useFeatureStore } from '@/components/FeatureStore';
import { useLatestRelease } from '@/components/ReleaseStore';
import { useShell } from '@/components/shell/ShellContext';
import { KB_MODULES, plural, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';
import { groupOf } from '@/data/tickets';
import { HERO_C_BG, RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The Overview, as "Home C · Bold hero, ticket cards" in the Release Hub V2
   design.

   A navy hero carries the page's one job - search - with the release (or its
   webinar) as a pill above the question, and ticket actions top-right. Three
   cards overlap the hero's fade into the page: recent releases, the most used
   guides and video walkthroughs. Below them, the customer's open tickets and a
   row of quick links to every section.

   The hub's own header is not rendered here (ReleaseHubLayout skips it on this
   route), so the hero runs edge to edge under the top bar.
   --------------------------------------------------------------------------- */

type Icon = PhIcon;

interface CardRow {
  key: string;
  title: string;
  meta: string;
  meta2?: string;
  isNew?: boolean;
  icon: Icon;
  onClick: () => void;
}

const Dot = ({ color = T.tx5 }: { color?: string }) => (
  <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: color, flex: 'none' }} />
);

/** "View all →", the brand text button the cards and section heads share. */
const ViewAll = ({ onClick, size = 13 }: { onClick: () => void; size?: number }) => (
  <Hoverable
    as="button"
    type="button"
    onClick={onClick}
    style={{
      marginLeft: 'auto', height: 32, padding: '0 8px', borderRadius: RADIUS.control, border: 'none',
      background: 'transparent', color: T.brand, fontFamily: 'inherit', fontSize: size, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer',
    }}
    hoverStyle={{ background: T.brandSoft }}
  >
    View all<ArrowRight size={12} weight="bold" />
  </Hoverable>
);

/** One of the three cards that overlap the hero. */
const HomeCard = ({ title, count, onAll, rows }: { title: string; count: string; onAll: () => void; rows: CardRow[] }) => (
  <div
    style={{
      display: 'flex', flexDirection: 'column', minWidth: 0, background: T.card, border: `1px solid ${T.bd2}`,
      borderRadius: RADIUS.panel, boxShadow: T.elev2, overflow: 'clip',
    }}
  >
    <div style={{ minHeight: 48, padding: '0 8px 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 700, color: T.tx }}>{title}</span>
      <Dot />
      <span style={{ fontSize: 13, color: T.tx3, whiteSpace: 'nowrap' }}>{count}</span>
      <ViewAll onClick={onAll} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {rows.map(({ key, title: t, meta, meta2, isNew, icon: RowIcon, onClick }) => (
        <Hoverable
          as="button"
          type="button"
          key={key}
          onClick={onClick}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 'none',
            borderTop: `1px solid ${T.bd}`, background: T.card, fontFamily: 'inherit', textAlign: 'left',
            cursor: 'pointer', transition: 'background 120ms ease',
          }}
          hoverStyle={{ background: T.su1 }}
        >
          <span style={{ width: 32, height: 32, borderRadius: RADIUS.control, background: T.su2, color: T.tx3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <RowIcon size={16} />
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span title={t} style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{t}</span>
              {isNew && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: RADIUS.pill, background: T.brandSolid, color: '#FFFFFF', border: `1px solid ${T.brandSolid}`, fontSize: 12, fontWeight: 500, flex: 'none' }}>New</span>
              )}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: '16px', color: T.tx3, whiteSpace: 'nowrap', minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>
              {meta2 && (<><Dot /><span>{meta2}</span></>)}
            </span>
          </span>
          <CaretRight size={10} weight="bold" color="var(--tx4)" style={{ flex: 'none' }} />
        </Hoverable>
      ))}
    </div>
  </div>
);

/** The translucent pill above the hero title: the webinar while one is ahead,
 *  otherwise the latest release. */
const heroPillStyle = (hover: boolean) => ({
  display: 'inline-flex', alignItems: 'center', gap: 8, height: 32, padding: '0 12px 0 6px', whiteSpace: 'nowrap' as const,
  borderRadius: RADIUS.pill, border: `1px solid ${hover ? 'rgba(255,255,255,0.56)' : 'rgba(255,255,255,0.32)'}`,
  background: hover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: 'inherit',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  transform: hover ? 'translateY(-1px)' : 'translateY(0)', boxShadow: hover ? '0 6px 16px rgba(0,0,0,0.24)' : 'none',
  transition: 'transform 180ms cubic-bezier(0.2,0,0,1), background 160ms ease, border-color 160ms ease, box-shadow 180ms ease',
});

/* The translucent pill above the hero title. Not registered: "Webinar · Live
   walkthrough · 18 Nov". Registered: "Webinar · Release walkthrough · in 7
   days". Either way it opens the webinar drawer, where Register (or the
   registration's details) lives. */
const WebinarPill = () => {
  const { webinar, registered, registering, openDrawer, drawerOpen } = useShell();
  const [hover, setHover] = useState(false);
  if (!webinar) return null;
  const meta = registered ? webinar.countdown.replace('starts ', '') : webinar.dateShort;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={drawerOpen}
      onClick={openDrawer}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...heroPillStyle(hover), marginBottom: SPACE.x6 }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px', borderRadius: RADIUS.pill, background: '#FFFFFF', color: T.succText, fontSize: 12, fontWeight: 700, transform: hover ? 'scale(1.06)' : 'none', transition: 'transform 240ms cubic-bezier(0.34,1.56,0.64,1)' }}>
        <VideoCamera size={12} weight="fill" />Webinar
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{registered ? 'Release walkthrough' : 'Live walkthrough'}</span>
        <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />
        <span>{registering ? 'Registering…' : meta}</span>
      </span>
      <ArrowRight size={12} weight="bold" style={{ transform: hover ? 'translateX(4px)' : 'none', transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)' }} />
    </button>
  );
};
const ReleasePill = ({ month, count, onClick }: { month: string; count: number; onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...heroPillStyle(hover), marginBottom: SPACE.x6 }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: RADIUS.pill, background: '#FFFFFF', color: T.brand, fontSize: 12, fontWeight: 600, transform: hover ? 'scale(1.06)' : 'none', transition: 'transform 240ms cubic-bezier(0.34,1.56,0.64,1)' }}>New</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{month} release</span>
        <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />
        <span>{plural(count, 'feature')}</span>
      </span>
      <ArrowRight size={12} weight="bold" style={{ transform: hover ? 'translateX(4px)' : 'none', transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)' }} />
    </button>
  );
};

const Overview = () => {
  const navigate = useNavigate();
  const { visibleFeatures, isCreator } = useFeatureStore();
  const { tickets, openCreate } = useTickets();
  const latestMonth = useLatestRelease();
  const { webinar } = useShell();

  const groups = useMemo(() => releaseNoteGroups(visibleFeatures), [visibleFeatures]);
  const latest = groups[0];
  const videos = useMemo(() => visibleFeatures.filter((f) => f.demoVideo), [visibleFeatures]);
  const active = tickets.filter((t) => groupOf(t.raw) !== 'resolved');

  const goReleases = (month?: string) =>
    navigate(month ? `/product-hub/releases?month=${encodeURIComponent(month)}` : '/product-hub/releases');

  const cards: Array<{ title: string; count: string; onAll: () => void; rows: CardRow[] }> = [
    {
      title: 'Recent releases',
      count: plural(groups.length, 'release'),
      onAll: () => goReleases(),
      rows: groups.slice(0, 4).map((g, i) => ({
        key: g.slug,
        title: g.month,
        meta: plural(g.features.length, 'feature'),
        isNew: i === 0,
        icon: RocketLaunch,
        onClick: () => goReleases(g.month),
      })),
    },
    {
      title: 'Documentation',
      count: 'Most used',
      onAll: () => navigate('/product-hub/knowledge'),
      rows: KB_MODULES.filter((m) => m.docs.length).slice(0, 4).map((m) => ({
        key: m.docs[0].id,
        title: m.docs[0].title,
        meta: m.name,
        meta2: `${m.docs[0].minutes} min read`,
        icon: FileText,
        onClick: () => navigate(`/product-hub/knowledge/modules/${m.slug}/documents/${m.docs[0].id}`),
      })),
    },
    {
      title: 'Video walkthroughs',
      count: plural(videos.length, 'video'),
      onAll: () => navigate('/product-hub/knowledge/videos'),
      rows: videos.slice(0, 4).map((f) => ({
        key: f.id,
        title: f.title,
        meta: f.productModule,
        meta2: f.releaseMonth,
        icon: PlayCircle,
        onClick: () => navigate(`/product-hub/features/${f.id}`),
      })),
    },
  ];

  const quick: Array<{ icon: Icon; title: string; sub: string; path: string }> = [
    { icon: RocketLaunch, title: 'Releases', sub: plural(visibleFeatures.length, 'feature'), path: '/product-hub/releases' },
    { icon: BookOpen, title: 'Release notes', sub: plural(groups.length, 'release'), path: '/product-hub/knowledge/release-notes' },
    { icon: Books, title: 'Documentation', sub: plural(KB_MODULES.length, 'module'), path: '/product-hub/knowledge' },
    { icon: PlayCircle, title: 'Video library', sub: plural(videos.length, 'video'), path: '/product-hub/knowledge/videos' },
    { icon: EnvelopeSimpleOpen, title: 'Newsletters', sub: plural(sortedNewsletters().length, 'issue'), path: '/product-hub/knowledge/newsletters' },
  ];

  const ghostOnNavy = (hover: boolean) => ({
    height: 36, padding: '0 16px', borderRadius: RADIUS.control, border: '1px solid rgba(255,255,255,0.32)',
    background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: 'inherit', ...TYPE.button,
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' as const, cursor: 'pointer',
    opacity: hover ? 0.88 : 1,
  });

  return (
    <>
      {/* Creators: the Configuration / Preview tabs sit above the hero. */}
      <CreatorTabs standalone />
      {/* ---- Hero ---------------------------------------------------------
          Edge to edge: the negative margin cancels the shell's 16px padding.
          The bottom 152px is where the cards below overlap the fade. */}
      <section
        aria-label="Search the Product Hub"
        style={{
          position: 'relative', background: HERO_C_BG, margin: isCreator ? '0 -16px 0' : '-16px -16px 0', padding: '56px 32px 152px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 8 }}>
          <Hoverable as="button" type="button" onClick={() => navigate('/product-hub/tickets')} style={ghostOnNavy(false)} hoverStyle={{ opacity: 0.88 }}>
            Track tickets
          </Hoverable>
          <Hoverable
            as="button"
            type="button"
            onClick={openCreate}
            style={{ ...ghostOnNavy(false), border: '1px solid transparent', background: '#FFFFFF', color: T.hcNavy }}
            hoverStyle={{ opacity: 0.9 }}
          >
            Create ticket
          </Hoverable>
        </div>

        {webinar ? (
          <WebinarPill />
        ) : (
          latest && <ReleasePill month={latest.month} count={latest.features.length} onClick={() => goReleases(latest.month)} />
        )}

        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '44px', color: '#FFFFFF' }}>
          How can we help you today?
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 16, lineHeight: '24px', color: T.hcNavyText }}>
          Search features, guides, release notes and videos in one place.
        </p>
        <div style={{ width: '100%', maxWidth: 680, marginTop: 32 }}>
          <HubSearch variant="heroC" suggestions={['Performance review', 'Onboarding checklist', 'Custom reports', 'Interview scheduling']} />
        </div>
      </section>

      {/* ---- Cards, tickets, quick links -------------------------------- */}
      <div
        style={{
          width: '100%', maxWidth: 1200, margin: '-120px auto 0', boxSizing: 'border-box', padding: '0 16px 32px',
          display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', zIndex: 1,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(calc(33.333% - 11px), (900px - 100%) * 999, 100%), 1fr))', gap: 16, alignItems: 'stretch' }}>
          {cards.map((c) => <HomeCard key={c.title} {...c} />)}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: '24px', fontWeight: 700, color: T.tx }}>Active tickets</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: '0 6px', borderRadius: RADIUS.pill, background: T.brandSoft, color: T.brand, border: `1px solid ${T.brandBorder}`, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {active.length}
            </span>
            <ViewAll size={14} onClick={() => navigate('/product-hub/tickets')} />
          </div>
          {active.length ? (
            <TicketsTable rows={active.slice(0, 6)} onOpen={(t) => navigate(`/product-hub/tickets?id=${t.id}`)} />
          ) : (
            <div style={{ border: `1px solid ${T.bd}`, borderRadius: RADIUS.panel, background: T.card, padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ ...TYPE.cellPrimary }}>No open tickets</div>
              <div style={{ ...TYPE.helper, marginTop: 4 }}>Anything you raise with support shows up here until it is resolved.</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: '24px', fontWeight: 700, color: T.tx, minHeight: 32, display: 'flex', alignItems: 'center' }}>Quick links</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(calc(20% - 13px), (900px - 100%) * 999, 100%), 1fr))', gap: 16 }}>
            {quick.map(({ icon: QIcon, title, sub, path }) => (
              <Hoverable
                as="button"
                type="button"
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, padding: '12px 16px', border: `1px solid ${T.bd}`,
                  borderRadius: RADIUS.panel, background: T.card, boxShadow: T.elev1, fontFamily: 'inherit', textAlign: 'left',
                  cursor: 'pointer', transition: 'border-color 120ms ease, background 120ms ease',
                }}
                hoverStyle={{ borderColor: T.brandBorder, background: T.brandSoft }}
              >
                {(h: boolean) => (
                  <>
                    <span style={{ width: 32, height: 32, borderRadius: RADIUS.control, background: h ? T.card : T.su2, color: h ? T.brand : T.tx3, transition: 'background 120ms ease, color 120ms ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <QIcon size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                      <span style={{ fontSize: 12, lineHeight: '16px', color: T.tx3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
                    </span>
                    <CaretRight size={10} weight="bold" color="var(--tx4)" style={{ flex: 'none' }} />
                  </>
                )}
              </Hoverable>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;
