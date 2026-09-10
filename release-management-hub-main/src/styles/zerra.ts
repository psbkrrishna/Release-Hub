import type { CSSProperties } from 'react';

/* ---------------------------------------------------------------------------
   Zerra v2 - the single source for every value the guidelines specify.

   The app styles from inline styles rather than classes, per the ruleset, so
   this module is what components read instead of a stylesheet. Three things
   live here and nowhere else:

   1. ROOT - the token block, pasted verbatim from the guidelines onto the
      app's root wrapper. Every colour below is reached as var(--token); no
      component carries a raw hex.
   2. TYPE - the typography scale, one entry per role in the guidelines' table.
   3. CONTROL / RADIUS / SPACE - the fixed measurements: 36px controls, 8px
      default radius, and a 4px spacing grid.

   Nothing here is invented. If a value is not in the guidelines it does not
   belong in this file, and if a component needs a value it should be added
   here rather than written inline at the call site.
   --------------------------------------------------------------------------- */

/** The token block. Goes on the root wrapper so every descendant can resolve
 *  var(--…), including the base rules in index.html. */
export const ROOT: CSSProperties = {
  // Surfaces
  '--bg': '#FAFAFA',
  '--card': '#FFFFFF',
  '--pop': '#FFFFFF',
  '--su1': '#FAFAFA',
  '--su2': '#F4F4F5',
  '--su3': '#F7F7F8',
  // Borders
  '--bd': '#ECECEE',
  '--bd2': '#E4E4E7',
  // Text
  '--tx': '#222222',
  '--tx2': '#4E4E4E',
  '--tx3': '#5C5C63',
  '--tx4': '#6C6C75',
  '--tx5': '#82828A',
  // Brand
  '--brand': '#0D59A3',
  '--brand-soft': '#EBF3FB',
  '--brand-solid': '#0D59A3',
  '--brand-solidHover': '#0A4985',
  '--brand-softHover': '#D4E5F4',
  '--brand-border': '#A7C9E8',
  // Accent reserved for anything new
  '--indigo': '#483AFF',
  '--indigo-soft': '#F5F5FF',
  // Status
  '--succ': '#388E3C',
  '--succ-soft': '#ECF5ED',
  '--succ-text': '#2C7330',
  '--succ-border': '#A3D2A6',
  '--dang': '#C81E1F',
  '--dang-soft': '#FCEBEB',
  '--dang-text': '#A41819',
  '--dang-border': '#F0A8A8',
  '--dang-solid': '#C81E1F',
  '--warn': '#D8A715',
  '--warn-soft': '#FFF8E5',
  '--warn-text': '#8A4B00',
  '--warn-border': '#F7DC83',
  '--neutral-strong': '#1C1C1E',
  // Elevation and focus
  '--elev1': '0 1px 2px rgba(16,24,40,0.06)',
  '--elev2': '0 2px 8px rgba(16,24,40,0.08)',
  '--elev3': '0 12px 32px rgba(16,24,40,0.16)',
  '--ring': 'rgba(13,89,163,0.32)',

  fontFamily: "'Source Sans 3', -apple-system, sans-serif",
  background: 'var(--bg)',
  color: 'var(--tx)',
} as CSSProperties;

/** Token references, so a component writes T.tx3 rather than 'var(--tx3)'. */
export const T = {
  bg: 'var(--bg)',
  card: 'var(--card)',
  pop: 'var(--pop)',
  su1: 'var(--su1)',
  su2: 'var(--su2)',
  su3: 'var(--su3)',
  bd: 'var(--bd)',
  bd2: 'var(--bd2)',
  tx: 'var(--tx)',
  tx2: 'var(--tx2)',
  tx3: 'var(--tx3)',
  tx4: 'var(--tx4)',
  tx5: 'var(--tx5)',
  brand: 'var(--brand)',
  brandSoft: 'var(--brand-soft)',
  brandSolid: 'var(--brand-solid)',
  brandSolidHover: 'var(--brand-solidHover)',
  brandSoftHover: 'var(--brand-softHover)',
  brandBorder: 'var(--brand-border)',
  indigo: 'var(--indigo)',
  indigoSoft: 'var(--indigo-soft)',
  succ: 'var(--succ)',
  succSoft: 'var(--succ-soft)',
  succText: 'var(--succ-text)',
  succBorder: 'var(--succ-border)',
  dang: 'var(--dang)',
  dangSoft: 'var(--dang-soft)',
  dangText: 'var(--dang-text)',
  dangBorder: 'var(--dang-border)',
  dangSolid: 'var(--dang-solid)',
  warn: 'var(--warn)',
  warnSoft: 'var(--warn-soft)',
  warnText: 'var(--warn-text)',
  warnBorder: 'var(--warn-border)',
  neutralStrong: 'var(--neutral-strong)',
  elev1: 'var(--elev1)',
  elev2: 'var(--elev2)',
  elev3: 'var(--elev3)',
  ring: 'var(--ring)',
} as const;

/** The typography scale. One entry per role in the guidelines' table - a
 *  component picks a role, it does not pick a font size. */
export const TYPE = {
  pageTitle: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: T.tx },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: T.tx },
  cardTitle: { fontSize: 14, fontWeight: 700, color: T.tx },
  body: { fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: T.tx2 },
  button: { fontSize: 14, fontWeight: 600 },
  input: { fontSize: 14, fontWeight: 400 },
  cellPrimary: { fontSize: 14, fontWeight: 600, color: T.tx },
  cellSecondary: { fontSize: 13, fontWeight: 400, color: T.tx3 },
  helper: { fontSize: 13, fontWeight: 400, lineHeight: 1.4, color: T.tx3 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: T.tx2 },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: T.tx4,
  },
  pill: { fontSize: 12, fontWeight: 600 },
} as const satisfies Record<string, CSSProperties>;

/** Control heights. 36 for anything typed into or pressed, 48 for the icon
 *  rail, 28 for a compact in-row button. */
export const CONTROL = { default: 36, rail: 48, compact: 28 } as const;

/** 8 for controls, cards, inputs, tiles and menus; 6 for a micro-tag; 999 for
 *  a pill; 12 only for a large feature panel. */
export const RADIUS = { control: 8, tag: 6, pill: 999, panel: 12 } as const;

/** The 4px grid, named so a gap cannot be set to an off-grid value. */
export const SPACE = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
} as const;

/** Label-to-input is always 4px; field-to-field 16; section-to-section 24. */
export const GAP = { label: SPACE.x1, field: SPACE.x4, section: SPACE.x6 } as const;

/** The focus treatment inputs share: brand border plus the ring. */
export const FOCUS_RING = `0 0 0 3px ${T.ring}`;

/** Merge style objects, skipping anything falsy - the inline-style equivalent
 *  of conditionally joining class names. */
export const sx = (
  ...parts: Array<CSSProperties | false | null | undefined>
): CSSProperties => Object.assign({}, ...parts.filter(Boolean));
