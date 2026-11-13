import { useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarBlank, CalendarPlus, Check, CircleNotch, Clock, Link as LinkIcon, VideoCamera, X } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import { useShell } from '@/components/shell/ShellContext';

/* ---------------------------------------------------------------------------
   The webinar drawer from the Release Hub V2 design: 480px from the right over
   a 40% scrim. The banner image, then (once registered) the "You're in" card
   overlapping its foot, then Details, Agenda and Speakers. The footer is
   Register until you are in; after that Copy join link and Add to calendar,
   and a quiet "Cancel registration" under the speakers for plans that change.
   Opened by every Register / View details in the shell and by the hero pill.
   --------------------------------------------------------------------------- */

const FONT = "'Source Sans 3', -apple-system, sans-serif";
const sectionTitle = { fontSize: 14, lineHeight: '20px', fontWeight: 700, color: 'var(--tx)' } as const;
const tint = ['brand', 'succ'] as const;

const WebinarDrawer = () => {
  const { drawerOpen, closeDrawer, webinar, registered, registering, register, confirmShown, dismissConfirm, cancelRegistration, firstName } = useShell();

  useEffect(() => {
    if (!drawerOpen) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen || !webinar) return null;

  const row = (icon: React.ReactNode, label: string, main: string, sub?: string, first = false) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderTop: first ? 'none' : '1px solid var(--bd)' }}>
      <span style={{ fontSize: 16, lineHeight: '20px', color: 'var(--tx4)', flex: 'none', display: 'inline-flex', paddingTop: 2 }}>{icon}</span>
      <span style={{ width: 72, flex: 'none', fontSize: 13, lineHeight: '20px', color: 'var(--tx3)' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--tx)' }}>{main}</span>
        {sub && <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--tx3)' }}>{sub}</span>}
      </span>
    </div>
  );

  const secondary = { height: 36, padding: '0 16px', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap', flex: 'none', border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx2)' } as const;

  return (
    <>
      <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, animation: 'scrimIn 160ms ease' }} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={webinar.title}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '100vw', background: 'var(--card)', boxShadow: 'var(--elev3)', zIndex: 401, display: 'flex', flexDirection: 'column', animation: 'slideInRight 200ms ease', fontFamily: FONT, color: 'var(--tx)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--bd2)' }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: '24px', fontWeight: 700, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{webinar.title}</div>
          <Hoverable as="button" type="button" onClick={closeDrawer} aria-label="Close" title="Close" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }} hoverStyle={{ background: 'var(--su2)' }}>
            <X size={16} />
          </Hoverable>
        </div>

        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '2180 / 721', overflow: 'hidden', flex: 'none' }}>
            <img src={webinar.bannerUrl} alt={`${webinar.title} webinar`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          {confirmShown && (
            <div style={{ position: 'relative', zIndex: 1, margin: '-28px 16px 0' }}>
              <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px 12px 12px', background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: 'var(--elev2)', animation: 'riseIn 220ms ease' }}>
                <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: 'var(--succ-solidHover)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} weight="bold" />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 15, lineHeight: '22px', fontWeight: 700, color: 'var(--tx)' }}>You're registered, {firstName}</span>
                  <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--tx3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Invite sent to your inbox · <b style={{ fontWeight: 600, color: 'var(--succ-text)' }}>{webinar.countdown}</b>
                  </span>
                </span>
                <Hoverable as="button" type="button" onClick={dismissConfirm} aria-label="Dismiss" title="Dismiss" style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--su2)' }}>
                  <X size={16} />
                </Hoverable>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={sectionTitle}>Details</div>
            <div style={{ border: '1px solid var(--bd2)', borderRadius: 8 }}>
              {row(<CalendarBlank size={16} />, 'Date', webinar.dateLong, webinar.countdown.charAt(0).toUpperCase() + webinar.countdown.slice(1), true)}
              {row(<Clock size={16} />, 'Time', webinar.timeRange)}
              {row(<VideoCamera size={16} />, 'Venue', `Online · ${webinar.venue}`, 'Join link goes live 10 minutes before the start')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={sectionTitle}>Agenda</div>
            <div style={{ border: '1px solid var(--bd2)', borderRadius: 8 }}>
              {webinar.agenda.map((a, i) => (
                <div key={`${a.time}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderTop: i ? '1px solid var(--bd)' : 'none' }}>
                  <span style={{ width: 64, flex: 'none', fontSize: 13, lineHeight: '20px', color: 'var(--tx3)', fontVariantNumeric: 'tabular-nums' }}>{a.time}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: '20px', color: 'var(--tx)' }}>{a.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={sectionTitle}>Speakers</div>
            {webinar.speakers.map((s, i) => {
              const t = tint[i % 2];
              const ini = s.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={`${s.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span aria-hidden style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: `var(--${t}-soft)`, color: t === 'brand' ? 'var(--brand)' : 'var(--succ-text)', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{ini}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--tx)' }}>{s.name}</span>
                    {s.role && <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--tx3)' }}>{s.role}</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {registered && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, whiteSpace: 'nowrap', fontSize: 13, lineHeight: '20px', color: 'var(--tx3)' }}>
              <span>Plans changed?</span>
              <Hoverable as="button" type="button" onClick={cancelRegistration} style={{ height: 28, padding: '0 6px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--dang-text)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} hoverStyle={{ background: 'var(--dang-soft)' }}>
                Cancel registration
              </Hoverable>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: 8, borderTop: '1px solid var(--bd2)' }}>
          {registered ? (
            <>
              <Hoverable as="button" type="button" style={secondary} hoverStyle={{ background: 'var(--su2)' }} onClick={() => { navigator.clipboard?.writeText(webinar.url); toast('Join link copied'); }}>
                <LinkIcon size={16} />Copy join link
              </Hoverable>
              <Hoverable as="button" type="button" style={{ ...secondary, padding: '0 20px', border: '1px solid transparent', background: 'var(--brand-solid)', color: '#fff' }} hoverStyle={{ background: 'var(--brand-solidHover)' }} onClick={() => toast('Calendar invite downloaded')}>
                <CalendarPlus size={16} />Add to calendar
              </Hoverable>
            </>
          ) : (
            <Hoverable
              as="button"
              type="button"
              onClick={register}
              aria-busy={registering}
              aria-disabled={registering}
              style={{ ...secondary, position: 'relative', padding: '0 20px', border: '1px solid transparent', background: 'var(--brand-solid)', color: '#fff', cursor: registering ? 'default' : 'pointer' }}
              hoverStyle={{ background: 'var(--brand-solidHover)' }}
            >
              <span style={{ visibility: registering ? 'hidden' : 'visible' }}>Register</span>
              {registering && (
                <span aria-label="Registering" style={{ position: 'absolute', inset: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircleNotch size={16} weight="bold" style={{ animation: 'zspin 0.8s linear infinite' }} />
                </span>
              )}
            </Hoverable>
          )}
        </div>
      </aside>
    </>
  );
};

export default WebinarDrawer;
