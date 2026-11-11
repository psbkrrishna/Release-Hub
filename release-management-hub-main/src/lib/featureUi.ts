import type { Feature } from '@/types/Feature';
import type { UserRole } from '@/components/UserRoleProvider';

/* ---------------------------------------------------------------------------
   How the Release Hub V2 design presents a feature: tag colours, the status
   pill, the activation label, and the customer status cell. One place, so the
   header, the Releases tables and the feature page agree.
   --------------------------------------------------------------------------- */

export interface Pill { label: string; bg: string; fg: string; bd: string }

export const tagLabel = (f: Feature) => (f.featureTag === 'New Feature' ? 'New feature' : 'Enhancement');

export const tagStyle = (f: Feature): Omit<Pill, 'label'> =>
  f.featureTag === 'New Feature'
    ? { bg: 'var(--indigo-soft)', fg: 'var(--indigo)', bd: 'var(--indigo-border)' }
    : { bg: 'var(--brand-soft)', fg: 'var(--brand)', bd: 'var(--brand-border)' };

const isMandatory = (f: Feature) => f.featureType === 'Non Deferrable';

export const badgeFor = (f: Feature): Pill => {
  if (!f.published) return { label: 'Unpublished', bg: 'var(--warn-soft)', fg: 'var(--warn-text)', bd: 'var(--warn-border)' };
  if ((isMandatory(f) || f.isEnabled) && f.status !== 'Contact CSM' && f.status !== 'Enablement requested')
    return { label: 'Enabled', bg: 'var(--succ-soft)', fg: 'var(--succ-text)', bd: 'var(--succ-border)' };
  if (f.status === 'Contact CSM') return { label: 'Contact CSM', bg: 'var(--warn-soft)', fg: 'var(--warn-text)', bd: 'var(--warn-border)' };
  if (f.status === 'Enablement requested') return { label: 'Enablement requested', bg: 'var(--warn-soft)', fg: 'var(--warn-text)', bd: 'var(--warn-border)' };
  return { label: 'Disabled', bg: 'var(--su2)', fg: 'var(--tx3)', bd: 'var(--bd2)' };
};

export const typeLabel = (f: Feature) =>
  f.featureType === 'Default Off' ? 'Default off' : f.featureType === 'Non Deferrable' ? 'Non deferrable' : 'Default on';

export const typeTip = (f: Feature) =>
  f.featureType === 'Default Off'
    ? 'Off at release. Customer admins can turn it on.'
    : f.featureType === 'Non Deferrable'
      ? "Enabled for everyone at release. Customers can't turn it off."
      : 'Enabled at release. Customer admins can turn it off.';

export type CustomerStatus =
  | { kind: 'mandatory' }
  | { kind: 'badge'; label: string; tip: string; bg: string; fg: string; bd: string; headset?: boolean }
  | { kind: 'toggle'; on: boolean; can: boolean };

/** The customer table's status cell. Only a customer admin can toggle. */
export const statusOf = (f: Feature, role: UserRole): CustomerStatus => {
  if (isMandatory(f)) return { kind: 'mandatory' };
  if (f.status === 'Contact CSM')
    return { kind: 'badge', label: 'Contact CSM', headset: true, tip: 'Needs setup by your customer success manager', bg: 'var(--warn-soft)', fg: 'var(--warn-text)', bd: 'var(--warn-border)' };
  if (f.status === 'Enablement requested')
    return { kind: 'badge', label: 'Enablement requested', tip: 'Zwayam is turning this on for you', bg: 'var(--warn-soft)', fg: 'var(--warn-text)', bd: 'var(--warn-border)' };
  const can = role === 'customer-admin';
  if (!can)
    return f.isEnabled
      ? { kind: 'badge', label: 'Enabled', tip: 'On for your organisation. Only customer admins can change this.', bg: 'var(--succ-soft)', fg: 'var(--succ-text)', bd: 'var(--succ-border)' }
      : { kind: 'badge', label: 'Disabled', tip: 'Off for your organisation. Only customer admins can change this.', bg: 'var(--su2)', fg: 'var(--tx3)', bd: 'var(--bd2)' };
  return { kind: 'toggle', on: f.isEnabled, can };
};

/** "1 Jul 2026" */
export const fmtDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
};
