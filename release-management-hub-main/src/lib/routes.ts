/** Base path of the Product Hub. Every hub URL lives under it. */
export const HUB = '/product-hub';

/** The base path before the rename. Kept only so old bookmarks and links in
 *  sent newsletters redirect rather than 404. */
export const LEGACY_HUB = '/release-hub';

/** The feature adoption page, under the rail's Analytics entry. */
export const ADOPTION = '/insights/adoption';

/** A link into the adoption page with its filters already set - the same
 *  query string the page itself keeps, so any view can be linked to. */
export const adoptionUrl = (params: Record<string, string | undefined> = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  const s = qs.toString();
  return s ? `${ADOPTION}?${s}` : ADOPTION;
};
