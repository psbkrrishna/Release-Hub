
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
  status: 'Enabled' | 'Disabled' | 'Deferred'; // New status field
  productGate?: string; // Internal only field
  customerName?: string; // Customer name for grouping in implementation view
  configurationDoc?: string; // Configuration document URL for implementation team
  featureTag: 'Enhancement' | 'New Feature'; // New field for feature classification
  featureType?: 'Direct Enablement' | 'Non Deferrable' | 'Self Configurable' | 'Support Required'; // Updated field for feature type
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
