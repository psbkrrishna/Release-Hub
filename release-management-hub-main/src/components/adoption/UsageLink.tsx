import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@/components/primitives/Tooltip';
import { adoptionUrl } from '@/lib/routes';
import type { Feature } from '@/types/Feature';
import { T } from '@/styles/zerra';

/* A usage number that opens the adoption page already filtered to its
   feature and to the question its column asks. A draft has no usage to show,
   so its zero stays plain text. */
const UsageLink = ({
  feature,
  params = {},
  children,
}: {
  feature: Feature;
  params?: Record<string, string>;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  if (!feature.published) return <>{children}</>;
  return (
    <Tooltip label="View adoption details">
      <button
        type="button"
        onClick={() => navigate(adoptionUrl({ feature: feature.id, ...params }))}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          color: hover ? T.brand : 'inherit',
          textDecoration: hover ? 'underline' : 'none',
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
};

export default UsageLink;
