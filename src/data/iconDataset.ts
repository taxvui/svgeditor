import { SvgIcon } from '../types/icon.js';

const calculateBytes = (str: string): number => {
  return new TextEncoder().encode(str).length;
};

const rawIcons: Array<Omit<SvgIcon, 'rawBytes'>> = [
  // ==========================================
  // UI Actions (16 items)
  // ==========================================
  {
    id: '1001',
    slug: 'trophy',
    name: 'Trophy Champion',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['award', 'cup', 'winner', 'achievement', 'prize'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-01',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
  <path d="M4 22h16" />
  <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
  <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z" />
</svg>`,
  },
  {
    id: '1002',
    slug: 'shield-check',
    name: 'Shield Check',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['security', 'verified', 'safe', 'protection', 'guard'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-02',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  <path d="m9 12 2 2 4-4" />
</svg>`,
  },
  {
    id: '1003',
    slug: 'sparkles',
    name: 'Sparkles Dynamic',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['magic', 'star', 'ai', 'quality', 'glow'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-03',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  <path d="M5 3v4" />
  <path d="M19 17v4" />
  <path d="M3 5h4" />
  <path d="M17 19h4" />
</svg>`,
  },
  {
    id: '1004',
    slug: 'compass',
    name: 'Compass Navigation',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['direction', 'explore', 'map', 'travel', 'guide'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-04',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
</svg>`,
  },
  {
    id: '1005',
    slug: 'rocket-launch',
    name: 'Rocket Launch',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['deploy', 'startup', 'speed', 'fast', 'blastoff'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-05',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-4.05 11a22.4 22.4 0 0 1-3.95 2z" />
  <path d="m9 12-4.5 4.5" />
  <path d="m15 6 3 3" />
</svg>`,
  },
  {
    id: '1006',
    slug: 'flame',
    name: 'Flame Trending',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['fire', 'hot', 'trending', 'popular', 'burn'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-06',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
</svg>`,
  },
  {
    id: '1007',
    slug: 'heart-pulse',
    name: 'Heart Pulse',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['favorite', 'like', 'health', 'vital', 'ecg'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-07',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h6.28" />
</svg>`,
  },
  {
    id: '1008',
    slug: 'bookmark-star',
    name: 'Bookmark Star',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['save', 'mark', 'favorite', 'archive', 'read-later'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-08',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  <polygon points="12 7 13.09 9.26 15.5 9.58 13.72 11.23 14.18 13.62 12 12.38 9.82 13.62 10.28 11.23 8.5 9.58 10.91 9.26 12 7" fill="currentColor" fill-opacity="0.2" />
</svg>`,
  },
  {
    id: '1009',
    slug: 'bell-ring',
    name: 'Bell Notification',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['alert', 'alarm', 'ring', 'subscribe', 'ping'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-09',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  <path d="M4 2C2.8 3.7 2 5.7 2 8" />
  <path d="M22 8c0-2.3-.8-4.3-2-6" />
</svg>`,
  },
  {
    id: '1010',
    slug: 'share-network',
    name: 'Share Network',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['nodes', 'social', 'export', 'broadcast', 'distribute'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-10',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="18" cy="5" r="3" />
  <circle cx="6" cy="12" r="3" />
  <circle cx="18" cy="19" r="3" />
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
</svg>`,
  },
  {
    id: '1011',
    slug: 'sliders-filter',
    name: 'Filter Sliders',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['controls', 'tune', 'adjust', 'settings', 'eq'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-11',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" y1="21" x2="4" y2="14" />
  <line x1="4" y1="10" x2="4" y2="3" />
  <line x1="12" y1="21" x2="12" y2="12" />
  <line x1="12" y1="8" x2="12" y2="3" />
  <line x1="20" y1="21" x2="20" y2="16" />
  <line x1="20" y1="12" x2="20" y2="3" />
  <line x1="1" y1="14" x2="7" y2="14" />
  <line x1="9" y1="8" x2="15" y2="8" />
  <line x1="17" y1="16" x2="23" y2="16" />
</svg>`,
  },
  {
    id: '1012',
    slug: 'lock-keyhole',
    name: 'Lock Keyhole',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['security', 'protect', 'private', 'auth', 'secret'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-12',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="16" r="1" />
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</svg>`,
  },
  {
    id: '1013',
    slug: 'cloud-download',
    name: 'Cloud Download',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['fetch', 'save', 'storage', 'data', 'backup'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-13',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
  <path d="M12 12v9" />
  <path d="m8 17 4 4 4-4" />
</svg>`,
  },
  {
    id: '1014',
    slug: 'refresh-loop',
    name: 'Refresh Loop',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['sync', 'reload', 'repeat', 'update', 'recalculate'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-14',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
  <path d="M21 3v5h-5" />
  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  <path d="M3 21v-5h5" />
</svg>`,
  },
  {
    id: '1015',
    slug: 'check-circle',
    name: 'Check Circle',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['success', 'done', 'approved', 'pass', 'valid'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-15',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  <polyline points="22 4 12 14.01 9 11.01" />
</svg>`,
  },
  {
    id: '1016',
    slug: 'help-circle',
    name: 'Help Circle',
    collection: 'UI Actions',
    categorySlug: 'ui-actions',
    tags: ['question', 'faq', 'info', 'support', 'hint'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-03-16',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
  <line x1="12" y1="17" x2="12.01" y2="17" />
</svg>`,
  },

  // ==========================================
  // Tech Logos (14 items)
  // ==========================================
  {
    id: '2001',
    slug: 'react-logo',
    name: 'React Ecosystem',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['react', 'meta', 'frontend', 'components', 'jsx'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-10',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
  <circle cx="12" cy="12" r="2" fill="currentColor" />
</svg>`,
  },
  {
    id: '2002',
    slug: 'typescript-logo',
    name: 'TypeScript Emblem',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['typescript', 'ts', 'microsoft', 'typed', 'javascript'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-11',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="3" />
  <path d="M5 8h6" />
  <path d="M8 8v9" />
  <path d="M19 10c-.5-.7-1.3-1-2.2-1-1.5 0-2.3.9-2.3 2 0 2.2 4.5 1.5 4.5 4.2 0 1.2-.9 2.2-2.5 2.2-1.3 0-2.2-.6-2.7-1.4" />
</svg>`,
  },
  {
    id: '2003',
    slug: 'python-logo',
    name: 'Python Runtime',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['python', 'django', 'ai', 'data-science', 'backend'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-12',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.5 2h-1c-2.5 0-4.5 2-4.5 4.5V9h6V7.5A1.5 1.5 0 0 1 13.5 6H17V4.5C17 3.1 15.9 2 14.5 2h-3z" />
  <circle cx="8.5" cy="5.5" r="0.75" fill="currentColor" />
  <path d="M12.5 22h1c2.5 0 4.5-2 4.5-4.5V15h-6v1.5a1.5 1.5 0 0 1-1.5 1.5H7v1.5C7 20.9 8.1 22 9.5 22h3z" />
  <circle cx="15.5" cy="18.5" r="0.75" fill="currentColor" />
</svg>`,
  },
  {
    id: '2004',
    slug: 'rust-logo',
    name: 'Rust Gear',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['rust', 'cargo', 'wasm', 'systems', 'safe-memory'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-13',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="7" />
  <path d="M12 2v3" />
  <path d="M12 19v3" />
  <path d="M2 12h3" />
  <path d="M19 12h3" />
  <path d="m4.93 4.93 2.12 2.12" />
  <path d="m16.95 16.95 2.12 2.12" />
  <path d="m4.93 19.07 2.12-2.12" />
  <path d="m16.95 7.05 2.12-2.12" />
  <path d="M10 10v4l2.5-2z" fill="currentColor" />
</svg>`,
  },
  {
    id: '2005',
    slug: 'docker-whale',
    name: 'Docker Container',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['docker', 'container', 'whale', 'devops', 'kubernetes'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-14',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 14c1.5 2 4.5 4 10 4 6.5 0 9.5-2.5 10-6.5-1.5 0-3-.5-4-2 0 1.5-2 2-3 2H2z" />
  <rect x="5" y="10" width="2.5" height="2.5" rx="0.5" />
  <rect x="8.5" y="10" width="2.5" height="2.5" rx="0.5" />
  <rect x="12" y="10" width="2.5" height="2.5" rx="0.5" />
  <rect x="8.5" y="6.5" width="2.5" height="2.5" rx="0.5" />
  <rect x="12" y="6.5" width="2.5" height="2.5" rx="0.5" />
</svg>`,
  },
  {
    id: '2006',
    slug: 'kubernetes-helm',
    name: 'Kubernetes Helm',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['k8s', 'kubernetes', 'cloud', 'cluster', 'orchestration'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-15',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2" />
  <circle cx="12" cy="12" r="3" />
  <line x1="12" y1="9" x2="12" y2="2" />
  <line x1="12" y1="15" x2="12" y2="22" />
  <line x1="9.5" y1="13.5" x2="3" y2="17" />
  <line x1="14.5" y1="10.5" x2="21" y2="7" />
  <line x1="9.5" y1="10.5" x2="3" y2="7" />
  <line x1="14.5" y1="13.5" x2="21" y2="17" />
</svg>`,
  },
  {
    id: '2007',
    slug: 'git-branch',
    name: 'Git Branch Node',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['git', 'github', 'commit', 'merge', 'vcs'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-16',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="6" y1="3" x2="6" y2="15" />
  <circle cx="18" cy="6" r="3" />
  <circle cx="6" cy="18" r="3" />
  <path d="M18 9a9 9 0 0 1-9 9" />
</svg>`,
  },
  {
    id: '2008',
    slug: 'nodejs-hex',
    name: 'Node.js Hex',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['node', 'javascript', 'backend', 'v8', 'express'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-17',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12 2 9 5.2v10.4L12 23l-9-5.4V7.2L12 2z" />
  <path d="M8 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
  <path d="M12 12v6" />
</svg>`,
  },
  {
    id: '2009',
    slug: 'graphql-poly',
    name: 'GraphQL Schema',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['graphql', 'api', 'query', 'apollo', 'schema'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-18',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="3" r="2" />
  <circle cx="19.79" cy="7.5" r="2" />
  <circle cx="19.79" cy="16.5" r="2" />
  <circle cx="12" cy="21" r="2" />
  <circle cx="4.21" cy="16.5" r="2" />
  <circle cx="4.21" cy="7.5" r="2" />
  <polygon points="12 5 18.06 8.5 18.06 15.5 12 19 5.94 15.5 5.94 8.5" />
</svg>`,
  },
  {
    id: '2010',
    slug: 'postgresql-db',
    name: 'PostgreSQL Relational',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['postgres', 'sql', 'database', 'rdbms', 'acid'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-19',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2C6.5 2 2 5.5 2 9.5c0 3.2 2.8 6 7 7.1V21l4-2.5v-2c5.5-.3 9-3.2 9-7 0-4-4.5-7.5-10-7.5z" />
  <circle cx="8" cy="9" r="1.5" fill="currentColor" />
  <circle cx="16" cy="9" r="1.5" fill="currentColor" />
</svg>`,
  },
  {
    id: '2011',
    slug: 'vite-bolt',
    name: 'Vite Lightning',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['vite', 'bundler', 'esm', 'fast', 'frontend'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-20',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 3 7 7 21 12 22 17 21 21 7 12 2" />
  <polygon points="13 4 8 13 13 13 11 20 17 11 12 11 13 4" fill="currentColor" fill-opacity="0.15" />
</svg>`,
  },
  {
    id: '2012',
    slug: 'html5-shield',
    name: 'HTML5 Modern Standard',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['html', 'markup', 'w3c', 'semantics', 'web'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-21',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="4 2 20 2 18.5 19 12 22 5.5 19 4 2" />
  <path d="M8 7h8" />
  <path d="M8 11h7l-.5 4.5L12 17l-2.5-1.5" />
</svg>`,
  },
  {
    id: '2013',
    slug: 'css3-shield',
    name: 'CSS3 Stylesheet',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['css', 'styles', 'flexbox', 'grid', 'web'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-22',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="4 2 20 2 18.5 19 12 22 5.5 19 4 2" />
  <path d="M16 7H8v4h7l-.5 4.5L12 17l-2.5-1.5" />
</svg>`,
  },
  {
    id: '2014',
    slug: 'tailwind-waves',
    name: 'Tailwind Waveform',
    collection: 'Tech Logos',
    categorySlug: 'tech-logos',
    tags: ['tailwind', 'css', 'utility', 'classes', 'framework'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-02-23',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 14c1.5-2 3.5-3 6-3s4 1 6 3" />
  <path d="M2 18c2-3 4.5-4.5 8-4.5s5.5 1.5 8 4.5" />
  <path d="M8 10c1.5-2 3-3 5-3s3.5 1 5 3" />
</svg>`,
  },

  // ==========================================
  // System & Devices (12 items)
  // ==========================================
  {
    id: '3001',
    slug: 'terminal-cli',
    name: 'Terminal CLI Prompt',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['terminal', 'bash', 'console', 'cli', 'command'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-10',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 17 10 11 4 5" />
  <line x1="12" y1="19" x2="20" y2="19" />
</svg>`,
  },
  {
    id: '3002',
    slug: 'smartphone-device',
    name: 'Smartphone Touch',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['mobile', 'phone', 'ios', 'android', 'touch'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-11',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
  <line x1="12" y1="18" x2="12.01" y2="18" />
</svg>`,
  },
  {
    id: '3003',
    slug: 'server-rack',
    name: 'Server Rack Cluster',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['server', 'cluster', 'datacenter', 'host', 'infrastructure'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-12',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
  <line x1="6" y1="6" x2="6.01" y2="6" />
  <line x1="6" y1="18" x2="6.01" y2="18" />
  <line x1="10" y1="6" x2="14" y2="6" />
  <line x1="10" y1="18" x2="14" y2="18" />
</svg>`,
  },
  {
    id: '3004',
    slug: 'cpu-chip',
    name: 'CPU Microchip',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['processor', 'hardware', 'silicon', 'core', 'intel'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-13',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <rect x="9" y="9" width="6" height="6" />
  <line x1="9" y1="1" x2="9" y2="4" />
  <line x1="15" y1="1" x2="15" y2="4" />
  <line x1="9" y1="20" x2="9" y2="23" />
  <line x1="15" y1="20" x2="15" y2="23" />
  <line x1="20" y1="9" x2="23" y2="9" />
  <line x1="20" y1="15" x2="23" y2="15" />
  <line x1="1" y1="9" x2="4" y2="9" />
  <line x1="1" y1="15" x2="4" y2="15" />
</svg>`,
  },
  {
    id: '3005',
    slug: 'database-stack',
    name: 'Database Storage Stack',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['storage', 'data', 'tables', 'rdbms', 'nosql'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-14',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="12" cy="5" rx="9" ry="3" />
  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
</svg>`,
  },
  {
    id: '3006',
    slug: 'hard-drive',
    name: 'Hard Drive NVMe',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['ssd', 'disk', 'nvme', 'memory', 'read-write'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-15',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="22" y1="12" x2="2" y2="12" />
  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  <line x1="6" y1="16" x2="6.01" y2="16" />
  <line x1="10" y1="16" x2="10.01" y2="16" />
</svg>`,
  },
  {
    id: '3007',
    slug: 'wifi-signal',
    name: 'WiFi High Broadcast',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['wireless', 'signal', 'internet', 'network', 'router'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-16',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
  <line x1="12" y1="20" x2="12.01" y2="20" />
</svg>`,
  },
  {
    id: '3008',
    slug: 'battery-charging',
    name: 'Battery Fast Charging',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['power', 'energy', 'electric', 'charge', 'capacity'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-17',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
  <path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" />
  <line x1="11" y1="7" x2="8" y2="12" />
  <line x1="8" y1="12" x2="13" y2="12" />
  <line x1="13" y1="12" x2="10" y2="17" />
  <line x1="22" y1="11" x2="22" y2="13" />
</svg>`,
  },
  {
    id: '3009',
    slug: 'monitor-display',
    name: 'Monitor Display 4K',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['screen', 'desktop', 'tv', 'display', 'panel'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-18',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="3" width="20" height="14" rx="2" />
  <line x1="8" y1="21" x2="16" y2="21" />
  <line x1="12" y1="17" x2="12" y2="21" />
</svg>`,
  },
  {
    id: '3010',
    slug: 'camera-lens',
    name: 'Camera Optical Lens',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['photo', 'optics', 'aperture', 'sensor', 'image'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-19',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
  <circle cx="12" cy="13" r="4" />
</svg>`,
  },
  {
    id: '3011',
    slug: 'gamepad-controller',
    name: 'Gamepad Console',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['gaming', 'joystick', 'arcade', 'play', 'controller'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-20',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="6" y1="12" x2="10" y2="12" />
  <line x1="8" y1="10" x2="8" y2="14" />
  <line x1="15" y1="13" x2="15.01" y2="13" />
  <line x1="18" y1="11" x2="18.01" y2="11" />
  <rect x="2" y="6" width="20" height="12" rx="6" />
</svg>`,
  },
  {
    id: '3012',
    slug: 'drone-quadcopter',
    name: 'Drone Autonomous',
    collection: 'System & Devices',
    categorySlug: 'system-devices',
    tags: ['robotics', 'flight', 'camera', 'rotor', 'aerial'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2026-01-21',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="9" width="6" height="6" rx="1" />
  <line x1="9" y1="9" x2="5" y2="5" />
  <line x1="15" y1="9" x2="19" y2="5" />
  <line x1="9" y1="15" x2="5" y2="19" />
  <line x1="15" y1="15" x2="19" y2="19" />
  <circle cx="4" cy="4" r="2" />
  <circle cx="20" cy="4" r="2" />
  <circle cx="4" cy="20" r="2" />
  <circle cx="20" cy="20" r="2" />
</svg>`,
  },

  // ==========================================
  // Media & Controls (10 items)
  // ==========================================
  {
    id: '4001',
    slug: 'play-circle',
    name: 'Play Stream Circle',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['play', 'video', 'stream', 'media', 'movie'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-01',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" fill-opacity="0.2" />
</svg>`,
  },
  {
    id: '4002',
    slug: 'equalizer-waves',
    name: 'Audio Spectrum Wave',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['audio', 'equalizer', 'spectrum', 'levels', 'sound'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-02',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" y1="18" x2="4" y2="6" />
  <line x1="8" y1="21" x2="8" y2="3" />
  <line x1="12" y1="16" x2="12" y2="8" />
  <line x1="16" y1="20" x2="16" y2="4" />
  <line x1="20" y1="15" x2="20" y2="9" />
</svg>`,
  },
  {
    id: '4003',
    slug: 'studio-microphone',
    name: 'Studio Condenser Mic',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['mic', 'podcast', 'recording', 'voice', 'sound'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-03',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
  <line x1="12" y1="19" x2="12" y2="23" />
  <line x1="8" y1="23" x2="16" y2="23" />
</svg>`,
  },
  {
    id: '4004',
    slug: 'dj-headphones',
    name: 'DJ Monitor Headphones',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['audio', 'music', 'listen', 'hifi', 'bass'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-04',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
</svg>`,
  },
  {
    id: '4005',
    slug: 'speaker-volume',
    name: 'Speaker Volume High',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['audio', 'loud', 'volume', 'sound', 'speaker'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-05',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
</svg>`,
  },
  {
    id: '4006',
    slug: 'radio-antenna',
    name: 'Radio Broadcast Tower',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['broadcast', 'radio', 'fm', 'podcast', 'frequency'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-06',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
  <circle cx="12" cy="12" r="2" fill="currentColor" />
  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
  <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
</svg>`,
  },
  {
    id: '4007',
    slug: 'film-reel',
    name: 'Film Cinema Reel',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['cinema', 'movie', 'video', 'hollywood', 'roll'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-07',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="3" />
  <circle cx="7" cy="12" r="1.5" />
  <circle cx="17" cy="12" r="1.5" />
  <circle cx="12" cy="7" r="1.5" />
  <circle cx="12" cy="17" r="1.5" />
</svg>`,
  },
  {
    id: '4008',
    slug: 'vinyl-record',
    name: 'Vinyl Album Record',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['vinyl', 'retro', 'music', 'lp', 'analog'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-08',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</svg>`,
  },
  {
    id: '4009',
    slug: 'music-notes',
    name: 'Dual Music Notes',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['music', 'melody', 'song', 'audio', 'clef'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-09',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 18V5l12-2v13" />
  <circle cx="6" cy="18" r="3" />
  <circle cx="18" cy="16" r="3" />
</svg>`,
  },
  {
    id: '4010',
    slug: 'webcam-lens',
    name: 'Webcam Stream Optic',
    collection: 'Media & Controls',
    categorySlug: 'media-controls',
    tags: ['webcam', 'video', 'call', 'meeting', 'stream'],
    viewBox: '0 0 24 24',
    author: 'VectorHub Open Core',
    license: 'MIT',
    createdAt: '2025-12-10',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="10" r="8" />
  <circle cx="12" cy="10" r="3" fill="currentColor" fill-opacity="0.2" />
  <path d="M7 22h10" />
  <path d="M12 18v4" />
</svg>`,
  },

  // ==========================================
  // Science & Molecules (PubChem / DeepMind Science Skills)
  // ==========================================
  {
    id: '5001',
    slug: 'aspirin-molecule',
    name: 'Aspirin (C9H8O4)',
    collection: 'Science & Molecules',
    categorySlug: 'science-molecules',
    tags: ['science', 'pharma', 'compound', 'drug', 'analgesic'],
    viewBox: '0 0 100 100',
    author: 'PubChem PUG REST / Science Skill',
    license: 'CC0',
    createdAt: '2026-03-01',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" stroke="currentColor" />
  <circle cx="50" cy="50" r="14" stroke="currentColor" stroke-dasharray="2 3" />
  <line x1="76" y1="35" x2="92" y2="25" />
  <line x1="92" y1="25" x2="92" y2="10" />
  <line x1="24" y1="65" x2="10" y2="75" />
  <text x="50" y="53" text-anchor="middle" font-size="8" font-family="monospace" fill="currentColor" stroke="none">C9H8O4</text>
</svg>`,
  },
  {
    id: '5002',
    slug: 'caffeine-purine',
    name: 'Caffeine (C8H10N4O2)',
    collection: 'Science & Molecules',
    categorySlug: 'science-molecules',
    tags: ['science', 'neuro', 'caffeine', 'stimulant', 'purine'],
    viewBox: '0 0 100 100',
    author: 'PubChem PUG REST / Science Skill',
    license: 'CC0',
    createdAt: '2026-03-02',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="40,25 65,25 78,48 65,70 40,70 28,48" stroke="currentColor" />
  <polygon points="65,25 88,38 88,60 65,70" stroke="currentColor" />
  <circle cx="30" cy="48" r="4" fill="currentColor" />
  <circle cx="75" cy="48" r="4" fill="currentColor" />
  <text x="53" y="52" text-anchor="middle" font-size="7" font-family="monospace" fill="currentColor" stroke="none">C8H10N4O2</text>
</svg>`,
  },
  {
    id: '5003',
    slug: 'dna-double-helix',
    name: 'DNA Double Helix',
    collection: 'Science & Molecules',
    categorySlug: 'science-molecules',
    tags: ['dna', 'genomics', 'biology', 'helix', 'nucleotide'],
    viewBox: '0 0 100 100',
    author: 'DeepMind Science Skill',
    license: 'CC0',
    createdAt: '2026-03-03',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M25,15 Q50,35 75,50 Q50,65 25,85" stroke="currentColor" />
  <path d="M75,15 Q50,35 25,50 Q50,65 75,85" stroke="currentColor" />
  <line x1="32" y1="25" x2="68" y2="25" stroke-dasharray="2 2" />
  <line x1="42" y1="40" x2="58" y2="40" />
  <line x1="50" y1="50" x2="50" y2="50" stroke-width="5" />
  <line x1="42" y1="60" x2="58" y2="60" />
  <line x1="32" y1="75" x2="68" y2="75" stroke-dasharray="2 2" />
</svg>`,
  },
  {
    id: '5004',
    slug: 'dopamine-neuro',
    name: 'Dopamine Neurotransmitter',
    collection: 'Science & Molecules',
    categorySlug: 'science-molecules',
    tags: ['neuro', 'science', 'brain', 'dopamine', 'catecholamine'],
    viewBox: '0 0 100 100',
    author: 'PubChem PUG REST / Science Skill',
    license: 'CC0',
    createdAt: '2026-03-04',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="35,30 55,30 65,48 55,65 35,65 25,48" stroke="currentColor" />
  <line x1="65" y1="48" x2="80" y2="48" />
  <line x1="80" y1="48" x2="90" y2="35" />
  <text x="45" y="51" text-anchor="middle" font-size="7" font-family="monospace" fill="currentColor" stroke="none">C8H11NO2</text>
</svg>`,
  },
];

export const iconDataset: SvgIcon[] = rawIcons.map((icon) => ({
  ...icon,
  rawBytes: calculateBytes(icon.svgContent),
}));

export const categoriesMeta = [
  { slug: 'all', name: 'All Icons', count: iconDataset.length },
  { slug: 'ui-actions', name: 'UI Actions', count: iconDataset.filter((i) => i.categorySlug === 'ui-actions').length },
  { slug: 'tech-logos', name: 'Tech Logos', count: iconDataset.filter((i) => i.categorySlug === 'tech-logos').length },
  { slug: 'system-devices', name: 'System & Devices', count: iconDataset.filter((i) => i.categorySlug === 'system-devices').length },
  { slug: 'media-controls', name: 'Media & Controls', count: iconDataset.filter((i) => i.categorySlug === 'media-controls').length },
  { slug: 'science-molecules', name: 'Science & Molecules', count: iconDataset.filter((i) => i.categorySlug === 'science-molecules').length },
] as const;

export function getIconById(id: string): SvgIcon | undefined {
  return iconDataset.find((icon) => icon.id === id);
}

export function getIconBySlug(slug: string): SvgIcon | undefined {
  return iconDataset.find((icon) => icon.slug === slug);
}

export function getRelatedIcons(currentIcon: SvgIcon, limit: number = 6): SvgIcon[] {
  return iconDataset
    .filter((icon) => icon.id !== currentIcon.id)
    .filter((icon) => {
      if (icon.categorySlug === currentIcon.categorySlug) return true;
      return icon.tags.some((tag) => currentIcon.tags.includes(tag));
    })
    .slice(0, limit);
}
