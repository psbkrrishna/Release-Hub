import { useNavigate, useParams } from 'react-router-dom';
import { MagnifyingGlass as Search, ArrowRight, Calendar } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import HubCrumb from '@/components/hub/HubCrumb';
import EmptyState from '@/components/primitives/EmptyState';
import { useFeatureStore } from '@/components/FeatureStore';
import { useHubVersion } from '@/components/HubVersionProvider';
import { formatDate, valueOf } from '@/data/features';
import { newsletterById, releaseNoteSlug } from '@/data/knowledge';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One newsletter issue, rendered in full rather than pointed at from a card.
   The short version of what shipped, with each feature it names one click
   from its own detail - and, since both share a month, one click from that
   release's full notes too.
   --------------------------------------------------------------------------- */

const NewsletterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { byId, visibleFeatures } = useFeatureStore();
  const { version } = useHubVersion();

  const newsletter = newsletterById(id);

  if (!newsletter) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That newsletter isn't here"
        action={
          <Button variant="secondary" onClick={() => navigate('/product-hub/knowledge/newsletters')}>
            <ArrowRight size={18} />Back to newsletters
          </Button>
        }
      >
        It may have been renamed, or the link is out of date.
      </EmptyState>
    );
  }

  // A newsletter can name a feature the signed-in role can't open - a draft,
  // or one later pulled from the release - so it is skipped rather than
  // offered as a dead end.
  const items = newsletter.featureIds
    .map((fid) => byId(fid))
    .filter((f): f is NonNullable<typeof f> => Boolean(f) && visibleFeatures.some((v) => v.id === f!.id));

  return (
    <>
      <HubCrumb
        levels={[
          { label: 'Documentation', path: '/product-hub/knowledge' },
          { label: 'Newsletters', path: '/product-hub/knowledge/newsletters' },
          { label: newsletter.title },
        ]}
      />

      <Panel style={{ maxWidth: '70ch' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 24,
            padding: `0 ${SPACE.x2}px`,
            marginBottom: SPACE.x3,
            borderRadius: RADIUS.tag,
            background: T.brandSoft,
            color: T.brand,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {newsletter.month}
        </span>
        {/* In V2 the page header carries this title. */}
        {version !== 'v2' && (
          <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.pageTitle, lineHeight: 1.3 }}>
            {newsletter.title}
          </h2>
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: SPACE.x4,
            color: T.tx4,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Calendar size={13} />Sent {formatDate(newsletter.date)}
        </span>

        <p style={{ margin: `0 0 ${SPACE.x5}px`, maxWidth: '65ch', ...TYPE.body, fontSize: 15 }}>
          {newsletter.summary}
        </p>

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x3 }}>
            {items.map((f) => {
              const value = valueOf(f);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => navigate(`/product-hub/features/${f.id}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    width: '100%',
                    textAlign: 'left',
                    background: T.su1,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: T.bd,
                    borderRadius: RADIUS.control,
                    padding: SPACE.x4,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ ...TYPE.cardTitle, fontSize: 15, color: T.brand }}>{f.title}</span>
                  <span style={{ fontSize: 13, color: T.tx3 }}>
                    {value[0] ?? f.summary?.split('\n')[0] ?? f.productModule}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/product-hub/knowledge/release-notes/${releaseNoteSlug(newsletter.month)}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: SPACE.x5,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: T.brand,
          }}
        >
          Read the full {newsletter.month} release notes <ArrowRight size={14} />
        </button>
      </Panel>
    </>
  );
};

export default NewsletterDetail;
