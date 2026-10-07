import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   The Knowledge Hub's own content types.

   Only evergreen material is declared as data. Anything that describes a
   specific feature - release notes, demo videos, configuration documents - is
   derived from the feature list instead, so the Knowledge Hub and the
   Releases tab can never disagree about what shipped.
   --------------------------------------------------------------------------- */

/** A module-level guide. Not tied to any one release. */
export interface KbDoc {
  id: string;
  title: string;
  blurb: string;
  /** Reading time in minutes. */
  minutes: number;
  /** The document's own body, as paragraphs. Rendered on the document's own
   *  page rather than only summarised here, so opening it - or sharing its
   *  link - keeps the reader on the portal instead of pointing at a URL
   *  nothing actually serves. */
  content: string[];
}

export interface KbVideo {
  id: string;
  title: string;
  /** m:ss, as displayed. */
  duration: string;
  url: string;
}

export interface KbModule {
  /** Must be a value in MODULES, or its documentation is unreachable from a
   *  feature. */
  name: string;
  slug: string;
  /** A full sentence, for the Knowledge Hub grid and the module page header. */
  blurb: string;
  /** Three to six words, for cards too narrow to hold the sentence without
   *  truncating it mid-clause - the Documentation tab's module grid. */
  tagline: string;
  /* No per-module tone. Modules used to be colour-coded across brand, green,
     purple and amber, but the guidelines reserve green/amber/danger for status
     and rule out introducing accent colours - a module is static
     configuration, so it reads brand or neutral and nothing else. */
  docs: KbDoc[];
  videos: KbVideo[];
}

/** A monthly newsletter issue. `month` matches Feature.releaseMonth so an
 *  issue and its release can be joined. */
export interface Newsletter {
  id: string;
  title: string;
  month: string;
  date: string;
  summary: string;
  featureIds: string[];
}

/** Derived, never authored: one release note document per release month, built
 *  from the features the signed-in role is allowed to see. The Knowledge Hub
 *  renders these as full pages; the per-feature detail lives in Releases,
 *  which is one click away. */
export interface ReleaseNoteGroup {
  month: string;
  date: string;
  /** URL-safe "YYYY-MM" - the document's own address is
   *  /release-hub/knowledge/release-notes/:slug. A slug rather than a full
   *  path, same as KbModule.slug, so the route lives with the router and not
   *  with the data. */
  slug: string;
  features: Feature[];
  newCount: number;
  enhancementCount: number;
  /** The modules this release touched, for the document's summary line. */
  modules: string[];
}
