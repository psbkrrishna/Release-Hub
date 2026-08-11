/* The input/select styling that zerra.css applied through `.fld input`,
   `.search input`, `select.sel`, `.tfoot select` and `.kb-foot input`.

   Exported as strings rather than components because these get spread across
   native <input>/<select>/<textarea> elements that each need their own props,
   and wrapping them in components would only add a layer to unwrap again.

   Production signals focus by darkening the border rather than ringing it, so
   :focus does exactly that; the brand ring is kept for :focus-visible only,
   which is what a keyboard user gets. */

const BASE =
  'w-full rounded-lg border bg-white text-base text-ink-900 outline-none transition-colors ' +
  'border-[#D4D4D8] placeholder:text-[#999] ' +
  'hover:border-[#A1A1AA] focus:border-[#A1A1AA] ' +
  'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand';

const INVALID =
  'w-full rounded-lg border bg-white text-base text-ink-900 outline-none transition-colors ' +
  'border-red-600 placeholder:text-[#999] hover:border-red-600 focus:border-red-600 ' +
  'focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600';

/** Single-line input, 40px tall. */
export const inputCls = (invalid = false) =>
  `${invalid ? INVALID : BASE} h-10 px-3`;

/** Read-only input - flat grey, clearly not editable. */
export const readonlyInputCls = 'h-10 w-full rounded-lg border border-[#D4D4D8] bg-ink-50 px-3 text-base text-ink-600 outline-none';

/** Textarea; taller, resizable vertically only. */
export const textareaCls = (invalid = false) =>
  `${invalid ? INVALID : BASE} min-h-[88px] resize-y p-3 leading-normal`;

/* Native selects need appearance-none plus a background caret, since a
   styled-open dropdown is the one thing plain markup can't do. Inlined as a
   data URI so there is no asset to lose. */
const CARET = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 256 256' fill='%236B6B6B'><path d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32z'/></svg>")`;

export const caretBackground = {
  backgroundImage: CARET,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 12px center',
};

/** A caret in white, for the role picker sitting on the blue top bar. */
export const caretBackgroundLight = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 256 256' fill='white'><path d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32z'/></svg>")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 8px center',
};

/** Select in a form: 40px, 6px radius, room on the right for the caret. */
export const selectCls = (invalid = false) =>
  `${invalid ? INVALID : BASE} h-10 appearance-none rounded-md pl-3 pr-8`;

/** Select in the hub toolbar: same, plus room on the left for a leading icon. */
export const toolbarSelectCls =
  `${BASE} h-10 min-w-[172px] cursor-pointer appearance-none rounded-md pl-10 pr-8`;
