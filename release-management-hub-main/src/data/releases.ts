import type { ReleaseMeta, ReleaseWebinar } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Release-level facts, keyed by release month: the one release notes document,
   and the webinar that walks customers through the release.

   They used to be spread across features - the notes URL was typed once per
   feature, and a webinar had nowhere to live - because a release was only
   ever the month its features shared.
   --------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DDTHH:mm" in local time, for the webinar picker's input value. */
export const toLocalInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* The seed webinar is a week out from whenever the app loads, at 3 PM, so the
   demo never opens on a webinar that has already happened. */
const seedWebinarStart = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(15, 0, 0, 0);
  return toLocalInput(d);
};

export const seedReleases = (): ReleaseMeta[] => [
  {
    month: 'July 2026',
    webinar: {
      title: 'July 2026 release walkthrough',
      url: 'https://zwayam.com/webinars/july-2026-release',
      startsAt: seedWebinarStart(),
    },
  },
  { month: 'June 2026' },
  { month: 'May 2026' },
  { month: 'August 2026' },
];

/** The webinar, only while it is still ahead of us. A past webinar is not
 *  promoted - a registration link for something that has happened is worse than
 *  none. */
export const upcomingWebinar = (
  meta: ReleaseMeta | undefined,
  now: number = Date.now(),
): ReleaseWebinar | undefined => {
  const w = meta?.webinar;
  if (!w?.url) return undefined;
  const t = new Date(w.startsAt).getTime();
  return Number.isNaN(t) || t <= now ? undefined : w;
};

/** "Thu 24 Jul, 3:00 PM" */
export const formatWebinarWhen = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day.replace(',', '')}, ${time}`;
};

/** "Starts today", "Starts tomorrow", "Starts in 6 days" - the line that tells a
 *  reader how soon, which the date alone does not. */
export const webinarCountdown = (iso: string, now: Date = new Date()): string => {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return '';
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(start) - day(now)) / 86_400_000);
  if (days <= 0) return 'Starts today';
  if (days === 1) return 'Starts tomorrow';
  return `Starts in ${days} days`;
};

/** What the release notes upload accepts: a document people open or download,
 *  not an image or an archive. */
export const RELEASE_NOTES_ACCEPT = '.pdf,.doc,.docx';
export const RELEASE_NOTES_MAX_BYTES = 10 * 1024 * 1024;

const NOTES_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const isReleaseNotesFile = (file: File): boolean =>
  NOTES_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

/** "184 KB", "2.3 MB" */
export const formatBytes = (n: number): string =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

/** http(s) only, so a pasted `javascript:` string can never become a link. */
export const isHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};
