import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Bell, CaretDown, CaretRight, CircleNotch, Gift, Globe, RocketLaunch, UserCircle, VideoCamera, X,
} from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import { useFeatureStore } from '@/components/FeatureStore';
import { useUserRole, type UserRole } from '@/components/UserRoleProvider';
import { useShell } from '@/components/shell/ShellContext';
import { plural } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   The Release Hub V2 top bar, the webinar banner under it, and the release
   pop-up - verbatim from the design. The only addition is the demo role
   picker, which sits where the design keeps its own demo control (the home
   iteration select) and uses the same translucent treatment.
   --------------------------------------------------------------------------- */

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'customer-admin', label: 'Customer admin' },
  { value: 'creator', label: 'Creator (internal)' },
  { value: 'implementation', label: 'Implementation team' },
];

const iconBtn = {
  width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
} as const;

/** The "What's new" pill and its popover. */
const WhatsNew = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const { month, webinar, register, regLabel, registering } = useShell();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const feats = visibleFeatures.filter((f) => f.published && f.releaseMonth === month);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key); };
  }, [open]);

  const goRelease = () => { setOpen(false); navigate(`/product-hub/releases?month=${encodeURIComponent(month)}`); };

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      <Hoverable
        as="button"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen((v) => !v); setSeen(true); }}
        style={{
          height: 32, padding: `0 ${seen ? 14 : 6}px 0 12px`, gap: 6, borderRadius: 999, border: '1px solid rgba(255,255,255,0.32)',
          boxSizing: 'border-box', background: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: '#fff',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
        hoverStyle={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.56)' }}
      >
        <Gift size={20} />
        What's new
        {!seen && feats.length > 0 && (
          <span
            aria-label={`${feats.length} new updates`}
            style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: '#fff', color: 'var(--brand)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {feats.length}
          </span>
        )}
      </Hoverable>

      {open && (
        <div
          role="dialog"
          aria-label="What's new"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 2, width: 400, maxWidth: 'calc(100vw - 32px)',
            background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--elev3)', overflow: 'hidden',
            animation: 'riseIn 160ms ease', color: 'var(--tx)',
          }}
        >
          <div style={{ minHeight: 48, padding: '8px 8px 8px 16px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--bd)' }}>
            <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 700, color: 'var(--tx)', whiteSpace: 'nowrap' }}>{month} release</span>
            <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--tx5)', flex: 'none' }} />
            <span style={{ fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{plural(feats.length, 'feature')}</span>
            <Hoverable
              as="button"
              type="button"
              onClick={goRelease}
              style={{ marginLeft: 'auto', height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--brand)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer' }}
              hoverStyle={{ background: 'var(--brand-soft)' }}
            >
              View release<ArrowRight size={12} weight="bold" />
            </Hoverable>
          </div>
          {webinar && (
            <div style={{ margin: '12px 12px 4px', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--succ-soft)', border: '1px solid var(--succ-border)' }}>
              <span style={{ width: 32, height: 32, boxSizing: 'border-box', flex: 'none', borderRadius: 8, border: '1px solid var(--succ-border)', background: 'var(--card)', color: 'var(--succ-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoCamera size={16} weight="fill" />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Live walkthrough of this release</span>
                <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {webinar.when} · <span style={{ color: 'var(--succ-text)', fontWeight: 600 }}>{webinar.countdown}</span>
                </span>
              </span>
              <RegisterButton onClick={() => { register(); }} label={regLabel} loading={registering} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {feats.slice(0, 4).map((f, i) => (
              <Hoverable
                as="button"
                type="button"
                key={f.id}
                onClick={() => { setOpen(false); navigate(`/product-hub/features/${f.id}`); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 'none', borderTop: i ? '1px solid var(--bd)' : 'none', background: 'var(--card)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'background 120ms ease' }}
                hoverStyle={{ background: 'var(--su1)' }}
              >
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--su2)', color: 'var(--tx3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <RocketLaunch size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: 'var(--tx)', textWrap: 'pretty' as never }}>{f.title}</span>
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx3)' }}>{f.productModule}</span>
                </span>
                <CaretRight size={10} weight="bold" color="var(--tx4)" style={{ flex: 'none' }} />
              </Hoverable>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** The green Register / View details button the webinar surfaces share. */
export const RegisterButton = ({ onClick, label, loading }: { onClick: () => void; label: string; loading: boolean }) => (
  <Hoverable
    as="button"
    type="button"
    onClick={onClick}
    aria-busy={loading}
    style={{
      height: 28, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--succ-solidHover)', color: '#fff',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, position: 'relative', flex: 'none', cursor: loading ? 'default' : 'pointer',
    }}
    hoverStyle={{ background: 'var(--succ-strong)' }}
  >
    <span style={{ visibility: loading ? 'hidden' : 'visible' }}>{label}</span>
    {loading && (
      <span aria-label="Registering" style={{ position: 'absolute', inset: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircleNotch size={14} weight="bold" style={{ animation: 'zspin 0.8s linear infinite' }} />
      </span>
    )}
  </Hoverable>
);

export const TopBar = ({ onZeva, zevaOpen }: { onZeva: () => void; zevaOpen: boolean }) => {
  const navigate = useNavigate();
  const { userRole, setUserRole } = useUserRole();
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: 'var(--brand-solid)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 200, fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => navigate('/dashboard')} aria-label="Zwayam home" style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex' }}>
          <img src="/zwayam-logo.png" alt="Zwayam" style={{ height: 36, width: 'auto', display: 'block' }} />
        </button>
        <div style={{ position: 'relative' }}>
          <select
            aria-label="Demo role"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            style={{ appearance: 'none', WebkitAppearance: 'none', height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.32)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '0 32px 0 12px', cursor: 'pointer', outline: 'none' }}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value} style={{ color: '#222' }}>{r.label}</option>)}
          </select>
          <CaretDown size={14} color="#fff" style={{ position: 'absolute', right: 10, top: 9, pointerEvents: 'none' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Hoverable
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2, height: 32, padding: '0 8px 0 12px', borderRadius: 999, color: '#fff', cursor: 'pointer' }}
          hoverStyle={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <Globe size={20} />
          <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>EN</span>
          <CaretDown size={14} />
        </Hoverable>
        <button type="button" aria-label="Zēva" aria-pressed={zevaOpen} title="Ask Zēva" onClick={onZeva} style={{ height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', flex: 'none' }}>
          <img src="/zeva-cta.png" alt="Zēva" style={{ height: 32, width: 'auto', display: 'block' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WhatsNew />
          <Hoverable as="button" type="button" aria-label="Notifications" title="Notifications" style={{ ...iconBtn }} hoverStyle={{ background: 'rgba(255,255,255,0.14)' }}>
            <Bell size={20} />
          </Hoverable>
          <Hoverable as="button" type="button" aria-label="Account" title="Account" style={{ ...iconBtn }} hoverStyle={{ background: 'rgba(255,255,255,0.14)' }}>
            <UserCircle size={24} />
          </Hoverable>
        </div>
      </div>
    </div>
  );
};

/** The green webinar strip fixed under the top bar. */
export const WebinarBanner = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const { showBanner, webinar, month, dismissBanner, register, regLabel, registering } = useShell();
  if (!showBanner || !webinar) return null;
  const n = visibleFeatures.filter((f) => f.published && f.releaseMonth === month).length;
  return (
    <div
      role="note"
      style={{
        position: 'fixed', top: 56, left: 0, right: 0, height: 44, boxSizing: 'border-box', zIndex: 195, display: 'flex',
        alignItems: 'center', gap: 12, background: 'var(--succ-soft)', borderBottom: '1px solid var(--succ-border)', padding: '0 16px',
        fontSize: 14, color: 'var(--tx2)', fontFamily: "'Source Sans 3', -apple-system, sans-serif",
      }}
    >
      <span style={{ width: 28, height: 28, boxSizing: 'border-box', flex: 'none', borderRadius: 8, border: '1px solid var(--succ-border)', background: 'var(--card)', color: 'var(--succ-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <VideoCamera size={16} weight="fill" />
      </span>
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <b style={{ color: 'var(--tx)', fontWeight: 700 }}>{webinar.title}</b> · live webinar on {webinar.when} ·{' '}
        <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{webinar.countdown}</span>
      </span>
      <Hoverable
        as="button"
        type="button"
        onClick={() => navigate(`/product-hub/releases?month=${encodeURIComponent(month)}`)}
        style={{ height: 28, padding: '0 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--succ-text)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', cursor: 'pointer' }}
        hoverStyle={{ background: 'var(--succ-softHover)' }}
      >
        View {n} {month.split(' ')[0]} features
      </Hoverable>
      <RegisterButton onClick={register} label={regLabel} loading={registering} />
      <Hoverable
        as="button"
        type="button"
        aria-label="Dismiss webinar banner"
        title="Dismiss"
        onClick={dismissBanner}
        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
        hoverStyle={{ background: 'var(--succ-softHover)' }}
      >
        <X size={16} />
      </Hoverable>
    </div>
  );
};

/** The release pop-up shown on first landing on the dashboard. */
export const ReleaseModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const { month, webinar, register, regLabel } = useShell();
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const fs = visibleFeatures.filter((f) => f.published && f.releaseMonth === month);
  const title = `${fs.length} new ways to move work forward`;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 480, background: 'rgba(17,24,39,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'scrimIn 160ms ease', fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}
    >
      <div style={{ width: 520, maxWidth: '100%', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: 12, boxShadow: 'var(--elev3)', overflow: 'hidden', animation: 'riseIn 180ms ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 12px 12px', borderBottom: '1px solid var(--bd2)' }}>
          <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 8, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--brand)' }}>{month} release</span>
            <span style={{ fontSize: 18, lineHeight: '24px', fontWeight: 700, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          </div>
          <Hoverable as="button" type="button" onClick={onClose} aria-label="Close" title="Close" style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--su2)' }}>
            <X size={16} />
          </Hoverable>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {webinar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--succ-soft)', border: '1px solid var(--succ-border)' }}>
              <span style={{ width: 32, height: 32, boxSizing: 'border-box', flex: 'none', borderRadius: 8, border: '1px solid var(--succ-border)', background: 'var(--card)', color: 'var(--succ-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoCamera size={16} weight="fill" />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{webinar.title}</span>
                <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Live webinar · {webinar.when} · <span style={{ color: 'var(--succ-text)', fontWeight: 600 }}>{webinar.countdown}</span>
                </span>
              </span>
              <RegisterButton onClick={() => { onClose(); register(); }} label={regLabel} loading={false} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
            {fs.slice(0, 4).map((f, i) => (
              <Hoverable
                as="button"
                type="button"
                key={f.id}
                onClick={() => { onClose(); navigate(`/product-hub/features/${f.id}`); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: 'none', borderTop: i ? '1px solid var(--bd)' : 'none', background: 'var(--card)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                hoverStyle={{ background: 'var(--su1)' }}
              >
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, color: 'var(--tx)' }}>{f.title}</span>
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx3)' }}>{f.productModule} · {f.featureTag === 'New Feature' ? 'New feature' : 'Enhancement'}</span>
                </span>
                <CaretRight size={12} weight="bold" color="var(--tx4)" style={{ flex: 'none' }} />
              </Hoverable>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: 8, borderTop: '1px solid var(--bd2)' }}>
          <Hoverable as="button" type="button" onClick={onClose} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx2)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} hoverStyle={{ background: 'var(--su1)' }}>
            Got it
          </Hoverable>
          <Hoverable
            as="button"
            type="button"
            onClick={() => { onClose(); navigate(`/product-hub/releases?month=${encodeURIComponent(month)}`); }}
            style={{ height: 36, padding: '0 20px', borderRadius: 8, border: '1px solid transparent', background: 'var(--brand-solid)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            hoverStyle={{ background: 'var(--brand-solidHover)' }}
          >
            View release
          </Hoverable>
        </div>
      </div>
    </div>
  );
};
