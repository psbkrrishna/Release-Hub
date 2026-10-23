import { useState } from 'react';
import { ArrowUpRight, FileText, PencilSimple } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import { selectStyle } from '@/components/primitives/fieldStyles';
import ReleaseDetailsModal from '@/components/ReleaseDetailsModal';
import { useFeatureStore } from '@/components/FeatureStore';
import { notesLinkProps, useReleaseNotesTarget } from '@/components/ReleaseStore';
import { RADIUS, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The release-level facts on the Releases tab: the one release notes link and
   the webinar, with the creator's way to edit them.

   With a month selected in the table filter, the strip speaks for that month.
   With "all releases" there is no one release to speak for, so the creator gets
   a release picker (newest first) and edits whichever they choose - the strip
   is always there for them, because a control that only appears after a filter
   is set is a control nobody finds. Other roles only see it when a release has
   something to show.
   --------------------------------------------------------------------------- */

const ReleaseDetailsStrip = ({ month, months }: { month: string; months: string[] }) => {
  const { isCreator } = useFeatureStore();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState('');

  const filtered = month !== 'all';
  const target = filtered ? month : months.includes(picked) ? picked : (months[0] ?? '');

  const notes = useReleaseNotesTarget(target);

  if (!target) return null;
  if (!isCreator && (!filtered || !notes.file)) return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: '10px 16px',
          background: T.card,
          border: `1px solid ${T.bd2}`,
          borderRadius: RADIUS.control,
        }}
      >
        {filtered ? (
          <span style={{ ...TYPE.cardTitle }}>{target} release</span>
        ) : (
          <>
            <label htmlFor="release-details-pick" style={{ ...TYPE.cardTitle }}>
              Release details
            </label>
            <select
              id="release-details-pick"
              aria-label="Release to edit"
              style={{ ...selectStyle(), width: 180 }}
              value={target}
              onChange={(e) => setPicked(e.target.value)}
            >
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>
          </>
        )}

        {notes.file ? (
          <a
            {...notesLinkProps(notes.file)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <FileText size={14} weight="bold" />
            <span style={{ whiteSpace: 'nowrap' }}>Release notes</span>
            <span style={{ fontWeight: 400, color: T.tx3 }}>· {notes.file.name}</span>
            <ArrowUpRight size={13} weight="bold" />
          </a>
        ) : (
          isCreator && (
            <span style={{ fontSize: 13, color: T.tx3 }}>No release notes uploaded yet</span>
          )
        )}

        {isCreator && (
          <span style={{ marginLeft: 'auto' }}>
            <Button variant="secondary" compact onClick={() => setEditing(true)}>
              <PencilSimple size={14} weight="bold" />Edit release details
            </Button>
          </span>
        )}
      </div>

      {isCreator && (
        <ReleaseDetailsModal open={editing} month={target} onClose={() => setEditing(false)} />
      )}
    </>
  );
};

export default ReleaseDetailsStrip;
