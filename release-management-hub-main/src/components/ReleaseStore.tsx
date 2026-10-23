import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { seedReleases, upcomingWebinar } from '@/data/releases';
import { latestRelease } from '@/data/features';
import { releaseNoteSlug } from '@/data/knowledge';
import { HUB } from '@/lib/routes';
import { useFeatureStore } from '@/components/FeatureStore';
import type { ReleaseMeta, ReleaseNotesFile, ReleaseWebinar } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Release-level details: the release notes URL and the webinar. Kept apart from
   FeatureStore because they belong to the release, not to any feature in it -
   one record per month, edited in one place.
   --------------------------------------------------------------------------- */

interface ReleaseStoreValue {
  /** The record for a month, or undefined when nothing has been set for it. */
  releaseFor: (month: string) => ReleaseMeta | undefined;
  saveRelease: (meta: ReleaseMeta) => void;
}

const ReleaseStoreContext = createContext<ReleaseStoreValue | undefined>(undefined);

export const useReleaseStore = () => {
  const ctx = useContext(ReleaseStoreContext);
  if (!ctx) throw new Error('useReleaseStore must be used within a ReleaseStore');
  return ctx;
};

/** The release the announcement surfaces speak for. */
export const useLatestRelease = (): string => {
  const { features } = useFeatureStore();
  return useMemo(() => latestRelease(features), [features]);
};

/** A release's webinar while it is still ahead, otherwise undefined. */
export const useUpcomingWebinar = (month: string): ReleaseWebinar | undefined => {
  const { releaseFor } = useReleaseStore();
  return upcomingWebinar(releaseFor(month));
};

/** Where "release notes" leads for a month: the file uploaded for the release
 *  when there is one, otherwise the generated document in the hub. */
export const useReleaseNotesTarget = (month: string) => {
  const { releaseFor } = useReleaseStore();
  return {
    file: releaseFor(month)?.releaseNotes,
    path: `${HUB}/knowledge/release-notes/${releaseNoteSlug(month)}`,
  };
};

/** Opens an uploaded notes file from a click handler, the same way the anchor
 *  from notesLinkProps would. */
export const openNotesFile = (file: ReleaseNotesFile) => {
  const a = document.createElement('a');
  Object.assign(a, notesLinkProps(file));
  a.click();
};

/** Props for an anchor that opens an uploaded notes file: a PDF opens in the
 *  browser's own viewer in a new tab, while a Word file has no viewer and so
 *  downloads under its own name. */
export const notesLinkProps = (file: ReleaseNotesFile) => ({
  href: file.url,
  target: '_blank' as const,
  rel: 'noopener noreferrer',
  ...(file.type === 'application/pdf' ? {} : { download: file.name }),
});

const ReleaseStore = ({ children }: { children: React.ReactNode }) => {
  const [releases, setReleases] = useState<ReleaseMeta[]>(seedReleases);

  const releaseFor = useCallback(
    (month: string) => releases.find((r) => r.month === month),
    [releases],
  );

  const saveRelease = useCallback(
    (meta: ReleaseMeta) => {
      // A replaced or removed upload is no longer reachable, so free its blob.
      const previous = releases.find((r) => r.month === meta.month)?.releaseNotes;
      if (previous && previous.url !== meta.releaseNotes?.url) URL.revokeObjectURL(previous.url);
      setReleases((current) =>
        current.some((r) => r.month === meta.month)
          ? current.map((r) => (r.month === meta.month ? meta : r))
          : [...current, meta],
      );
    },
    [releases],
  );

  const value = useMemo(() => ({ releaseFor, saveRelease }), [releaseFor, saveRelease]);

  return <ReleaseStoreContext.Provider value={value}>{children}</ReleaseStoreContext.Provider>;
};

export default ReleaseStore;
