# Product Hub

Zwayam's Product Hub: releases, feature enablement and product documentation in one place.

## Develop

```bash
npm install
npm run dev     # http://localhost:8080
npm run build
npm run lint
```

## Layout

- `src/pages/hub` - the hub's tabs: Overview, Releases, Documentation.
- `src/components/FeatureStore.tsx` - feature state. `src/components/ReleaseStore.tsx` - release-level details (release notes URL, webinar).
- `src/styles/zerra.ts` - design tokens.
- All hub URLs live under `/product-hub` (`src/lib/routes.ts`); `/release-hub/...` redirects.
