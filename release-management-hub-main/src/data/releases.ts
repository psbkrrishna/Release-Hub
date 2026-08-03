import type { Announcement, Release } from '@/types/Feature';

export const releases: Release[] = [
  {
    id: '2026-07',
    name: 'July 2026 Release',
    date: '2026-07-01',
    status: 'Released',
    summary: 'Smarter talent decisions, faster workflows, and a more connected employee experience.',
    featureIds: ['FEAT-001', 'FEAT-002', 'FEAT-004', 'FEAT-011'],
  },
  {
    id: '2026-06',
    name: 'June 2026 Release',
    date: '2026-06-03',
    status: 'Released',
    summary: 'Automation and compliance improvements across payroll, learning, and onboarding.',
    featureIds: ['FEAT-003', 'FEAT-006', 'FEAT-012'],
  },
  {
    id: '2026-05',
    name: 'May 2026 Release',
    date: '2026-05-06',
    status: 'Released',
    summary: 'New ways to understand engagement and support employee wellbeing.',
    featureIds: ['FEAT-007', 'FEAT-008', 'FEAT-009'],
  },
  {
    id: '2026-04',
    name: 'April 2026 Release',
    date: '2026-04-01',
    status: 'Released',
    summary: 'Practical productivity improvements for HR teams and employees.',
    featureIds: ['FEAT-005', 'FEAT-010'],
  },
];

export const announcements: Announcement[] = [
  {
    id: 'release-overview-2026-07',
    releaseId: '2026-07',
    title: 'Your July release is here',
    summary: 'Discover four features designed to help your teams make faster, more informed decisions.',
    audience: ['customer', 'customer-admin'],
    placement: 'login',
    activeFrom: '2026-07-01',
    activeUntil: '2026-12-31',
    priority: 100,
    dismissible: true,
  },
  {
    id: 'dashboard-banner-2026-07',
    releaseId: '2026-07',
    title: 'Four new ways to move work forward',
    summary: 'Explore two new features and two enhancements in the July 2026 release.',
    audience: ['customer', 'customer-admin'],
    placement: 'dashboard',
    activeFrom: '2026-07-01',
    activeUntil: '2026-12-31',
    priority: 90,
    dismissible: true,
  },
  {
    id: 'contextual-performance-ai-2026-07-v2',
    releaseId: '2026-07',
    featureId: 'FEAT-001',
    title: 'New: AI Review Insights',
    summary: 'Turn review responses into clear patterns and practical coaching recommendations.',
    audience: ['customer', 'customer-admin'],
    placement: 'contextual',
    activeFrom: '2026-07-01',
    activeUntil: '2026-12-31',
    priority: 80,
    dismissible: true,
  },
];

export const latestRelease = releases[0];
