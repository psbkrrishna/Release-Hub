import Badge from '@/components/primitives/Badge';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   A feature's tag: "New Feature" or "Enhancement".

   One component for all three places it renders (the feature table, a module's
   feature list, the feature page) because it was previously written out three
   times, and the copies drifted - two said "New Feature", one said "New". The
   label is the field's own value rather than a mapping, so there is nothing
   left to drift.

   Both values are tinted and neither is the neutral grey. Grey is the colour of
   static configuration in these surfaces (the module chip, the ID chip), and
   Enhancement wearing it made the two halves of one field read as if only one
   of them mattered. New Feature takes the reserved accent, Enhancement brand.
   --------------------------------------------------------------------------- */

const FeatureTag = ({ tag }: { tag: Feature['featureTag'] }) => (
  <Badge variant={tag === 'New Feature' ? 'new' : 'live'}>{tag}</Badge>
);

export default FeatureTag;
