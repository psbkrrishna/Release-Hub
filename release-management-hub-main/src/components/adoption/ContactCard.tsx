import { Copy, Headset, UserCircle } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import { useFeatureStore } from '@/components/FeatureStore';
import type { Customer } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Who to talk to at a company, and who owns it at Zwayam.

   The SPOC comes first because every journey on this page goes through them:
   a CSM asks the SPOC to get an account started, to explain a drop, or to
   introduce a power user for a reference. Copying the email is the one action
   here - the page never sends anything itself.
   --------------------------------------------------------------------------- */

const Person = ({
  icon,
  eyebrow,
  name,
  sub,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  name: string;
  sub: string;
  children?: React.ReactNode;
}) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.x3, flex: '1 1 220px', minWidth: 0 }}>
    <span style={{ display: 'inline-flex', color: T.tx4, marginTop: 2 }}>{icon}</span>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ ...TYPE.eyebrow, fontSize: 10 }}>{eyebrow}</div>
      <div style={{ ...TYPE.cellPrimary, marginTop: 2 }}>{name}</div>
      <div style={{ ...TYPE.helper, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
    {children}
  </div>
);

const ContactCard = ({ customer }: { customer: Customer }) => {
  const { toast } = useFeatureStore();
  const { spoc } = customer;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(spoc.email);
      toast(`Copied ${spoc.email}`);
    } catch {
      toast('Could not copy - select the email and copy it instead', 'warn');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACE.x4,
        padding: SPACE.x3,
        background: T.card,
        border: `1px solid ${T.bd2}`,
        borderRadius: RADIUS.control,
      }}
    >
      <Person icon={<UserCircle size={20} />} eyebrow="Customer SPOC" name={spoc.name} sub={`${spoc.role} · ${spoc.email}`}>
        <Button variant="secondary" compact onClick={copy} style={{ flexShrink: 0 }}>
          <Copy size={14} />Copy email
        </Button>
      </Person>
      <div aria-hidden="true" style={{ width: 1, alignSelf: 'stretch', background: T.bd }} />
      <Person icon={<Headset size={20} />} eyebrow="Zwayam CSM" name={customer.csm} sub="Owns the account" />
    </div>
  );
};

export default ContactCard;
