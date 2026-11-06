import { RADIUS, T, TYPE } from '@/styles/zerra';

/* The segmented switch from the guidelines' view switch: an --su2 track, 3px
   padding, the active segment white with --elev1. Used here with text labels
   rather than icons, for choices a non-technical reader names out loud - "group
   by customers", "show actions". */
const Segmented = <V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  /** Accessible name of the group. */
  label: string;
  value: V;
  options: Array<{ value: V; label: string }>;
  onChange: (value: V) => void;
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    style={{
      display: 'inline-flex',
      flexWrap: 'wrap',
      gap: 2,
      padding: 3,
      background: T.su2,
      border: `1px solid ${T.bd2}`,
      borderRadius: 9,
      maxWidth: '100%',
    }}
  >
    {options.map((o) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.value)}
          style={{
            height: 28,
            padding: '0 12px',
            border: 'none',
            borderRadius: RADIUS.tag,
            background: active ? '#FFFFFF' : 'transparent',
            boxShadow: active ? T.elev1 : 'none',
            color: active ? T.tx : T.tx3,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 120ms ease, color 120ms ease',
            ...TYPE.pill,
            fontSize: 13,
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export default Segmented;
