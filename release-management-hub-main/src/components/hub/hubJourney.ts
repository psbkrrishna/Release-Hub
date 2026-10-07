import { docById, moduleBySlug, newsletterById, releaseNoteBySlug } from '@/data/knowledge';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Where a page sits in the Feature Hub, for the V2 header.

   One resolver for every route, so the breadcrumb, the title, the line under
   it and the cross-links cannot drift between pages the way five hand-written
   crumbs could. The trail is location-based: a release note always reads
   Home > Documentation > Release notes > <month>, whichever page you
   arrived from.

   Every page, leaf or section, gets its title and one line here. The leaf
   pages (a feature, a release note, a newsletter, a document) drop their own
   body heading in V2 so the title is not stated twice.
   --------------------------------------------------------------------------- */

const HUB = '/release-hub';

export interface JourneyCrumb {
  label: string;
  path?: string;
}

export interface JourneyCta {
  label: string;
  path: string;
}

export interface Journey {
  crumbs: JourneyCrumb[];
  title?: string;
  subtext?: string;
  ctas: JourneyCta[];
}

const SUBTEXT = {
  overview: 'What shipped in the latest release, and where to find everything else.',
  releases: 'Every feature by release month, with its rollout status.',
  documentation: 'Guides, release notes, newsletters and videos for every product module.',
  releaseNotes: 'What changed in each release, month by month.',
  newsletters: 'The monthly round-up of what shipped.',
  videos: 'Walkthroughs and demos for each module.',
} as const;

const TO_RELEASES: JourneyCta = { label: 'Releases', path: `${HUB}/releases` };
const TO_DOCS: JourneyCta = { label: 'Documentation', path: `${HUB}/knowledge` };

const ROOT = (): JourneyCrumb => ({ label: 'Home', path: `${HUB}/overview` });

const DOCS: JourneyCrumb = { label: 'Documentation', path: `${HUB}/knowledge` };

export const resolveJourney = (pathname: string, visibleFeatures: Feature[]): Journey => {
  const rest = pathname.replace(/\/+$/, '').slice(HUB.length).split('/').filter(Boolean);
  const [area, section, id, , docId] = rest;

  if (area === 'releases') {
    return {
      crumbs: [ROOT(), { label: 'Releases' }],
      title: 'Releases',
      subtext: SUBTEXT.releases,
      ctas: [TO_DOCS],
    };
  }

  if (area === 'features') {
    const feature = visibleFeatures.find((f) => f.id === section);
    return {
      crumbs: [
        ROOT(),
        { label: 'Releases', path: `${HUB}/releases` },
        { label: feature?.title ?? 'Feature' },
      ],
      title: feature?.title,
      subtext: feature ? `${feature.productModule} · ${feature.releaseMonth} release` : undefined,
      ctas: [],
    };
  }

  if (area === 'knowledge') {
    if (!section) {
      return {
        crumbs: [ROOT(), { label: 'Documentation' }],
        title: 'Documentation',
        subtext: SUBTEXT.documentation,
        ctas: [TO_RELEASES],
      };
    }

    if (section === 'release-notes') {
      if (!id) {
        return {
          crumbs: [ROOT(), DOCS, { label: 'Release notes' }],
          title: 'Release notes',
          subtext: SUBTEXT.releaseNotes,
          ctas: [TO_RELEASES],
        };
      }
      const group = releaseNoteBySlug(visibleFeatures, id);
      return {
        crumbs: [
          ROOT(),
          DOCS,
          { label: 'Release notes', path: `${HUB}/knowledge/release-notes` },
          { label: group ? `${group.month} Release Notes` : 'Release notes' },
        ],
        title: group ? `${group.month} Release Notes` : undefined,
        subtext: group ? `Everything that shipped in the ${group.month} release, feature by feature.` : undefined,
        ctas: [],
      };
    }

    if (section === 'newsletters') {
      if (!id) {
        return {
          crumbs: [ROOT(), DOCS, { label: 'Newsletters' }],
          title: 'Newsletters',
          subtext: SUBTEXT.newsletters,
          ctas: [TO_RELEASES],
        };
      }
      const newsletter = newsletterById(id);
      return {
        crumbs: [
          ROOT(),
          DOCS,
          { label: 'Newsletters', path: `${HUB}/knowledge/newsletters` },
          { label: newsletter?.title ?? 'Newsletter' },
        ],
        title: newsletter?.title,
        subtext: newsletter ? `The ${newsletter.month} round-up of what shipped.` : undefined,
        ctas: [],
      };
    }

    if (section === 'videos') {
      return {
        crumbs: [ROOT(), DOCS, { label: 'Video library' }],
        title: 'Video library',
        subtext: SUBTEXT.videos,
        ctas: [TO_RELEASES],
      };
    }

    if (section === 'modules') {
      const module = moduleBySlug(id);
      if (!docId) {
        return {
          crumbs: [ROOT(), DOCS, { label: module?.name ?? 'Module' }],
          title: module?.name ?? 'Module',
          subtext: module?.tagline,
          ctas: [TO_RELEASES],
        };
      }
      const doc = docById(id, docId);
      return {
        crumbs: [
          ROOT(),
          DOCS,
          { label: module?.name ?? 'Module', path: `${HUB}/knowledge/modules/${id}` },
          { label: doc?.title ?? 'Document' },
        ],
        title: doc?.title,
        subtext: doc?.blurb,
        ctas: [],
      };
    }
  }

  return {
    crumbs: [],
    title: 'Feature Hub',
    subtext: SUBTEXT.overview,
    ctas: [TO_RELEASES, TO_DOCS],
  };
};
