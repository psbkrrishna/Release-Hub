import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useLatestRelease, useUpcomingWebinar } from '@/components/ReleaseStore';
import { formatWebinarWhen, webinarCountdown } from '@/data/releases';

/* ---------------------------------------------------------------------------
   Shell state the Release Hub V2 design shares between the top bar, the
   webinar banner, the hero and the release pop-up: whether the webinar banner
   is showing (it moves everything below it down 44px), and the customer's
   registration for the release webinar.
   --------------------------------------------------------------------------- */

export interface ShellWebinar {
  title: string;
  url: string;
  /** "Wed 18 Nov, 3:00 PM" */
  when: string;
  /** "starts in 7 days" */
  countdown: string;
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
  register: () => void;
  regLabel: string;
}

const Ctx = createContext<ShellValue | undefined>(undefined);

export const useShell = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShell must be used within ShellProvider');
  return v;
};

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const month = useLatestRelease();
  const up = useUpcomingWebinar(month);
  const [dismissed, setDismissed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const timer = useRef<number>();

  const webinar = useMemo<ShellWebinar | undefined>(() => {
    if (!up) return undefined;
    const c = webinarCountdown(up.startsAt);
    return { title: up.title, url: up.url, when: formatWebinarWhen(up.startsAt), countdown: c.charAt(0).toLowerCase() + c.slice(1) };
  }, [up]);

  const register = useCallback(() => {
    if (registering) return;
    if (registered) {
      if (webinar) window.open(webinar.url, '_blank', 'noopener');
      return;
    }
    setRegistering(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setRegistering(false);
      setRegistered(true);
      toast.success("You're registered. The join link is in your email");
    }, 1100);
  }, [registering, registered, webinar]);

  const showBanner = !!webinar && !dismissed && !registered;

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
  }), [showBanner, month, webinar, registered, registering, register]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
