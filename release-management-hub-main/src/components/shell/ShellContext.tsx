import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useFeatureStore } from '@/components/FeatureStore';
import { useLatestRelease, useUpcomingWebinar } from '@/components/ReleaseStore';
import { webinarCountdown } from '@/data/releases';

/* ---------------------------------------------------------------------------
   Shell state the Release Hub V2 design shares between the top bar, the
   webinar banner, the hero, the release pop-up and the webinar drawer:

   - whether the webinar banner shows (it moves everything below it down 44px);
   - the customer's registration, and its flow: Register shows a spinner for a
     beat, then the registration is made and the details drawer opens with the
     "You're in" confirmation. Once registered the banner is gone, and every
     Register button reads "View details" and opens the same drawer.
   --------------------------------------------------------------------------- */

export interface ShellWebinar {
  title: string;
  url: string;
  /** "Wed 18 Nov, 3:00 PM" */
  when: string;
  /** "starts in 7 days" */
  countdown: string;
  /** "Wednesday 18 November 2026" */
  dateLong: string;
  /** "18 Nov" */
  dateShort: string;
  /** "3:00 PM - 3:45 PM IST" */
  timeRange: string;
  venue: string;
  bannerUrl: string;
  agenda: Array<{ time: string; title: string }>;
  speakers: Array<{ name: string; role: string }>;
}

interface ShellValue {
  /** Top of the page content: 56px, or 100px with the webinar banner. */
  shellTop: number;
  month: string;
  webinar?: ShellWebinar;
  showBanner: boolean;
  dismissBanner: () => void;
  registered: boolean;
  registering: boolean;
  /** Register, or open the details when already registered. */
  register: () => void;
  regLabel: string;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  cancelRegistration: () => void;
  /** The "You're in" card inside the drawer. */
  confirmShown: boolean;
  dismissConfirm: () => void;
  firstName: string;
}

const Ctx = createContext<ShellValue | undefined>(undefined);

export const useShell = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShell must be used within ShellProvider');
  return v;
};

const DEFAULT_SPEAKERS = [
  { name: 'Ananya Rao', role: 'Host · Product Management' },
  { name: 'Vikram Mehta', role: 'Live demo · Customer Success' },
];

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const month = useLatestRelease();
  const up = useUpcomingWebinar(month);
  const { visibleFeatures } = useFeatureStore();
  const [dismissed, setDismissed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const timer = useRef<number>();

  const webinar = useMemo<ShellWebinar | undefined>(() => {
    if (!up) return undefined;
    const start = new Date(up.startsAt);
    const clock = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const at = (min: number) => clock(new Date(start.getTime() + min * 60000));
    let end = new Date(start.getTime() + 45 * 60000);
    if (up.endsAt) {
      const [h, m] = up.endsAt.split(':').map(Number);
      const e = new Date(start); e.setHours(h, m, 0, 0);
      if (e > start) end = e;
    }
    const feats = visibleFeatures.filter((f) => f.published && f.releaseMonth === month).slice(0, 4);
    const written = (up.agenda ?? '').replace(/<[^>]+>/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
    const titles = written.length
      ? written
      : [`Welcome and what's in the ${month} release`, ...feats.map((f) => f.title), 'Live Q&A'];
    const step = Math.max(4, Math.min(8, Math.floor(40 / Math.max(1, titles.length))));
    const c = webinarCountdown(up.startsAt);
    const date = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
    return {
      title: up.title,
      url: up.url,
      when: `${date}, ${clock(start)}`,
      countdown: lower(c),
      dateLong: start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dateShort: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      timeRange: `${clock(start)} - ${clock(end)} ${up.timeZone ?? 'IST'}`,
      venue: up.venue ?? 'Zoom',
      bannerUrl: up.bannerUrl ?? '/webinar-banner-jul26.jpg',
      agenda: titles.map((title, i) => ({ time: at(i * step), title })),
      speakers: up.speakers?.length ? up.speakers : DEFAULT_SPEAKERS,
    };
  }, [up, month, visibleFeatures]);

  const register = useCallback(() => {
    if (registering) return;
    if (registered) { setDrawerOpen(true); return; }
    setRegistering(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setRegistering(false);
      setRegistered(true);
      setConfirmDismissed(false);
      setDrawerOpen(true);
    }, 1100);
  }, [registering, registered]);

  const cancelRegistration = useCallback(() => {
    setDrawerOpen(false);
    setRegistered(false);
    toast('Registration cancelled');
  }, []);

  /* The banner stays until the user dismisses it. Registering changes what it
     says (a registered state and View details), not whether it shows. */
  const showBanner = !!webinar && !dismissed;

  const value = useMemo<ShellValue>(() => ({
    shellTop: showBanner ? 100 : 56,
    month,
    webinar,
    showBanner,
    dismissBanner: () => setDismissed(true),
    registered,
    registering,
    register,
    regLabel: registered ? 'View details' : 'Register',
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    cancelRegistration,
    confirmShown: registered && !confirmDismissed,
    dismissConfirm: () => setConfirmDismissed(true),
    firstName: 'Ananya',
  }), [showBanner, month, webinar, registered, registering, register, drawerOpen, cancelRegistration, confirmDismissed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
