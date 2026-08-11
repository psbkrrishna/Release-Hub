
export type FeatureType = 'Default On' | 'Default Off' | 'Non Deferrable';

export const FEATURE_TYPES: FeatureType[] = ['Default On', 'Default Off', 'Non Deferrable'];

export interface Feature {
  id: string;
  title: string;
  summary?: string; // New field for 2-line summary
  productModule: string;
  releaseNotes: string;
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
  announcementBullets?: string[];
}

/** The seed rows as originally authored. data/features.ts applies the fields
 *  the redesign added - publication state, release month, and the new Feature
 *  Type vocabulary - so the seed file itself stays untouched. */
export type SeedFeature = Omit<Feature, 'published' | 'releaseMonth' | 'featureType'> & {
  featureType?: 'Direct Enablement' | 'Non Deferrable' | 'Self Configurable' | 'Support Required';
};

export interface Release {
  id: string;
  name: string;
  date: string;
  summary: string;
  status: 'Scheduled' | 'Released';
  featureIds: string[];
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
