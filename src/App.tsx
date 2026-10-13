/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DirectoryPage } from './components/DirectoryPage';
import { IconDetailPage } from './components/IconDetailPage';
import { EditorPage } from './components/EditorPage';
import { PortfolioPage } from './components/PortfolioPage';
import { AdminAccess } from './components/AdminAccess';
import { AdminDashboard } from './components/AdminDashboard';
import { useAppRouter, navigateTo, formatRouteUrl } from './utils/router';
import { getIconById } from './data/iconDataset';
import { IconCategory } from './types/icon';
import { useI18n } from './i18n';
import { useTheme, ACCENT_PALETTES } from './lib/theme';

export default function App() {
  const [currentRoute] = useAppRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { t, language } = useI18n();
  const { accent, isDark } = useTheme();

  // Synchronize document title and canonical tags per route and language
  useEffect(() => {
    switch (currentRoute.type) {
      case 'admin': {
        document.title = `${t.adminHeading} — VectorHub`;
        break;
      }
      case 'portfolio': {
        document.title = `${t.portfolioBadge} — VectorHub`;
        break;
      }
      case 'detail': {
        const icon = getIconById(currentRoute.id);
        if (icon) {
          document.title = `${icon.name} — VectorHub`;
        } else {
          document.title = `Vector Details — VectorHub`;
        }
        break;
      }
      case 'editor': {
        document.title = `${t.editorHeading} — VectorHub`;
        break;
      }
      case 'directory': {
        const catName =
          currentRoute.category === 'all'
            ? t.allCategories
            : currentRoute.category === 'ui-actions'
            ? t.catUiActions
            : currentRoute.category === 'tech-logos'
            ? t.catTechLogos
            : currentRoute.category === 'system-devices'
            ? t.catSystemDevices
            : currentRoute.category === 'media-controls'
            ? t.catMediaControls
            : t.catScienceMolecules;
        document.title = `${catName} (${t.page} ${currentRoute.page}) — VectorHub`;
        break;
      }
    }

    // Sync canonical link and Open Graph URL with clean path
    const cleanUrl = `${window.location.origin}${formatRouteUrl(currentRoute)}`;
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', cleanUrl);
    }
    const ogUrlMeta = document.querySelector('meta[property="og:url"]');
    if (ogUrlMeta) {
      ogUrlMeta.setAttribute('content', cleanUrl);
    }
  }, [currentRoute, language, t]);

  const handleFooterCategoryClick = (category: IconCategory) => {
    setSearchQuery('');
    navigateTo({ type: 'directory', category, page: 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeAccent = ACCENT_PALETTES[accent];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-[#0a0d14] text-slate-900 dark:text-slate-100 transition-colors relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Apple Liquid Glass Ambient Light Canvas with Dynamic Accent Refraction */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden liquid-mesh-bg" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-30 transition-all duration-700"
          style={{ backgroundColor: activeAccent.hex }}
        />
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-2/3 left-1/3 w-[30rem] h-[30rem] rounded-full bg-sky-500/8 dark:bg-sky-500/12 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-amber-500/8 dark:bg-amber-500/10 blur-3xl" />
      </div>

      {/* Top Bar Header */}
      <Header
        currentRoute={currentRoute}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {currentRoute.type === 'directory' && (
          <DirectoryPage
            activeCategory={currentRoute.category}
            currentPage={currentRoute.page}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentRoute.type === 'portfolio' && <PortfolioPage />}

        {currentRoute.type === 'detail' && (
          <IconDetailPage
            iconId={currentRoute.id}
            iconSlug={currentRoute.slug}
          />
        )}

        {currentRoute.type === 'editor' && (
          <EditorPage initialIconId={currentRoute.iconId} />
        )}

        {currentRoute.type === 'admin' && <AdminAccess><AdminDashboard /></AdminAccess>}
        {currentRoute.type === 'login' && <AdminAccess />}
      </main>

      {/* Footer (Apple Liquid Glass Frosted Container) */}
      <footer className="relative z-10 glass-panel liquid-sheen border-t border-slate-200/90 dark:border-white/10 py-10 transition-colors mt-16 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-[11px] shadow-sm"
                  style={{ backgroundColor: activeAccent.hex }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                  VectorHub
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t.studioTag}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.brandTagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <button
                onClick={() => handleFooterCategoryClick('all')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.allCategories}
              </button>
              <button
                onClick={() => navigateTo({ type: 'portfolio' })}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.navPortfolio}
              </button>
              <button
                onClick={() => handleFooterCategoryClick('ui-actions')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.catUiActions}
              </button>
              <button
                onClick={() => handleFooterCategoryClick('tech-logos')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.catTechLogos}
              </button>
              <button
                onClick={() => handleFooterCategoryClick('science-molecules')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.catScienceMolecules}
              </button>
              <button
                onClick={() => navigateTo({ type: 'editor' })}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t.navStudio}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <p>VectorHub · SVG tools · MIT License.</p>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>50+ SVGs</span>
              <span aria-hidden="true">·</span>
              <span>Font Awesome Pro Ready</span>
              <span aria-hidden="true">·</span>
              <span>0kb Runtime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
