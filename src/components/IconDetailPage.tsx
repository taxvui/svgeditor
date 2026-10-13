import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Code2,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  Image as ImageIcon,
  ShieldAlert,
  Crown,
  Share2,
} from 'lucide-react';
import { SvgIcon } from '../types/icon';
import { getIconById, getRelatedIcons } from '../data/iconDataset';
import {
  formatBytes,
  copyToClipboard,
  downloadSvgFile,
  downloadPngFile,
  getSvgDataUri,
} from '../utils/svgExporter';
import { optimizeSvg } from '../utils/svgOptimizer';
import { normalizeSvgForPreview } from '../utils/svgNormalizer';
import { navigateTo } from '../utils/router';
import { useI18n } from '../i18n';

interface IconDetailPageProps {
  iconId: string;
  iconSlug?: string;
}

type CanvasBg = 'checkerboard' | 'white' | 'dark' | 'midnight';
type CodeTab = 'svg' | 'react' | 'datauri';

const COLOR_PRESETS = [
  { name: 'Default', value: 'currentColor', bgClass: 'bg-neutral-800 dark:bg-white' },
  { name: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500' },
  { name: 'Sky', value: '#0ea5e9', bgClass: 'bg-sky-500' },
  { name: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500' },
  { name: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500' },
  { name: 'Violet', value: '#8b5cf6', bgClass: 'bg-violet-500' },
];

export const IconDetailPage: React.FC<IconDetailPageProps> = ({ iconId, iconSlug }) => {
  const { t } = useI18n();
  const [icon, setIcon] = useState<SvgIcon | null>(() => getIconById(iconId) || null);
  const [loading, setLoading] = useState<boolean>(!icon);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [pngSize, setPngSize] = useState<number>(512);
  const [pngTransparent, setPngTransparent] = useState<boolean>(true);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [canvasBg, setCanvasBg] = useState<CanvasBg>('checkerboard');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeColor, setActiveColor] = useState<string>('currentColor');
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('svg');
  const [quickOptimized, setQuickOptimized] = useState<{
    bytesSaved: number;
    pct: number;
    optBytes: number;
    optSvg: string;
  } | null>(null);

  useEffect(() => {
    const staticIcon = getIconById(iconId);
    if (staticIcon) {
      setIcon(staticIcon);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/svg/${iconId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setIcon({
            id: data.id,
            slug: data.slug,
            name: data.name,
            collection: data.collection?.name || (data.is_pro ? 'Font Awesome Pro' : 'VectorHub Core'),
            categorySlug: (data.category?.slug as any) || 'ui-actions',
            tags: data.tags || [],
            viewBox: data.view_box || '0 0 24 24',
            author: data.collection?.author || (data.is_pro ? 'Fonticons, Inc.' : 'VectorHub'),
            license: data.license?.name || (data.is_pro ? 'Font Awesome Pro License' : 'MIT License'),
            svgContent: data.svg_content,
            rawBytes: data.file_size || 0,
            createdAt: data.created_at || new Date().toISOString(),
            style: data.style || null,
            source: data.source || null,
            is_pro: data.is_pro ?? false,
            content_hash: data.content_hash || null,
            storage_path: data.storage_path || null,
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to load asset from backend API:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [iconId]);

  // Normalize URL to canonical clean path /s/:id/:slug
  useEffect(() => {
    if (icon && icon.slug) {
      const canonicalPath = `/s/${encodeURIComponent(icon.id)}/${encodeURIComponent(icon.slug)}`;
      if (window.location.pathname !== canonicalPath && !window.location.hash) {
        window.history.replaceState({ route: { type: 'detail', id: icon.id, slug: icon.slug } }, '', canonicalPath);
      }
    }
  }, [icon, iconSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 mx-auto border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-medium text-neutral-500">Loading SVG preview...</p>
      </div>
    );
  }

  if (!icon) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center glass-panel liquid-sheen rounded-3xl space-y-4 my-8 shadow-md">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Icon Not Found</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">The icon you requested does not exist or may have been moved.</p>
        <button
          onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
          className="px-4 py-2 text-xs font-medium glass-btn-primary rounded-xl cursor-pointer shadow-sm"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const relatedIcons = getRelatedIcons(icon, 6);

  // Generate React Component string
  const reactComponentName =
    icon.name.replace(/[^a-zA-Z0-9]+/g, '') + 'Icon';
  const reactComponentCode = `import React from 'react';

export const ${reactComponentName}: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  ${icon.svgContent
    .replace('<svg', '<svg {...props}')
    .replace(/class=/g, 'className=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/viewbox=/gi, 'viewBox=')}
);`;

  const handleCopySvg = async () => {
    const success = await copyToClipboard(icon.svgContent);
    if (success) {
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyReact = async () => {
    const success = await copyToClipboard(reactComponentCode);
    if (success) {
      setCopiedType('react');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyDataUri = async (format: 'utf8' | 'base64') => {
    const dataUri = getSvgDataUri(icon.svgContent, format);
    const success = await copyToClipboard(dataUri);
    if (success) {
      setCopiedType(`datauri-${format}`);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyHash = async () => {
    if (icon.content_hash) {
      await copyToClipboard(icon.content_hash);
      setCopiedType('hash');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadSvg = () => {
    downloadSvgFile(icon.svgContent, `${icon.slug}.svg`);
  };

  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      await downloadPngFile(
        icon.svgContent,
        `${icon.slug}-${pngSize}px.png`,
        pngSize,
        pngTransparent ? 'transparent' : canvasBg === 'dark' || canvasBg === 'midnight' ? '#09090b' : '#ffffff'
      );
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCopyLink = async () => {
    if (!icon) return;
    const shareUrl = `${window.location.origin}/s/${encodeURIComponent(icon.id)}/${encodeURIComponent(icon.slug)}`;
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleOpenEditor = () => {
    navigateTo({ type: 'editor', iconId: icon.id });
  };

  const handleQuickOptimize = () => {
    const res = optimizeSvg(icon.svgContent, {
      removeComments: true,
      removeDoctype: true,
      removeMetadata: true,
      collapseGroups: true,
      roundFloats: true,
      floatPrecision: 2,
      minifyWhitespace: true,
      removeEmptyAttrs: true,
    });
    setQuickOptimized({
      bytesSaved: res.bytesSaved,
      pct: res.percentageSaved,
      optBytes: res.optimizedBytes,
      optSvg: res.optimizedCode,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <button
            onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
            className="glass-btn px-2.5 py-1 rounded-xl text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.navDirectory}</span>
          </button>
          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">/</span>
          <button
            onClick={() => navigateTo({ type: 'directory', category: icon.categorySlug, page: 1 })}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {icon.collection}
          </button>
          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-neutral-900 dark:text-white font-semibold">{icon.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Share / Copy Clean URL button */}
          <button
            onClick={handleCopyLink}
            title="Copy clean shareable link to this vector"
            className="glass-btn px-3 py-1 rounded-xl text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {icon.is_pro && (
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl backdrop-blur-md shadow-xs">
              <Crown className="w-3.5 h-3.5" />
              <span>{t.proBadge}</span>
            </span>
          )}
          {icon.style && (
            <span className="px-3 py-1 text-xs font-medium glass-card rounded-xl text-neutral-700 dark:text-neutral-300 capitalize">
              Style: {icon.style}
            </span>
          )}
        </div>
      </div>

      {/* Font Awesome Pro License Warning Box */}
      {icon.is_pro && (
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t.proRestrictedNotice}</span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            {t.proRestrictedDesc}
          </p>
        </div>
      )}

      {/* Main Grid: Preview Stage (Left) & Metadata/Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Stage & Code Inspector */}
        <div className="lg:col-span-7 space-y-6">
          {/* SVG Preview Card (Apple Liquid Glass Stage) */}
          <div className="glass-panel liquid-sheen rounded-3xl overflow-hidden shadow-md">
            {/* Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40">
              {/* Background Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mr-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{t.canvasStage}</span>
                </span>
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40 border border-white/40 dark:border-white/10 text-xs">
                  <button
                    onClick={() => setCanvasBg('checkerboard')}
                    className={`px-2.5 py-0.5 text-xs rounded-lg transition-all cursor-pointer ${
                      canvasBg === 'checkerboard'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {t.canvasGrid.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setCanvasBg('white')}
                    className={`px-2.5 py-0.5 text-xs rounded-lg transition-all cursor-pointer ${
                      canvasBg === 'white'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {t.canvasWhite.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setCanvasBg('dark')}
                    className={`px-2.5 py-0.5 text-xs rounded-lg transition-all cursor-pointer ${
                      canvasBg === 'dark'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {t.canvasDark.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setCanvasBg('midnight')}
                    className={`px-2.5 py-0.5 text-xs rounded-lg transition-all cursor-pointer ${
                      canvasBg === 'midnight'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {t.canvasMidnight.split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40 border border-white/40 dark:border-white/10 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] tabular-nums w-8 text-center text-neutral-600 dark:text-neutral-400">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(400, z + 25))}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Canvas Color Tint Swatch Strip */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-neutral-900/20 text-xs">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{t.tintRefraction}</span>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setActiveColor(color.value)}
                    title={color.name}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer shadow-xs ${color.bgClass} ${
                      activeColor === color.value
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-neutral-900 scale-125'
                        : 'border-white/60 dark:border-white/20 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Canvas Stage Viewport */}
            <div
              className={`relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-8 transition-colors select-none ${
                canvasBg === 'checkerboard'
                  ? 'bg-checkerboard-light dark:bg-checkerboard-dark'
                  : canvasBg === 'white'
                  ? 'bg-white'
                  : canvasBg === 'midnight'
                  ? 'bg-black text-white'
                  : 'bg-[#0f1420] text-white'
              }`}
              data-stage-theme={
                canvasBg === 'white'
                  ? 'light'
                  : canvasBg === 'dark' || canvasBg === 'midnight'
                  ? 'dark'
                  : 'auto'
              }
            >
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center',
                  color: activeColor !== 'currentColor' ? activeColor : undefined,
                }}
                className="transition-transform duration-150 flex items-center justify-center"
              >
                <div
                  className={`w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center transition-all svg-auto-fit ${
                    activeColor === 'currentColor'
                      ? canvasBg === 'white'
                        ? 'text-neutral-950 drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                        : canvasBg === 'dark' || canvasBg === 'midnight'
                        ? 'text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
                        : 'text-neutral-900 dark:text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                      : 'drop-shadow-[0_4px_16px_rgba(16,185,129,0.2)]'
                  }`}
                  dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(icon.svgContent) }}
                />
              </div>

              {/* Viewport Dimensions Badge (Apple Glass Pill) */}
              <div className="absolute bottom-3 right-3 font-mono text-[10px] tabular-nums px-2.5 py-1 rounded-xl glass-panel text-neutral-800 dark:text-white shadow-xs">
                {icon.viewBox}
              </div>
            </div>
          </div>

          {/* Interactive Code Inspector (Apple Liquid Glass Card) */}
          <div className="glass-panel liquid-sheen rounded-3xl overflow-hidden shadow-md">
            {/* Inspector Tab Switcher */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/40 dark:bg-neutral-900/40 border-b border-white/50 dark:border-white/10 text-xs">
              <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40 border border-white/40 dark:border-white/10">
                <button
                  onClick={() => setActiveCodeTab('svg')}
                  className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                    activeCodeTab === 'svg'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  SVG Markup
                </button>
                <button
                  onClick={() => setActiveCodeTab('react')}
                  className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                    activeCodeTab === 'react'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  React Component (JSX)
                </button>
                <button
                  onClick={() => setActiveCodeTab('datauri')}
                  className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                    activeCodeTab === 'datauri'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  Data URI
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeCodeTab === 'svg' && (
                  <button
                    onClick={handleCopySvg}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium glass-btn rounded-xl transition-all cursor-pointer"
                  >
                    {copiedType === 'svg' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied SVG</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
                {activeCodeTab === 'react' && (
                  <button
                    onClick={handleCopyReact}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium glass-btn rounded-xl transition-all cursor-pointer"
                  >
                    {copiedType === 'react' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied React JSX</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Component</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-neutral-950/5 dark:bg-black/40">
              {activeCodeTab === 'svg' && (
                <pre className="text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto max-h-56 leading-relaxed selection:bg-emerald-500/20">
                  <code>{icon.svgContent}</code>
                </pre>
              )}
              {activeCodeTab === 'react' && (
                <pre className="text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto max-h-56 leading-relaxed selection:bg-emerald-500/20">
                  <code>{reactComponentCode}</code>
                </pre>
              )}
              {activeCodeTab === 'datauri' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>UTF-8 Data URI:</span>
                      <button
                        onClick={() => handleCopyDataUri('utf8')}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {copiedType === 'datauri-utf8' ? 'Copied!' : 'Copy UTF-8 URI'}
                      </button>
                    </div>
                    <pre className="p-2.5 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 glass-card rounded-xl overflow-x-auto truncate">
                      <code>{getSvgDataUri(icon.svgContent, 'utf8')}</code>
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Base64 Data URI:</span>
                      <button
                        onClick={() => handleCopyDataUri('base64')}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {copiedType === 'datauri-base64' ? 'Copied!' : 'Copy Base64 URI'}
                      </button>
                    </div>
                    <pre className="p-2.5 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 glass-card rounded-xl overflow-x-auto truncate">
                      <code>{getSvgDataUri(icon.svgContent, 'base64')}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Actions, Exports */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity & Attribution */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {icon.name}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Identifier: <code className="bg-neutral-200/50 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded-md border border-white/40 dark:border-white/10">{icon.slug}</code>
            </p>

            {/* Tags Strip */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {icon.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
                  className="px-2.5 py-1 glass-btn rounded-lg text-[11px] text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleCopySvg}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold glass-btn-primary rounded-2xl cursor-pointer shadow-md transition-all"
            >
              {copiedType === 'svg' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>SVG Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SVG Code</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium glass-btn rounded-xl text-neutral-900 dark:text-white transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </button>

              <button
                onClick={handleOpenEditor}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium glass-btn rounded-xl text-neutral-900 dark:text-white transition-all cursor-pointer shadow-xs"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Open in Studio</span>
              </button>
            </div>
          </div>

          {/* Export PNG Card (Apple Liquid Glass) */}
          <div className="p-5 glass-panel liquid-sheen rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>PNG Rasterizer</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {pngSize}×{pngSize} px
              </span>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-500 dark:text-neutral-400">Resolution preset:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[32, 64, 128, 256, 512, 1024, 2048].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setPngSize(sz)}
                    className={`py-1 text-xs font-mono rounded-xl transition-all cursor-pointer ${
                      pngSize === sz
                        ? 'glass-btn-primary font-bold shadow-xs'
                        : 'glass-btn text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Background Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-neutral-600 dark:text-neutral-400">Transparent Background</span>
              <input
                type="checkbox"
                checked={pngTransparent}
                onChange={(e) => setPngTransparent(e.target.checked)}
                className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold glass-btn rounded-xl text-neutral-900 dark:text-white transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPng ? 'Rendering PNG...' : `Download ${pngSize}×${pngSize} PNG`}</span>
            </button>
          </div>

          {/* Quick SVGO Optimizer Card */}
          <div className="p-5 glass-panel liquid-sheen rounded-3xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick SVGO Optimizer</span>
              </span>
              <button
                onClick={handleQuickOptimize}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Run Analysis
              </button>
            </div>

            {quickOptimized ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-200">
                  <span>Optimized: -{quickOptimized.pct}%</span>
                  <span className="font-mono tabular-nums">{formatBytes(quickOptimized.optBytes)}</span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Saved {quickOptimized.bytesSaved} bytes by removing comments, redundant groups, and minifying floats.
                </div>
                <button
                  onClick={async () => {
                    await copyToClipboard(quickOptimized.optSvg);
                    setCopiedType('opt');
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="mt-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-200 underline cursor-pointer"
                >
                  {copiedType === 'opt' ? 'Copied Optimized SVG!' : 'Copy Optimized SVG'}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Stripping metadata, collapsing empty attributes, and rounding coordinates saves an average of 15–40% in file size.
              </p>
            )}
          </div>

          {/* Metadata Specification Table */}
          <div className="p-5 glass-panel liquid-sheen rounded-3xl space-y-3 text-xs shadow-sm">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-xs">{t.assetSpecifications}</h3>
            <div className="space-y-2 text-neutral-600 dark:text-neutral-400 divide-y divide-white/40 dark:divide-white/10">
              <div className="flex justify-between py-1">
                <span>{t.specCollection}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{icon.collection}</span>
              </div>
              {icon.style && (
                <div className="flex justify-between py-1">
                  <span>{t.specStyle}</span>
                  <span className="font-medium text-neutral-900 dark:text-white capitalize">{icon.style}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span>{t.specViewBox}</span>
                <span className="font-mono text-neutral-900 dark:text-white">{icon.viewBox}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{t.specFileSize}</span>
                <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  {formatBytes(icon.rawBytes)} ({icon.rawBytes} bytes)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>{t.specLicense}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{icon.license}</span>
              </div>
              {icon.content_hash && (
                <div className="flex justify-between py-1 items-center">
                  <span>{t.specDigest}</span>
                  <button
                    onClick={handleCopyHash}
                    title="Click to copy SHA-256"
                    className="font-mono text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>{icon.content_hash.slice(0, 14)}...</span>
                    {copiedType === 'hash' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {icon.storage_path && (
                <div className="flex justify-between py-1 items-center">
                  <span>{t.specLocalPath}</span>
                  <span className="font-mono text-[10px] text-neutral-500 max-w-[150px] truncate" title={icon.storage_path}>
                    {icon.storage_path}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Icons Section (Apple Liquid Glass Cards) */}
      {relatedIcons.length > 0 && (
        <div className="space-y-5 pt-8 border-t border-white/50 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t.relatedVectors} — {icon.collection}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t.relatedVectorsDesc}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedIcons.map((relIcon) => (
              <div
                key={relIcon.id}
                onClick={() => navigateTo({ type: 'detail', id: relIcon.id, slug: relIcon.slug })}
                className="group p-3.5 glass-card glass-card-interactive rounded-2xl cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-white/40 dark:bg-neutral-950/40 border border-slate-200/80 dark:border-white/10 mb-2">
                  <div
                    className="w-full h-full p-2.5 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-transform group-hover:scale-110 svg-auto-fit"
                    dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(relIcon.svgContent) }}
                  />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate" title={relIcon.name}>
                    {relIcon.name}
                  </h4>
                  <div className="text-[10px] text-neutral-500 font-mono tabular-nums">
                    {formatBytes(relIcon.rawBytes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
