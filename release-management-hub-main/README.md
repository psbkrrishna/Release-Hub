# Release Management Hub

A Zwayam Release Hub prototype: track features across releases, publish drafts, and preview the
experience from four different personas (Customer, Customer Admin, Creator, Implementation Team).

Built to match the real production UI kit and conventions from `zm-manage-new-setting-development`:
JavaScript + JSX (no TypeScript), Tailwind CSS on the production token set, Headless UI as the
primitive layer, `react-icons/pi` (Phosphor) for icons, and AG Grid for the Release Hub table.

## Getting started

```sh
npm install
npm run dev
```

## What technologies are used for this project?

- Vite
- React (JSX, no TypeScript)
- Headless UI
- Tailwind CSS
- AG Grid
- react-icons (Phosphor set)
- sonner (toasts)

## Project structure

- `src/layout` — the app shell (`AppLayout`), matching production's fixed top bar + hover-expanding
  left rail.
- `src/components/ui` — the shared component kit, vendored from the production repo (`Button`,
  `Badge`, `Input`, `Select`, `Switch`, `Sheet`, `AlertDialog`, `DropdownMenu`, `Pagination`, …).
- `src/pages/ReleaseManagement` — the Release Hub list (AG Grid), the Create/Edit Feature side
  panel, and the feature detail page.
- `src/components/FeatureStore.jsx` — the single source of feature state (React Context, not
  Redux — production has the dependency installed but no real usage of it anywhere in its
  codebase, so this follows that precedent rather than introducing a new pattern).
- `src/data/features.js` — the seed dataset and small date/formatting helpers.
