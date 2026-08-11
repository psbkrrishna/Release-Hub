/* Replaces the .switch / .knob rules. A real button with role="switch" and
   aria-checked, so it is reachable and operable by keyboard for free - the
   previous markup was already a <button>, this keeps that and adds the ARIA
   the old version was missing. */

interface Props {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Accessible name; also used as the tooltip. */
  label: string;
}

const Switch = ({ checked, onChange, disabled = false, label }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onChange}
    className={[
      'relative h-6 w-10 shrink-0 rounded-full border-none p-0 transition-colors',
      checked ? 'bg-green-600' : 'bg-ink-300',
      disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
    ].join(' ')}
  >
    <span
      className={[
        'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left]',
        'shadow-[0_1px_2px_rgba(16,24,40,.25)]',
        checked ? 'left-[18px]' : 'left-0.5',
      ].join(' ')}
    />
  </button>
);

export default Switch;
