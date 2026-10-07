import { useNavigate, useParams } from 'react-router-dom';
import {
  MagnifyingGlass as Search, ArrowRight, Clock, ArrowLeft,
} from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import HubCrumb from '@/components/hub/HubCrumb';
import { useHubVersion } from '@/components/HubVersionProvider';
import EmptyState from '@/components/primitives/EmptyState';
import { docById, moduleBySlug } from '@/data/knowledge';
import { SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One document, rendered in full rather than pointed at from a card.

   This is the page a document's own "Open" action used to fake with a toast
   naming an external URL nothing actually served. Sharing this page's address
   - or opening it directly - now shows the real thing, on the portal, with
   its own tab strip and left nav still in place around it.
   --------------------------------------------------------------------------- */

const DocumentDetail = () => {
  const { moduleSlug, docId } = useParams();
  const navigate = useNavigate();
  const { version } = useHubVersion();
  const module = moduleBySlug(moduleSlug);
  const doc = docById(moduleSlug, docId);

  if (!module || !doc) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That document isn't here"
        action={
          <Button variant="secondary" onClick={() => navigate('/release-hub/knowledge')}>
            <ArrowRight size={18} />Back to all modules
          </Button>
        }
      >
        It may have been renamed or moved. Every document is listed on its module's page.
      </EmptyState>
    );
  }

  return (
    <>
      <HubCrumb
        levels={[
          { label: 'Documentation', path: '/release-hub/knowledge' },
          { label: module.name, path: `/release-hub/knowledge/modules/${module.slug}` },
          { label: doc.title },
        ]}
      />

      <Panel style={{ maxWidth: '70ch' }}>
        {/* h2: the shell owns the page's h1. Styled as a page title. In V2
            the page header carries it instead. */}
        {version !== 'v2' && (
          <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.pageTitle, lineHeight: 1.3 }}>
            {doc.title}
          </h2>
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: SPACE.x5,
            color: T.tx4,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Clock size={13} />
          {doc.minutes} min read
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x4 }}>
          {doc.content.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} style={{ margin: 0, ...TYPE.body }}>
              {paragraph}
            </p>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/release-hub/knowledge/modules/${module.slug}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: SPACE.x6,
            paddingTop: SPACE.x4,
            width: '100%',
            background: 'none',
            border: 'none',
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: T.bd,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: T.brand,
          }}
        >
          <ArrowLeft size={14} />
          Back to {module.name} documentation
        </button>
      </Panel>
    </>
  );
};

export default DocumentDetail;
