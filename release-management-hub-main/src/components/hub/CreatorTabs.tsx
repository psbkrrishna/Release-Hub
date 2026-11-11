import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Hoverable from '@/components/primitives/Hoverable';
import Tooltip from '@/components/primitives/Tooltip';
import { useFeatureStore } from '@/components/FeatureStore';

/* ---------------------------------------------------------------------------
   The creator's views of Get help, as Zerra line tabs - the guidelines' pattern
   for peer views inside one surface:

     Features & releases · Help content · Preview

   The first two are Configuration (where features, releases and help content
   are made and published); Preview is Get help as customers see it, with
   unpublished items marked. Creators land on Configuration. The tabs sit at
   the foot of the page header on every Get help page, so moving between the
   views never leaves the section.

   Leaving a preview page for Configuration lands on the matching place: the
   release month, the feature's edit panel, or Help content.
   --------------------------------------------------------------------------- */

export const CONFIGURE = '/product-hub/configure';
export const PREVIEW = '/product-hub/overview';

/** Where "Features & releases" should open for the preview page the creator is on. */
export const useConfigureTarget = (): string => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [, , area, id] = pathname.replace(/\/+$/, '').split('/');
  const month = params.get('month');
  if (area === 'releases' && month) return `${CONFIGURE}?month=${encodeURIComponent(month)}`;
  if (area === 'features' && id) return `${CONFIGURE}?edit=${encodeURIComponent(id)}`;
  return CONFIGURE;
};

type Key = 'feat' | 'content' | 'preview';

const CreatorTabs = ({ standalone = false }: { standalone?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { isCreator } = useFeatureStore();
  const toFeat = useConfigureTarget();
  if (!isCreator) return null;

  const inConfig = pathname.replace(/\/+$/, '') === CONFIGURE;
  const current: Key = !inConfig ? 'preview' : params.get('tab') === 'content' ? 'content' : 'feat';

  const tabs: Array<{ key: Key; label: string; tip: string; go: () => void }> = [
    { key: 'feat', label: 'Features & releases', tip: 'Create, edit and publish features and release details', go: () => navigate(toFeat) },
    { key: 'content', label: 'Help content', tip: 'Add and publish guides, newsletters and videos', go: () => navigate(`${CONFIGURE}?tab=content`) },
    { key: 'preview', label: 'Preview', tip: 'Get help as customers see it. Unpublished items are marked', go: () => navigate(PREVIEW) },
  ];

  return (
    <div
      role="tablist"
      aria-label="Get help views"
      style={{
        display: 'flex', gap: 24, padding: '0 16px', background: 'var(--card)', overflowX: 'auto', overflowY: 'hidden',
        ...(standalone ? { margin: '-16px -16px 0', borderBottom: '1px solid var(--bd2)' } : { margin: '8px -16px 0' }),
      }}
    >
      {tabs.map((t) => {
        const on = t.key === current;
        return (
          <Tooltip key={t.key} label={t.tip}>
            <Hoverable
              as="button"
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => { if (!on) t.go(); }}
              style={{
                height: 38, padding: '0 4px', margin: '0 0 -1px', border: 'none', borderBottom: `2px solid ${on ? 'var(--brand)' : 'transparent'}`,
                background: 'transparent', color: on ? 'var(--brand)' : 'var(--tx3)', fontFamily: 'inherit', fontSize: 14, fontWeight: on ? 600 : 500,
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: on ? 'default' : 'pointer', flex: 'none',
              }}
              hoverStyle={on ? undefined : { color: 'var(--brand)' }}
            >
              {t.label}
            </Hoverable>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default CreatorTabs;
