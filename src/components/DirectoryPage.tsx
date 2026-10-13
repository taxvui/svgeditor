import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  Download,
  Code2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  LayoutGrid,
  Grid3X3,
  X,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SvgIcon, IconCategory, SortOption } from '../types/icon';
import { iconDataset, categoriesMeta } from '../data/iconDataset';
import { formatBytes, copyToClipboard, downloadSvgFile } from '../utils/svgExporter';
import { normalizeSvgForPreview } from '../utils/svgNormalizer';
import { navigateTo } from '../utils/router';
import { useI18n } from '../i18n';

interface DirectoryPageProps {
  activeCategory: IconCategory;
  currentPage: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

type CanvasPreviewBg = 'checkerboard' | 'white' | 'dark';
type ViewDensity = 'comfortable' | 'compact';

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  activeCategory,
  currentPage,
  searchQuery,
  onSearchChange,
}) => {
  const { t } = useI18n();
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<string>('all');
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [dbIcons, setDbIcons] = useState<SvgIcon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canvasBg, setCanvasBg] = useState<CanvasPreviewBg>('checkerboard');
  const [viewDensity, setViewDensity] = useState<ViewDensity>('comfortable');
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getCategoryLabel = (slug: string) => {
    switch (slug) {
      case 'all': return t.allCategories;
      case 'ui-actions': return t.catUiActions;
      case 'tech-logos': return t.catTechLogos;
      case 'system-devices': return t.catSystemDevices;
      case 'media-controls': return t.catMediaControls;
      case 'science-molecules': return t.catScienceMolecules;
      default: return slug;
    }
  };

  // Shortcut key '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch styles from API on mount
  useEffect(() => {
    fetch('/api/styles')
      .then((res) => res.json())
      .then((styles) => {
        if (Array.isArray(styles) && styles.length > 0) {
          setAvailableStyles(styles);
        }
      })
      .catch(() => {
        setAvailableStyles(['solid', 'regular', 'light', 'thin', 'duotone', 'brands', 'sharp-solid']);
      });
  }, []);

  // Fetch icons from backend API
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('limit', '250');
    if (activeCategory !== 'all') {
      params.set('category', activeCategory);
    }
    if (activeStyle !== 'all') {
      params.set('style', activeStyle);
    }
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    params.set('sort', sortOption);

    fetch(`/api/svg?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.items && Array.isArray(data.items)) {
          const seen = new Set<string>();
          const uniqueItems = data.items.filter((item: any) => {
            if (!item || !item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });

          const mapped: SvgIcon[] = uniqueItems.map((item: any) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            collection: item.collection?.name || (item.is_pro ? 'Font Awesome Pro' : 'VectorHub Core'),
            categorySlug: (item.category?.slug as any) || 'ui-actions',
            tags: item.tags || [],
            viewBox: item.view_box || '0 0 24 24',
            author: item.collection?.author || (item.is_pro ? 'Fonticons, Inc.' : 'VectorHub'),
            license: item.license?.name || (item.is_pro ? 'Font Awesome Pro License' : 'MIT License'),
            svgContent: item.svg_content,
            rawBytes: item.file_size || 0,
            createdAt: item.created_at || new Date().toISOString(),
            style: item.style || null,
            source: item.source || null,
            is_pro: item.is_pro ?? false,
            content_hash: item.content_hash || null,
            storage_path: item.storage_path || null,
          }));
          setDbIcons(mapped);
        }
      })
      .catch((err) => {
        console.warn('API fetch failed, falling back to static dataset:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, activeStyle, searchQuery, sortOption]);

  // Combine DB icons with iconDataset (deduplicate strictly by id)
  const combinedIcons = useMemo(() => {
    let source: SvgIcon[] = [];
    if (dbIcons.length > 0) {
      source = dbIcons;
    } else {
      let result = [...iconDataset];
      if (activeCategory !== 'all') {
        result = result.filter((icon) => icon.categorySlug === activeCategory);
      }
      if (activeStyle !== 'all') {
        result = result.filter((icon) => (icon.style || 'solid') === activeStyle);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (icon) =>
            icon.name.toLowerCase().includes(q) ||
            icon.slug.toLowerCase().includes(q) ||
            icon.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      source = result;
    }

    const seenIds = new Set<string>();
    return source.filter((icon) => {
      if (!icon || !icon.id || seenIds.has(icon.id)) return false;
      seenIds.add(icon.id);
      return true;
    });
  }, [dbIcons, activeCategory, activeStyle, searchQuery]);

  // Pagination calculation
  const totalItems = combinedIcons.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedIcons = useMemo(() => {
    const startIndex = (validPage - 1) * itemsPerPage;
    return combinedIcons.slice(startIndex, startIndex + itemsPerPage);
  }, [combinedIcons, validPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    navigateTo({
      type: 'directory',
      category: activeCategory,
      page,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (cat: IconCategory) => {
    navigateTo({
      type: 'directory',
      category: cat,
      page: 1,
    });
  };

  const handleCopySvg = async (e: React.MouseEvent, icon: SvgIcon) => {
    e.stopPropagation();
    const success = await copyToClipboard(icon.svgContent);
    if (success) {
      setCopiedId(icon.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleDownload = (e: React.MouseEvent, icon: SvgIcon) => {
    e.stopPropagation();
    downloadSvgFile(icon.svgContent, `${icon.slug}.svg`);
  };

  const handleOpenEditor = (e: React.MouseEvent, icon: SvgIcon) => {
    e.stopPropagation();
    navigateTo({ type: 'editor', iconId: icon.id });
  };

  const handleCardClick = (icon: SvgIcon) => {
    navigateTo({ type: 'detail', id: icon.id, slug: icon.slug });
  };

  // Quick search keywords
  const quickFilters = ['user', 'arrow', 'shield', 'cloud', 'bolt', 'camera', 'device', 'pro'];

  // Smart Pagination Windowing
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 1;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    range.push(1);
    for (let i = validPage - delta; i <= validPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }
    range.push(totalPages);

    let prev: number | null = null;
    for (const page of range) {
      if (typeof page === 'number') {
        if (prev !== null) {
          if (page - prev === 2) {
            rangeWithDots.push(prev + 1);
          } else if (page - prev !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(page);
        prev = page;
      }
    }
    return rangeWithDots;
  }, [totalPages, validPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Directory Hero & Kicker (Apple Liquid Glass Header) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                SVG Library
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.heroKicker}
              </span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              {t.heroHeadline1} <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{t.heroHeadline2}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 max-w-2xl leading-relaxed">
              {t.heroDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => navigateTo({ type: 'portfolio' })}
              className="glass-btn px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-xs text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:scale-102 transition-transform cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.navPortfolio}</span>
            </button>

            <div className="glass-card px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-neutral-700 dark:text-neutral-200 tabular-nums">
                {totalItems} {totalItems === 1 ? 'icon' : 'icons'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar (Apple visionOS Segmented Control) */}
        <div className="glass-panel liquid-sheen p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
          {categoriesMeta.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug as IconCategory)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-semibold border border-white/80 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <span>{getCategoryLabel(cat.slug)}</span>
                <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.2 rounded-md bg-neutral-200/50 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Style Filter Bar */}
        <div className="flex items-center gap-2 pt-0.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 shrink-0 flex items-center gap-1.5 pl-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span>Style:</span>
          </span>
          <button
            onClick={() => setActiveStyle('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeStyle === 'all'
                ? 'glass-btn-primary font-semibold shadow-xs'
                : 'glass-btn text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Styles
          </button>
          {availableStyles.map((style) => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={`capitalize px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeStyle === style
                  ? 'glass-btn-primary font-semibold shadow-xs'
                  : 'glass-btn text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {style.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Prominent Search & Filter Console (Apple Liquid Glass Dock) */}
      <div className="glass-panel liquid-sheen p-5 sm:p-6 rounded-3xl space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Main Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm glass-input rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full cursor-pointer"
                title={t.searchClear}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded-lg border border-white/60 dark:border-white/10 text-neutral-400 bg-white/60 dark:bg-neutral-800/60 shadow-xs">
                /
              </span>
            )}
          </div>

          {/* Controls: Canvas background, Density, Sort */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 w-full md:w-auto shrink-0">
            {/* Canvas Stage Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-white/10 backdrop-blur-md text-xs">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 px-1 font-medium">{t.canvasStage}</span>
              <button
                onClick={() => setCanvasBg('checkerboard')}
                title={t.canvasGrid}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                  canvasBg === 'checkerboard'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/50 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {t.canvasGrid.split(' ')[0]}
              </button>
              <button
                onClick={() => setCanvasBg('white')}
                title={t.canvasWhite}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                  canvasBg === 'white'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/50 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {t.canvasWhite.split(' ')[0]}
              </button>
              <button
                onClick={() => setCanvasBg('dark')}
                title={t.canvasDark}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                  canvasBg === 'dark'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/50 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {t.canvasDark.split(' ')[0]}
              </button>
            </div>

            {/* Density Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-white/10 backdrop-blur-md text-xs">
              <button
                onClick={() => setViewDensity('comfortable')}
                title={t.densityComfortable}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'comfortable'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-white/50 dark:border-white/10'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewDensity('compact')}
                title={t.densityCompact}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'compact'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-white/50 dark:border-white/10'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex-1 sm:flex-initial">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs glass-btn rounded-xl text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="name-asc">{t.sortNameAsc}</option>
                <option value="name-desc">{t.sortNameDesc}</option>
                <option value="size-asc">{t.sortSizeAsc}</option>
                <option value="size-desc">{t.sortSizeDesc}</option>
                <option value="newest">{t.sortNewest}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Tag Bar & Active State Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <span className="text-[11px] font-medium mr-1 text-neutral-400">{t.popularFilters}</span>
            {quickFilters.map((keyword) => (
              <button
                key={keyword}
                onClick={() => onSearchChange(keyword)}
                className="px-2.5 py-1 text-[11px] glass-btn rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                #{keyword}
              </button>
            ))}
          </div>

          {/* Active Result Metadata */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 self-end sm:self-auto font-mono">
            <span>
              {t.showingResults} <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">{paginatedIcons.length}</strong> {t.ofTotal}{' '}
              <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">{totalItems}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.page} <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">{validPage}</strong> {t.ofTotal}{' '}
              <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">{totalPages}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Apple Liquid Glass SVG Cards */}
      {paginatedIcons.length > 0 ? (
        <div
          className={
            viewDensity === 'comfortable'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5'
              : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5'
          }
        >
          {paginatedIcons.map((icon) => {
            const isCopied = copiedId === icon.id;

            return (
              <div
                key={icon.id}
                onClick={() => handleCardClick(icon)}
                className={`group relative flex flex-col justify-between glass-card glass-card-interactive rounded-2xl cursor-pointer ${
                  viewDensity === 'comfortable' ? 'p-4' : 'p-3'
                }`}
              >
                {/* SVG Preview Stage (Frosted pedestal) */}
                <div
                  className={`relative aspect-square flex items-center justify-center rounded-xl overflow-hidden mb-3 transition-colors border border-slate-200/90 dark:border-white/10 ${
                    canvasBg === 'checkerboard'
                      ? 'bg-checkerboard-light dark:bg-checkerboard-dark'
                      : canvasBg === 'white'
                      ? 'bg-white'
                      : 'bg-[#0f1420]'
                  }`}
                  data-stage-theme={canvasBg === 'white' ? 'light' : canvasBg === 'dark' ? 'dark' : 'auto'}
                >
                  <div
                    className={`w-full h-full ${
                      viewDensity === 'comfortable' ? 'p-5 sm:p-6' : 'p-3.5 sm:p-4'
                    } flex items-center justify-center ${
                      canvasBg === 'white'
                        ? 'text-neutral-950'
                        : canvasBg === 'dark'
                        ? 'text-white'
                        : 'text-neutral-900 dark:text-neutral-100'
                    } transition-transform duration-200 group-hover:scale-110 svg-auto-fit`}
                    dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(icon.svgContent) }}
                  />

                  {/* Top-Right Badges: Style & Pro */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
                    {icon.is_pro && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full backdrop-blur-md shadow-xs">
                        <Crown className="w-2.5 h-2.5" />
                        <span>{t.proBadge}</span>
                      </span>
                    )}
                    {icon.style && viewDensity === 'comfortable' && (
                      <span className="px-2 py-0.5 text-[9px] font-medium bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 rounded-full border border-white/60 dark:border-white/10 backdrop-blur-md capitalize">
                        {icon.style}
                      </span>
                    )}
                  </div>

                  {/* Quick Action Overlay on Hover (Apple Liquid Glass Dock) */}
                  <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/75 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-2">
                    <button
                      onClick={(e) => handleCopySvg(e, icon)}
                      title={t.copySvg}
                      className="p-2 bg-white/95 text-neutral-900 hover:bg-white rounded-xl shadow-md transition-transform active:scale-90 cursor-pointer border border-white/50"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, icon)}
                      title={t.downloadSvg}
                      className="p-2 bg-white/95 text-neutral-900 hover:bg-white rounded-xl shadow-md transition-transform active:scale-90 cursor-pointer border border-white/50"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleOpenEditor(e, icon)}
                      title={t.openInStudio}
                      className="p-2 bg-white/95 text-neutral-900 hover:bg-white rounded-xl shadow-md transition-transform active:scale-90 cursor-pointer border border-white/50"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Information */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white truncate" title={icon.name}>
                    {icon.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="truncate">{icon.collection}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums shrink-0">{formatBytes(icon.rawBytes)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Rich Empty State (Apple Liquid Glass Container) */
        <div className="p-12 text-center glass-panel liquid-sheen rounded-3xl space-y-4 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-2xl glass-card flex items-center justify-center text-neutral-400 shadow-sm">
            <Search className="w-7 h-7 text-neutral-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              No vector icons match your criteria
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any vectors matching <strong className="text-neutral-800 dark:text-neutral-200">&quot;{searchQuery}&quot;</strong> in{' '}
              <span className="font-medium">{activeCategory === 'all' ? 'All Categories' : activeCategory}</span>{' '}
              {activeStyle !== 'all' && <span>with style &quot;{activeStyle}&quot;</span>}.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => {
                onSearchChange('');
                setActiveStyle('all');
                handleCategorySelect('all');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium glass-btn-primary rounded-xl cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 text-xs font-medium glass-btn rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Clear Search Query
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls (Apple Liquid Glass Dock) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/50 dark:border-white/10 text-xs">
        {/* Page size selector & status */}
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <span>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value, 10));
              handlePageChange(1);
            }}
            className="px-2.5 py-1 glass-btn rounded-xl text-neutral-900 dark:text-white cursor-pointer focus:outline-none"
          >
            <option value={24}>24</option>
            <option value={48}>48</option>
            <option value={96}>96</option>
          </select>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="tabular-nums font-mono">
            Total {totalItems} items
          </span>
        </div>

        {/* Numbered Pagination Buttons */}
        {totalPages > 1 && (
          <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-xs">
            <button
              onClick={() => handlePageChange(1)}
              disabled={validPage <= 1}
              title="First Page"
              className="p-1.5 rounded-xl glass-btn text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(validPage - 1)}
              disabled={validPage <= 1}
              title="Previous Page"
              className="p-1.5 rounded-xl glass-btn text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {paginationRange.map((item, idx) => {
              if (item === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-neutral-400 select-none">
                    ...
                  </span>
                );
              }
              const pageNum = item as number;
              const isActive = validPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-mono tabular-nums rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'glass-btn-primary font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(validPage + 1)}
              disabled={validPage >= totalPages}
              title="Next Page"
              className="p-1.5 rounded-xl glass-btn text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={validPage >= totalPages}
              title="Last Page"
              className="p-1.5 rounded-xl glass-btn text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
