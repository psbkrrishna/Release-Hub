
export type FeatureType = 'Default On' | 'Default Off' | 'Non Deferrable';

export const FEATURE_TYPES: FeatureType[] = ['Default On', 'Default Off', 'Non Deferrable'];

export interface Feature {
  id: string;
  title: string;
  summary?: string; // New field for 2-line summary
  /** The long-form explanation shown under "What's new" on the feature page.
   *  The summary says what it is in a line; this says how it works. */
  description?: string;
  productModule: string;
  /** @deprecated Release notes are one per release - see ReleaseMeta. Nothing
   *  reads this any more; it survives only on seed rows. */
  releaseNotes?: string;
  demoVideo: string;
  enablementDate: string;
  prodEnablementDate: string;
  deferrableTill?: string; // New field for automatic enablement date
  supportNeeded: boolean;
  isEnabled: boolean;
  status: 'Enabled' | 'Disabled' | 'Deferred' | 'Contact CSM' | 'Enablement requested';
  /** Unpublished features are visible to the Creator role only. */
  published: boolean;
  /** The release a feature belongs to, e.g. "July 2026". Drives the month filter. */
  releaseMonth: string;
  /** Surfaced in the UI as "Feature Flag (Internal)". */
  productGate?: string;
  customerName?: string; // Customer name for grouping in implementation view
  configurationDoc?: string; // Configuration document URL for implementation team
  featureTag: 'Enhancement' | 'New Feature';
  /* Three values only: what happens to the feature at release, stated from
     the customer's side. The older set mixed enablement route with support
     model, which is why two of its values meant the same thing to a reader. */
  featureType?: FeatureType;
  isPaid?: boolean; // New field to indicate if it's a paid feature
  // Analytics fields for creator view
  enabledCustomers?: number; // Number of customers who have enabled this feature
  activeCustomers?: number; // Number of customers actively using this feature
  mauLast30Days?: number; // Monthly Active Users in last 30 days
  dauLast30DayAvg?: number; // Daily Active Users average over last 30 days
  releaseId?: string;
  productRoute?: string;
  /** Whether this feature is announced: it appears in the What's New popup and
   *  floater, and among the highlights on the Overview's release band. A
   *  released feature is not automatically news - a back-end change or a fix
   *  belongs in the release table without leading the Overview.
   *
   *  Undefined counts as announced, because the seed rows predate the flag.
   *  Read it through isInWhatsNew() rather than testing it directly. */
  showInWhatsNew?: boolean;
  /** What the customer gets out of it - at most three bullets, shown as
   *  "Value delivered" on the feature page. Seed rows that predate this field
   *  fall back to announcementBullets; read both through valueOf(). */
  valueDelivered?: string[];
  announcementBullets?: string[];
}

/** The three value bullets a feature is allowed. */
export const MAX_VALUE_BULLETS = 3;

/** The seed rows as originally authored. data/features.ts applies the fields
 *  the redesign added - publication state, release month, and the new Feature
 *  Type vocabulary - so the seed file itself stays untouched. */
export type SeedFeature = Omit<Feature, 'published' | 'releaseMonth' | 'featureType'> & {
  featureType?: 'Direct Enablement' | 'Non Deferrable' | 'Self Configurable' | 'Support Required';
};

/** A webinar that walks customers through a release. */
export interface ReleaseWebinar {
  title: string;
  /** Registration page. */
  url: string;
  /** Local date-time, "YYYY-MM-DDTHH:mm". Once it passes, the webinar is no
   *  longer promoted anywhere. */
  startsAt: string;
  /** The rest of the release drawer's webinar step. Optional, so seed records
   *  and older saves still type-check. */
  endsAt?: string;
  timeZone?: string;
  venue?: string;
  agenda?: string;
  speakers?: Array<{ name: string; role: string }>;
  /** Blob URL of the uploaded banner image, for the session. */
  bannerUrl?: string;
}

/** An uploaded release notes document. `url` is a blob URL for the session: with
 *  no backend yet, the file lives in memory like every other edit, and goes
 *  with a page refresh. */
export interface ReleaseNotesFile {
  name: string;
  size: number;
  /** MIME type, e.g. application/pdf. */
  type: string;
  url: string;
}

/** What is true of a release as a whole, rather than of any one feature. A
 *  release is still identified by its month - the same string as
 *  Feature.releaseMonth - so a feature never needs to point at it. */
export interface ReleaseMeta {
  month: string;
  /** The release's one notes document, uploaded once for the whole release. */
  releaseNotes?: ReleaseNotesFile;
  webinar?: ReleaseWebinar;
}

export type AnnouncementPlacement = 'login' | 'dashboard' | 'contextual';

export interface Announcement {
  id: string;
  releaseId: string;
  featureId?: string;
  title: string;
  summary: string;
  audience: Array<'customer' | 'customer-admin'>;
  placement: AnnouncementPlacement;
  activeFrom: string;
  activeUntil: string;
  priority: number;
  dismissible: boolean;
}
