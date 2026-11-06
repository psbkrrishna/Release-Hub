import { X } from '@phosphor-icons/react';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import { formatDate } from '@/data/features';
import { SPACE, T, TYPE } from '@/styles/zerra';

/* What every number on the page means, in one line each - for the people
   who will repeat these numbers to a customer and need to say them right. */
const TERMS: Array<[string, string]> = [
  ['Enabled customers', 'Customers who have the feature switched on.'],
  ['Active customers', 'Enabled customers where at least one person used it in the period.'],
  ['Activation', 'Active customers as a share of enabled customers.'],
  ['Monthly active users', 'People who used it at least once in the last 30 days.'],
  ['Daily active users', 'How many people use it on a typical day, averaged over the period.'],
  ['Stickiness', 'Daily active users divided by active users - how much of a habit it is.'],
  ['Power users', "The busiest 10% of each customer's active users, by number of actions; at least one per customer."],
  ['Action', 'One thing done inside a feature, such as "Compared plans".'],
  ['Change', 'Actions this period against the period of the same length just before it.'],
  ['Growing / Declining', 'Up 15% or more, or down 25% or more, on the previous period.'],
  ['Stopped using', 'Used it before, but not in the selected period.'],
  ['Filters', 'Module, feature, customer and action each take several values. No modules, or every module, means the whole platform. A customer counts when any feature in scope applies.'],
  ['Customer funnel', 'All customers, then those who can use it, switched it on, use it, and are reference-ready. Each % is of the step above.'],
  ['Can use it', 'Switched on, or available to switch on. "No access" means neither.'],
  ['Next steps', 'To start, declining, could switch on and reference-ready: table filters listing the companies to contact.'],
  ['SPOC', "The customer's own point of contact. Every next step goes through them, including introductions to power users."],
  ['Reference-ready', 'Usage steady or growing, with 3 or more power users who can vouch for the feature.'],
];

const MetricGlossary = ({ open, onClose, asOf }: { open: boolean; onClose: () => void; asOf: string }) => (
  <Modal open={open} onClose={onClose} labelledBy="glossary-title" align="center" width={560} animate>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACE.x4}px ${SPACE.x5}px`,
        borderBottom: `1px solid ${T.bd2}`,
      }}
    >
      <h2 id="glossary-title" style={{ margin: 0, ...TYPE.sectionTitle }}>About these numbers</h2>
      <IconButton size="compact" onClick={onClose} title="Close" aria-label="Close">
        <X size={16} />
      </IconButton>
    </div>
    <dl style={{ margin: 0, padding: `${SPACE.x2}px ${SPACE.x5}px`, maxHeight: '60vh', overflowY: 'auto' }}>
      {TERMS.map(([term, def]) => (
        <div key={term} style={{ padding: `${SPACE.x2}px 0`, borderBottom: `1px solid ${T.bd}` }}>
          <dt style={{ ...TYPE.cardTitle, fontSize: 13 }}>{term}</dt>
          <dd style={{ margin: `${SPACE.x1}px 0 0`, ...TYPE.helper }}>{def}</dd>
        </div>
      ))}
      <p style={{ margin: `${SPACE.x3}px 0 ${SPACE.x2}px`, ...TYPE.helper, fontSize: 12 }}>
        Data runs to {formatDate(asOf)}. This is demo data, generated to match the Releases table.
      </p>
    </dl>
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: `${SPACE.x3}px ${SPACE.x5}px`,
        borderTop: `1px solid ${T.bd2}`,
      }}
    >
      <Button variant="secondary" onClick={onClose}>Close</Button>
    </div>
  </Modal>
);

export default MetricGlossary;
