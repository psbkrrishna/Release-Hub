import { useState } from 'react';
import { ArrowUpRight, CalendarBlank, VideoCamera } from '@phosphor-icons/react';
import { useLatestRelease, useUpcomingWebinar } from '@/components/ReleaseStore';
import { formatWebinarWhen, webinarCountdown } from '@/data/releases';
import { RADIUS, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The release webinar, as the one loud thing at the top of every Product Hub
   page - for every role, because the point is signups and a customer, an admin,
   a creator and the implementation team all bring people to a webinar.

   Solid brand rather than a tint: a pale band sat next to the page's own
   controls and was read as furniture. It carries no dismiss button on purpose;
   it is time-boxed, and disappears by itself when the webinar starts, or the
   moment the creator removes it.

   The register button is white on the band, so the page's own primary button
   (Create Feature, Explore) is still the only blue button competing with it.
   --------------------------------------------------------------------------- */

const WebinarBand = () => {
  const month = useLatestRelease();
  const webinar = useUpcomingWebinar(month);
  const [hover, setHover] = useState(false);
  if (!webinar) return null;

  return (
    <section
      aria-label="Release webinar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
        margin: '0 0 16px',
        padding: '12px 16px',
        background: T.brandSolid,
        color: '#FFFFFF',
        borderRadius: RADIUS.control,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: RADIUS.control,
          background: 'rgba(255,255,255,0.16)',
        }}
      >
        <VideoCamera size={22} weight="fill" />
      </span>

      <div style={{ minWidth: 0, flex: '1 1 280px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
          Live webinar · {month} release
        </div>
        <div style={{ ...TYPE.sectionTitle, color: '#FFFFFF', margin: '2px 0 2px' }}>{webinar.title}</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '2px 12px',
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CalendarBlank size={14} weight="bold" />
            {formatWebinarWhen(webinar.startsAt)}
          </span>
          <span style={{ fontWeight: 700 }}>{webinarCountdown(webinar.startsAt)}</span>
        </div>
      </div>

      <a
        href={webinar.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 36,
          padding: '0 20px',
          flexShrink: 0,
          borderRadius: RADIUS.control,
          background: hover ? T.brandSoft : '#FFFFFF',
          color: T.brand,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'background 120ms ease',
          ...TYPE.button,
        }}
      >
        Register now <ArrowUpRight size={16} weight="bold" />
      </a>
    </section>
  );
};

export default WebinarBand;
