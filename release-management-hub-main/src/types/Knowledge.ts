import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   The Knowledge Hub's own content types.

   Only evergreen material is declared as data. Anything that describes a
   specific feature - release notes, demo videos, configuration documents - is
   derived from the feature list instead, so the Knowledge Hub and the Release
   Management tab can never disagree about what shipped.
   --------------------------------------------------------------------------- */

/** A module-level guide. Not tied to any one release. */
export interface KbDoc {
  id: string;
  title: string;
  blurb: string;
  /** Reading time in minutes. */
  minutes: number;
  url: string;
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
   *  truncating it mid-clause - the Home tab's module grid. */
  tagline: string;
  tone: 'brand' | 'green' | 'purple' | 'amber' | 'neutral';
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
  url: string;
  featureIds: string[];
}

/** Derived, never authored: one release note document per release month, built
 *  from the features the signed-in role is allowed to see. The Knowledge Hub
 *  lists these as documents; the per-feature detail lives in Release
 *  Management, which is one click away. */
export interface ReleaseNoteGroup {
  month: string;
  date: string;
  /** The release note document itself. */
  url: string;
  features: Feature[];
  newCount: number;
  enhancementCount: number;
  /** The modules this release touched, for the document's summary line. */
  modules: string[];
}
