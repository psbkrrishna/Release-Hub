import { useNavigate, useParams } from 'react-router-dom';
import {
  MagnifyingGlass as Search, ArrowRight, Calendar, RocketLaunch as Rocket,
} from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import FeatureTag from '@/components/hub/FeatureTag';
import HubCrumb from '@/components/hub/HubCrumb';
import { notesLinkProps, useReleaseNotesTarget } from '@/components/ReleaseStore';
import EmptyState from '@/components/primitives/EmptyState';
import { useFeatureStore } from '@/components/FeatureStore';
import { useHubVersion } from '@/components/HubVersionProvider';
import { formatDate, valueOf } from '@/data/features';
import { newsletterByMonth, plural, releaseNoteBySlug, releasePitch } from '@/data/knowledge';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   One release's notes, in full - one document per release, per the Knowledge
   Hub's own rule, rendered here rather than pointed at from a card. Every
   feature that shipped that month appears, not just the ones flagged for
   What's New, so this is the complete record the table view's "feature by
   feature detail" used to promise without actually holding.
   --------------------------------------------------------------------------- */

/** One feature's entry in the document: title, tag, module, what changed, and
 *  what it delivers - the same facts the feature's own page carries, read
 *  here instead of linked away to. */
const NoteEntry = ({ feature, onOpen }: { feature: Feature; onOpen: () => void }) => {
  const value = valueOf(feature);
  const [summary, ...rest] = (feature.summary || '').split('\n');
  const body = feature.description || [summary, rest.join(' ')].filter(Boolean).join(' ');

  return (
    <div style={{ padding: `${SPACE.x4}px 0`, borderBottom: `1px solid ${T.bd}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.x2, marginBottom: SPACE.x2 }}>
        <FeatureTag tag={feature.featureTag} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.tx4 }}>{feature.productModule}</span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          display: 'block',
          margin: `0 0 ${SPACE.x1}px`,
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          ...TYPE.cardTitle,
          fontSize: 16,
        }}
      >
        {feature.title}
      </button>
      {body && (
        <p style={{ margin: `0 0 ${SPACE.x2}px`, maxWidth: '70ch', ...TYPE.body }}>{body}</p>
      )}
      {value.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value.map((b) => (
            <li key={b} style={{ display: 'flex', gap: 8, fontSize: 13, color: T.tx3 }}>
              <span aria-hidden style={{ color: T.brand }}>&bull;</span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ReleaseNoteDetail = () => {
  const { month: slug } = useParams();
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();
  const { version } = useHubVersion();

  const group = releaseNoteBySlug(visibleFeatures, slug);
  const uploaded = useReleaseNotesTarget(group?.month ?? '').file;

  if (!group) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="Those release notes aren't here"
        action={
          <Button variant="secondary" onClick={() => navigate('/product-hub/knowledge/release-notes')}>
            <ArrowRight size={18} />Back to release notes
          </Button>
        }
      >
        The release may not have shipped anything visible to your role, or the link is out of date.
      </EmptyState>
    );
  }

  // New features first, then enhancements - the shape a release note reads in
  // everywhere else in the app, each group alphabetical within itself.
  const ordered = [...group.features].sort((a, b) => {
    const rank = (f: Feature) => (f.featureTag === 'New Feature' ? 0 : 1);
    return rank(a) - rank(b) || a.title.localeCompare(b.title);
  });

  const pitch = releasePitch(group);
  const newsletter = newsletterByMonth(group.month);

  return (
    <>
      <HubCrumb
        levels={[
          { label: 'Documentation', path: '/product-hub/knowledge' },
          { label: 'Release notes', path: '/product-hub/knowledge/release-notes' },
          { label: `${group.month} Release Notes` },
        ]}
      />

      <Panel style={{ maxWidth: '70ch' }}>
        {/* In V2 the page header carries this title. */}
        {version !== 'v2' && (
          <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.pageTitle, lineHeight: 1.3 }}>
            {group.month} Release Notes
          </h2>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x2, marginBottom: SPACE.x4 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 24,
              padding: `0 ${SPACE.x2}px`,
              borderRadius: RADIUS.tag,
              background: T.su2,
              color: T.tx3,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Calendar size={13} />Released {formatDate(group.date)}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 24,
              padding: `0 ${SPACE.x2}px`,
              borderRadius: RADIUS.tag,
              background: T.su2,
              color: T.tx3,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Rocket size={13} />{plural(group.features.length, 'change')}
          </span>
        </div>

        <p style={{ margin: `0 0 ${SPACE.x5}px`, ...TYPE.body }}>{pitch.headline}</p>

        <div>
          {ordered.map((f) => (
            <NoteEntry key={f.id} feature={f} onOpen={() => navigate(`/product-hub/features/${f.id}`)} />
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x5, marginTop: SPACE.x5 }}>
          <button
            type="button"
            onClick={() => navigate(`/product-hub/releases?month=${encodeURIComponent(group.month)}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: T.brand,
            }}
          >
            View in Releases <ArrowRight size={14} />
          </button>

          {uploaded && (
            <a
              {...notesLinkProps(uploaded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: T.brand,
              }}
            >
              Open the release notes document <ArrowRight size={14} />
            </a>
          )}

          {newsletter && (
            <button
              type="button"
              onClick={() => navigate(`/product-hub/knowledge/newsletters/${newsletter.id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: T.brand,
              }}
            >
              Read the {group.month} newsletter <ArrowRight size={14} />
            </button>
          )}
        </div>
      </Panel>
    </>
  );
};

export default ReleaseNoteDetail;
