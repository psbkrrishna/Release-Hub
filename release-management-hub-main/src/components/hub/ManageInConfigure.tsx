import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowSquareOut } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import Tooltip from '@/components/primitives/Tooltip';
import { useFeatureStore } from '@/components/FeatureStore';

/* ---------------------------------------------------------------------------
   The creator's way from what customers see in Get help to where it is
   managed. One control, on every Get help surface Configure actually manages
   (Overview, Releases, a feature, Documentation), and it lands on the matching
   place: the release month, the feature's edit drawer, or Help content.

   Styled as the guidelines' "Secondary · brand" button - card, brand text,
   --brand-border - with the link-out icon the guidelines give actions that
   leave for another product area. It sits last in the page header's action
   row. A header that already has a primary keeps that as its only primary.
   On the Overview's navy hero it takes the hero's own translucent treatment.
   --------------------------------------------------------------------------- */

/** Where Configure should open for the page the creator is on. */
export const useConfigureTarget = (): { to: string; tip: string } | null => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { isCreator } = useFeatureStore();
  if (!isCreator) return null;
  const [, , area, id] = pathname.replace(/\/+$/, '').split('/');
  if (area === 'overview') return { to: '/configure', tip: 'Manage features, releases and help content' };
  if (area === 'releases') {
    const month = params.get('month');
    return month
      ? { to: `/configure?month=${encodeURIComponent(month)}`, tip: `Manage the ${month} release and its features` }
      : { to: '/configure', tip: 'Create, edit and publish features and releases' };
  }
  if (area === 'features' && id) return { to: `/configure?edit=${encodeURIComponent(id)}`, tip: 'Edit this feature in Configure' };
  if (area === 'knowledge') return { to: '/configure?tab=content', tip: 'Add and publish guides, newsletters and videos' };
  return null;
};

const ManageInConfigure = ({ onNavy = false }: { onNavy?: boolean }) => {
  const navigate = useNavigate();
  const target = useConfigureTarget();
  if (!target) return null;

  const style = onNavy
    ? { height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.32)', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }
    : { height: 36, padding: '0 20px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'var(--card)', color: 'var(--brand)' };

  return (
    <Tooltip label={target.tip}>
      <Hoverable
        as="button"
        type="button"
        onClick={() => navigate(target.to)}
        style={{ ...style, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background 120ms ease' }}
        hoverStyle={onNavy ? { background: 'rgba(255,255,255,0.2)' } : { background: 'var(--brand-soft)' }}
      >
        <ArrowSquareOut size={16} />Manage in Configure
      </Hoverable>
    </Tooltip>
  );
};

export default ManageInConfigure;
