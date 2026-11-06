import { useMemo, useState } from 'react';
import { filterOptions } from '@/data/usage/query';
import { breakdownsFor } from '@/hooks/useAdoptionFilters';
import type { AdoptionFilters, Breakdown } from '@/types/Usage';
import { RADIUS, SPACE, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The report header, read as one sentence - the guidelines' Hiring Funnel
   Reports pattern: "Adoption of <the platform | a module | a feature>, by
   <customers | modules | features | actions>". Each underlined phrase is a
   menu. Filters (customer, action, period) live in the bar below it, not
   here: the sentence says what the report is, the bar narrows it.
   --------------------------------------------------------------------------- */

const FONT = "600 16px 'Source Sans 3', -apple-system, sans-serif";
let ctx: CanvasRenderingContext2D | null = null;

/** A native select is as wide as its longest option; this one is sized to
 *  the option showing, so the sentence reads as a sentence. */
const widthOf = (text: string) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * 8;
  ctx.font = FONT;
  return Math.ceil(ctx.measureText(text).width);
};

const caret =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 256 256' fill='%230D59A3'><path d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32z'/></svg>\")";

const Menu = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; group?: string }>;
  onChange: (v: string) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const shown = options.find((o) => o.value === value)?.label ?? '';
  const groups = useMemo(() => {
    const out = new Map<string, typeof options>();
    options.forEach((o) => {
      const g = o.group ?? '';
      out.set(g, [...(out.get(g) ?? []), o]);
    });
    return [...out.entries()];
  }, [options]);

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: Math.min(widthOf(shown) + 24, 420),
        maxWidth: '100%',
        height: 28,
        padding: '0 20px 0 4px',
        margin: '0 2px',
        border: 'none',
        borderBottom: `1px dashed ${T.brandBorder}`,
        borderRadius: RADIUS.tag,
        background: `${focused ? T.brandSoft : 'transparent'} ${caret} no-repeat right 4px center`,
        color: T.brand,
        font: FONT,
        appearance: 'none',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: focused ? `0 0 0 3px ${T.ring}` : 'none',
        textOverflow: 'ellipsis',
        verticalAlign: 'baseline',
      }}
    >
      {groups.map(([g, list]) =>
        g ? (
          <optgroup key={g} label={g}>
            {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ) : (
          list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
        ),
      )}
    </select>
  );
};

const BY_LABEL: Record<Breakdown, string> = {
  customers: 'customers',
  modules: 'modules',
  features: 'features',
  actions: 'actions',
};

const ScopeSentence = ({
  filters,
  by,
  onChange,
}: {
  filters: AdoptionFilters;
  by: Breakdown;
  onChange: (patch: { feature?: string; module?: string; by?: Breakdown }) => void;
}) => {
  const opts = filterOptions({ period: filters.period });
  /* One menu for the level: the platform, a module, or one feature. Values
     carry their kind so the three can share a list. */
  const levels = [
    { value: '', label: 'the platform' },
    ...opts.modules.map((m) => ({ value: `m:${m.value}`, label: `the ${m.label} module`, group: 'Modules' })),
    ...opts.features.map((f) => ({ value: `f:${f.value}`, label: f.label, group: `${f.module} features` })),
  ];
  const level = filters.feature ? `f:${filters.feature}` : filters.module ? `m:${filters.module}` : '';
  const breakdowns = breakdownsFor(filters).map((b) => ({ value: b, label: BY_LABEL[b] }));

  return (
    <p style={{ margin: 0, fontSize: 16, lineHeight: '32px', color: T.tx2, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: SPACE.x1 }}>
      <span>Adoption of</span>
      <Menu
        label="Level"
        value={level}
        options={levels}
        onChange={(v) =>
          onChange(
            v.startsWith('f:') ? { feature: v.slice(2) }
            : v.startsWith('m:') ? { module: v.slice(2), feature: undefined }
            : { feature: undefined, module: undefined },
          )
        }
      />
      <span style={{ marginLeft: -SPACE.x1 }}>, by</span>
      {breakdowns.length > 1 ? (
        <Menu label="Breakdown" value={by} options={breakdowns} onChange={(v) => onChange({ by: v as Breakdown })} />
      ) : (
        <span style={{ fontWeight: 600, color: T.tx }}>{BY_LABEL[by]}</span>
      )}
    </p>
  );
};

export default ScopeSentence;
