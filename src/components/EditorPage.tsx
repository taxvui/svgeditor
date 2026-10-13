import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Crop,
  AlignCenter,
  Code2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Zap,
  Sliders,
  AlertCircle,
  Upload,
  ArrowLeft,
  Palette,
  Eye,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  FileCode,
  Share2,
} from 'lucide-react';
import { SvgIcon, OptimizerOptions } from '../types/icon';
import { iconDataset, getIconById } from '../data/iconDataset';
import {
  prettifySvg,
  optimizeSvg,
  validateSvg,
  defaultOptimizerOptions,
  getByteLength,
  SvgValidationResult,
  stripEditorArtifacts,
  injectMissingNamespaces,
} from '../utils/svgOptimizer';
import {
  formatBytes,
  copyToClipboard,
  downloadSvgFile,
  downloadRasterFile,
  getSvgDataUri,
  getSvgMetrics,
  applySvgCustomizations,
  generateReactComponent,
  generateReactNativeComponent,
  generateVueComponent,
  generateSvelteComponent,
  generateCssBackground,
  generateHtmlImg,
  SvgMetrics,
  SvgCustomizationOptions,
} from '../utils/svgExporter';
import { normalizeSvgForPreview } from '../utils/svgNormalizer';
import { cropSvg, fitSvgToContent, centerSvg, readViewBox, type SvgBox } from '../utils/svgGeometry';
import { sanitizeSvgClient } from '../utils/svgSanitizer';
import { navigateTo } from '../utils/router';
import { useI18n } from '../i18n';

interface EditorPageProps {
  initialIconId?: string;
}

type CanvasBg = 'checkerboard' | 'white' | 'dark' | 'midnight' | 'grid';
type StudioTab = 'design' | 'code' | 'optimizer' | 'export';
type ExportFormat =
  | 'svg'
  | 'png'
  | 'webp'
  | 'jpeg'
  | 'react'
  | 'react-native'
  | 'vue'
  | 'svelte'
  | 'datauri-utf8'
  | 'datauri-base64'
  | 'css-bg'
  | 'html-img';

const COLOR_SWATCHES = [
  '#000000',
  '#ffffff',
  '#10b981',
  '#059669',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#eab308',
  '#64748b',
];

export const EditorPage: React.FC<EditorPageProps> = ({ initialIconId }) => {
  const { t, language } = useI18n();
  const initialIcon = initialIconId ? getIconById(initialIconId) : iconDataset[0];
  const initialCode = initialIcon ? initialIcon.svgContent : iconDataset[0].svgContent;

  // Base raw SVG code and history
  const [baseSvgCode, setBaseSvgCode] = useState<string>(initialCode);
  const [history, setHistory] = useState<string[]>([initialCode]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('design');
  const [selectedIconId, setSelectedIconId] = useState<string>(initialIcon?.id || '1001');

  // Canvas Stage controls
  const [canvasBg, setCanvasBg] = useState<CanvasBg>('checkerboard');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Visual Design & Transformation Options (svgviewer.dev style)
  const [fillColor, setFillColor] = useState<string>('original');
  const [strokeColor, setStrokeColor] = useState<string>('original');
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const [padding, setPadding] = useState<number>(0);
  const [colorReplacements, setColorReplacements] = useState<Record<string, string>>({});

  const [geometryBusy, setGeometryBusy] = useState(false);
  const [geometryError, setGeometryError] = useState('');
  const [cropBox, setCropBox] = useState<SvgBox>({ x: 0, y: 0, width: 24, height: 24 });
  const [cropPadding, setCropPadding] = useState(0);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<ExportFormat>('svg');
  const [rasterSize, setRasterSize] = useState<number>(512);
  const [rasterQuality, setRasterQuality] = useState<number>(0.92);
  const [transparentBg, setTransparentBg] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [topExportMenuOpen, setTopExportMenuOpen] = useState<boolean>(false);

  // Optimizer Options
  const [optimizerOptions, setOptimizerOptions] = useState<OptimizerOptions>(defaultOptimizerOptions);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load requested icon
  useEffect(() => {
    if (initialIconId) {
      const staticIcon = getIconById(initialIconId);
      if (staticIcon) {
        setBaseSvgCode(staticIcon.svgContent);
        setHistory([staticIcon.svgContent]);
        setHistoryIndex(0);
        setSelectedIconId(staticIcon.id);
        resetDesignControls();
      } else {
        fetch(`/api/svg/${initialIconId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.svg_content) {
              setBaseSvgCode(data.svg_content);
              setHistory([data.svg_content]);
              setHistoryIndex(0);
              setSelectedIconId(data.id);
              resetDesignControls();
            }
          })
          .catch((err) => {
            console.warn('Could not fetch icon for editor:', err);
          });
      }
    }
  }, [initialIconId]);

  const resetDesignControls = () => {
    setFillColor('original');
    setStrokeColor('original');
    setStrokeWidth(0);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setPadding(0);
    setColorReplacements({});
  };

  // Base validation of the raw XML code
  const validation: SvgValidationResult = useMemo(() => {
    return validateSvg(baseSvgCode);
  }, [baseSvgCode]);

  // Derived customized SVG according to visual transformations
  const customizedSvg = useMemo(() => {
    const rawToTransform = validation.isValid
      ? baseSvgCode
      : validation.missingPrefix
      ? stripEditorArtifacts(baseSvgCode)
      : baseSvgCode;

    const customOptions: SvgCustomizationOptions = {
      fillColor: fillColor !== 'original' ? fillColor : undefined,
      strokeColor: strokeColor !== 'original' ? strokeColor : undefined,
      strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
      rotation: rotation !== 0 ? rotation : undefined,
      flipX,
      flipY,
      padding: padding > 0 ? padding : undefined,
      colorReplacements: Object.keys(colorReplacements).length > 0 ? colorReplacements : undefined,
    };

    return applySvgCustomizations(rawToTransform, customOptions);
  }, [baseSvgCode, validation, fillColor, strokeColor, strokeWidth, rotation, flipX, flipY, padding, colorReplacements]);

  useEffect(() => {
    try { setCropBox(readViewBox(customizedSvg)); } catch { /* Invalid code is reported by validation. */ }
  }, [customizedSvg]);

  const applyGeometry = async (operation: 'crop' | 'fit' | 'center') => {
    setGeometryBusy(true); setGeometryError('');
    try {
      const source = sanitizeSvgClient(customizedSvg).cleanSvg;
      const next = operation === 'crop' ? cropSvg(source, cropBox) : operation === 'fit' ? await fitSvgToContent(source, cropPadding) : await centerSvg(source);
      const previous = history.slice(0, historyIndex + 1);
      if (previous[previous.length - 1] !== customizedSvg) previous.push(customizedSvg);
      previous.push(next);
      setHistory(previous); setHistoryIndex(previous.length - 1); setBaseSvgCode(next);
      resetDesignControls();
    } catch { setGeometryError(t.geometryError); }
    finally { setGeometryBusy(false); }
  };

  // Inspect metrics of customized SVG
  const metrics: SvgMetrics = useMemo(() => {
    return getSvgMetrics(customizedSvg);
  }, [customizedSvg]);

  // Optimizer metrics
  const optimizationResult = useMemo(() => {
    return optimizeSvg(customizedSvg, optimizerOptions);
  }, [customizedSvg, optimizerOptions]);

  // History updater
  const updateCodeWithHistory = (newCode: string) => {
    if (newCode === baseSvgCode) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setBaseSvgCode(newCode);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBaseSvgCode(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBaseSvgCode(history[historyIndex + 1]);
    }
  };

  // Global keyboard shortcuts (Ctrl+Z / Cmd+Z: Undo, Ctrl+Y / Cmd+Shift+Z: Redo, Escape: close dropdowns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        setTopExportMenuOpen(false);
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleReset = () => {
    const original = history[0];
    updateCodeWithHistory(original);
    resetDesignControls();
  };

  const handlePrettify = () => {
    const formatted = prettifySvg(baseSvgCode);
    updateCodeWithHistory(formatted);
  };

  const handleApplyOptimization = () => {
    if (optimizationResult.optimizedCode && optimizationResult.bytesSaved > 0) {
      updateCodeWithHistory(optimizationResult.optimizedCode);
      resetDesignControls();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Please select an SVG file (.svg)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { cleanSvg, sanitizedItems } = sanitizeSvgClient(content);
        if (sanitizedItems.length > 0) {
          console.warn('SVG Security Sanitizer neutralized potentially unsafe tags:', sanitizedItems);
        }
        updateCodeWithHistory(cleanSvg);
        resetDesignControls();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  const handleShareLink = async () => {
    const url = selectedIconId
      ? `${window.location.origin}/editor?id=${encodeURIComponent(selectedIconId)}`
      : `${window.location.origin}/editor`;
    await copyToClipboard(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2200);
  };

  const handleSelectIcon = (iconId: string) => {
    setSelectedIconId(iconId);
    const found = iconDataset.find((i) => i.id === iconId);
    if (found) {
      updateCodeWithHistory(found.svgContent);
      resetDesignControls();
      // Keep URL clean: /editor?id=:iconId
      const targetUrl = `/editor?id=${encodeURIComponent(iconId)}`;
      if (window.location.pathname + window.location.search !== targetUrl && !window.location.hash) {
        window.history.replaceState({ route: { type: 'editor', iconId } }, '', targetUrl);
      }
    }
  };

  const handleCopyText = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Execute export based on exportFormat
  const handleExecuteExport = async () => {
    setIsExporting(true);
    const filename = `vectorhub-export-${selectedIconId}`;
    try {
      if (exportFormat === 'svg') {
        downloadSvgFile(customizedSvg, `${filename}.svg`);
      } else if (exportFormat === 'png') {
        await downloadRasterFile(
          customizedSvg,
          filename,
          'png',
          rasterSize,
          1.0,
          transparentBg ? 'transparent' : '#ffffff'
        );
      } else if (exportFormat === 'webp') {
        await downloadRasterFile(
          customizedSvg,
          filename,
          'webp',
          rasterSize,
          rasterQuality,
          transparentBg ? 'transparent' : '#ffffff'
        );
      } else if (exportFormat === 'jpeg') {
        await downloadRasterFile(
          customizedSvg,
          filename,
          'jpeg',
          rasterSize,
          rasterQuality,
          '#ffffff'
        );
      }
    } catch (err) {
      console.error('Export execution failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generated code for current export selection
  const generatedCodePreview = useMemo(() => {
    switch (exportFormat) {
      case 'svg':
        return customizedSvg;
      case 'react':
        return generateReactComponent(customizedSvg, 'ExportedSvgIcon', true);
      case 'react-native':
        return generateReactNativeComponent(customizedSvg, 'ExportedSvgIcon');
      case 'vue':
        return generateVueComponent(customizedSvg);
      case 'svelte':
        return generateSvelteComponent(customizedSvg);
      case 'datauri-utf8':
        return getSvgDataUri(customizedSvg, 'utf8');
      case 'datauri-base64':
        return getSvgDataUri(customizedSvg, 'base64');
      case 'css-bg':
        return generateCssBackground(customizedSvg);
      case 'html-img':
        return generateHtmlImg(customizedSvg);
      default:
        return customizedSvg;
    }
  }, [exportFormat, customizedSvg]);

  const lines = baseSvgCode.split('\n');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Studio Header (Apple Liquid Glass Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
            className="p-2 glass-btn rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer"
            title="Return to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {t.editorHeading}
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                SVG Editor
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t.editorSubheading}
            </p>
          </div>
        </div>

        {/* Global Toolbar: Library preset loader, File Upload, Fast download */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".svg,image/svg+xml"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-btn rounded-xl transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span>{language === 'vi' ? 'Mở tệp SVG' : 'Upload SVG'}</span>
          </button>

          <select
            value={selectedIconId}
            onChange={(e) => handleSelectIcon(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium glass-btn rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
          >
            <option value="" disabled>Load from library...</option>
            {iconDataset.map((icon) => (
              <option key={icon.id} value={icon.id}>
                {icon.name} ({icon.collection})
              </option>
            ))}
          </select>

          {/* Share clean link */}
          <button
            onClick={handleShareLink}
            title="Copy clean shareable link to this editor document"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-btn rounded-xl transition-all cursor-pointer"
          >
            {copiedShareLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {/* Multi-Format Export Dropdown (SVG, PNG, WebP, JPEG, React, Vue, Svelte, Base64) */}
          <div className="relative">
            <div className="flex items-center rounded-xl overflow-hidden shadow-md">
              <button
                onClick={() => downloadSvgFile(customizedSvg, `vectorhub-${selectedIconId}.svg`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold glass-btn-primary cursor-pointer border-r border-white/20"
                title="Download SVG directly"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-500" />
                <span>{t.downloadSvg}</span>
              </button>
              <button
                onClick={() => setTopExportMenuOpen(!topExportMenuOpen)}
                className="px-2 py-1.5 text-xs font-semibold glass-btn-primary cursor-pointer hover:bg-white/20"
                title="Choose more formats (PNG, WebP, JPEG, React, Vue, Data URI...)"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${topExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {topExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-slate-200/90 dark:border-white/10 z-50 space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-white/10">
                  Quick Export Formats
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      downloadSvgFile(customizedSvg, `vectorhub-${selectedIconId}.svg`);
                      setTopExportMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-emerald-500" />
                    <span>SVG (.svg)</span>
                  </button>

                  <button
                    onClick={async () => {
                      setTopExportMenuOpen(false);
                      await downloadRasterFile(customizedSvg, `vectorhub-${selectedIconId}`, 'png', rasterSize, 1.0, transparentBg ? 'transparent' : '#ffffff');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-sky-500" />
                    <span>PNG ({rasterSize}px)</span>
                  </button>

                  <button
                    onClick={async () => {
                      setTopExportMenuOpen(false);
                      await downloadRasterFile(customizedSvg, `vectorhub-${selectedIconId}`, 'webp', rasterSize, rasterQuality, transparentBg ? 'transparent' : '#ffffff');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-indigo-500" />
                    <span>WebP Image</span>
                  </button>

                  <button
                    onClick={async () => {
                      setTopExportMenuOpen(false);
                      await downloadRasterFile(customizedSvg, `vectorhub-${selectedIconId}`, 'jpeg', rasterSize, rasterQuality, '#ffffff');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-amber-500" />
                    <span>JPEG Image</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-white/10 space-y-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Copy Code Snippets
                  </div>
                  <button
                    onClick={() => {
                      handleCopyText(customizedSvg, 'quick-svg-code');
                      setTopExportMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-neutral-400" />
                      <span>Raw SVG Code</span>
                    </span>
                    <Copy className="w-3 h-3 opacity-60" />
                  </button>

                  <button
                    onClick={() => {
                      handleCopyText(generateReactComponent(customizedSvg, 'CustomVectorIcon'), 'quick-react-code');
                      setTopExportMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3 h-3 text-sky-400" />
                      <span>React JSX Component</span>
                    </span>
                    <Copy className="w-3 h-3 opacity-60" />
                  </button>

                  <button
                    onClick={() => {
                      handleCopyText(getSvgDataUri(customizedSvg, 'base64'), 'quick-base64');
                      setTopExportMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Data URI Base64</span>
                    </span>
                    <Copy className="w-3 h-3 opacity-60" />
                  </button>
                </div>

                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setActiveTab('export');
                      setTopExportMenuOpen(false);
                    }}
                    className="w-full py-1.5 px-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Open Full Converter Studio →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Visual & Preview) vs Right Workstation (Design, Code, Optimizer, Export) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Interactive Canvas & Live Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel liquid-sheen rounded-3xl overflow-hidden shadow-md">
            {/* Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/40 dark:bg-neutral-900/40 border-b border-white/50 dark:border-white/10 text-xs">
              {/* Background Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Stage:</span>
                <button
                  onClick={() => setCanvasBg('checkerboard')}
                  className={`w-5 h-5 rounded-lg border transition-all cursor-pointer ${
                    canvasBg === 'checkerboard' ? 'ring-2 ring-emerald-500 border-white scale-110' : 'border-white/40'
                  } bg-checkerboard-light dark:bg-checkerboard-dark shadow-xs`}
                  title="Checkerboard"
                />
                <button
                  onClick={() => setCanvasBg('white')}
                  className={`w-5 h-5 rounded-lg border transition-all cursor-pointer bg-white ${
                    canvasBg === 'white' ? 'ring-2 ring-emerald-500 border-white scale-110' : 'border-white/40'
                  } shadow-xs`}
                  title="Pure White"
                />
                <button
                  onClick={() => setCanvasBg('dark')}
                  className={`w-5 h-5 rounded-lg border transition-all cursor-pointer bg-[#0f1420] ${
                    canvasBg === 'dark' ? 'ring-2 ring-emerald-500 border-white scale-110' : 'border-white/40'
                  } shadow-xs`}
                  title="Dark Neutral"
                />
                <button
                  onClick={() => setCanvasBg('midnight')}
                  className={`w-5 h-5 rounded-lg border transition-all cursor-pointer bg-black ${
                    canvasBg === 'midnight' ? 'ring-2 ring-emerald-500 border-white scale-110' : 'border-white/40'
                  } shadow-xs`}
                  title="Pitch Black"
                />
                <button
                  onClick={() => setCanvasBg('grid')}
                  className={`w-5 h-5 rounded-lg border transition-all cursor-pointer bg-grid-subtle ${
                    canvasBg === 'grid' ? 'ring-2 ring-emerald-500 border-white scale-110' : 'border-white/40'
                  } shadow-xs`}
                  title="Subtle Grid"
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 border border-white/40 dark:border-white/10">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] tabular-nums w-8 text-center text-neutral-600 dark:text-neutral-400">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(400, z + 25))}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Stage Viewport */}
            <div
              className={`relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center p-8 overflow-hidden transition-colors ${
                canvasBg === 'checkerboard'
                  ? 'bg-checkerboard-light dark:bg-checkerboard-dark'
                  : canvasBg === 'white'
                  ? 'bg-white'
                  : canvasBg === 'midnight'
                  ? 'bg-black text-white'
                  : canvasBg === 'dark'
                  ? 'bg-[#0f1420] text-white'
                  : 'bg-white dark:bg-neutral-900 bg-grid-subtle'
              }`}
              data-stage-theme={
                canvasBg === 'white'
                  ? 'light'
                  : canvasBg === 'dark' || canvasBg === 'midnight'
                  ? 'dark'
                  : 'auto'
              }
            >
              {customizedSvg ? (
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center',
                    padding: `${padding}px`,
                  }}
                  className="transition-transform duration-100 flex items-center justify-center max-w-full max-h-full"
                >
                  <div
                    className={`w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center transition-all svg-auto-fit ${
                      canvasBg === 'dark' || canvasBg === 'midnight'
                        ? 'text-white drop-shadow-[0_6px_20px_rgba(255,255,255,0.14)]'
                        : canvasBg === 'white'
                        ? 'text-neutral-950 drop-shadow-[0_6px_20px_rgba(0,0,0,0.12)]'
                        : 'text-neutral-900 dark:text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.12)]'
                    }`}
                    dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(customizedSvg) }}
                  />
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 max-w-xs">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Invalid SVG Markup
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {validation.errorMessage || 'Fix XML markup syntax to restore live preview.'}
                  </p>
                </div>
              )}

              {/* Viewport Dimensions Badge */}
              <div className="absolute bottom-3 right-3 font-mono text-[10px] tabular-nums px-2.5 py-1 rounded-xl glass-panel text-neutral-800 dark:text-white shadow-xs">
                {metrics.viewBox}
              </div>
            </div>
          </div>

          {/* Quick Stats & Inspection Pill Strip */}
          <div className="p-3.5 glass-panel rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
              <span>
                Size: <strong className="text-neutral-900 dark:text-white tabular-nums">{formatBytes(metrics.rawBytes)}</strong>
              </span>
              <span>·</span>
              <span>
                Paths: <strong className="text-neutral-900 dark:text-white tabular-nums">{metrics.pathCount}</strong>
              </span>
              <span>·</span>
              <span>
                Elements: <strong className="text-neutral-900 dark:text-white tabular-nums">{metrics.elementCount}</strong>
              </span>
            </div>
            <button
              onClick={() => handleCopyText(customizedSvg, 'quick-svg')}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              {copiedKey === 'quick-svg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'quick-svg' ? 'Copied!' : 'Copy Raw SVG'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Unified 4-Mode Workstation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Studio Tab Switcher (VisionOS Segmented Control) */}
          <div className="flex items-center justify-between border-b border-white/50 dark:border-white/10 pb-3">
            <div className="flex items-center gap-1 p-1 rounded-2xl glass-panel shadow-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('design')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'design'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.tabDesign}</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-sky-500" />
                <span>{t.tabCode}</span>
              </button>
              <button
                onClick={() => setActiveTab('optimizer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'optimizer'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.tabOptimizer}</span>
                {optimizationResult.percentageSaved > 0 && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums px-1 rounded bg-emerald-500/10">
                    -{optimizationResult.percentageSaved}%
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/60 dark:border-white/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.tabExport}</span>
              </button>
            </div>

            {/* Quick Reset Button */}
            <button
              onClick={handleReset}
              title="Reset all edits to original"
              className="p-1.5 glass-btn rounded-xl transition-all cursor-pointer text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: VISUAL DESIGNER (svgviewer.dev interactive suite)  */}
          {/* ======================================================== */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 glass-panel rounded-3xl space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Crop className="w-4 h-4" />{t.cropHeading}</h3>
                <p className="text-xs text-neutral-500">{t.cropDescription}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['x', 'y', 'width', 'height'] as const).map(key => <label key={key} className="text-xs">{key === 'width' ? t.cropWidth : key === 'height' ? t.cropHeight : key.toUpperCase()}<input type="number" step="any" value={cropBox[key]} className="glass-input rounded-lg p-2 w-full mt-1" onChange={event => setCropBox(box => ({ ...box, [key]: Number(event.target.value) }))} /></label>)}
                </div>
                <button disabled={geometryBusy || !validation.isValid} onClick={() => void applyGeometry('crop')} className="glass-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50 w-full">{t.cropApply}</button>
                <label className="block text-xs">{t.cropMargin}<input type="number" min="0" step="any" value={cropPadding} className="glass-input rounded-lg p-2 w-full mt-1" onChange={event => setCropPadding(Math.max(0, Number(event.target.value)))} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={geometryBusy || !validation.isValid} onClick={() => void applyGeometry('fit')} className="glass-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">{t.cropFit}</button>
                  <button disabled={geometryBusy || !validation.isValid} onClick={() => void applyGeometry('center')} className="glass-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1"><AlignCenter className="w-4 h-4" />{t.centerObject}</button>
                </div>
                {geometryError && <p role="alert" className="text-xs text-red-600">{geometryError}</p>}
              </div>
              {/* Orientation & Transformation Card */}
              <div className="p-4 sm:p-5 glass-panel liquid-sheen rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.controlRotate}</span>
                  </h3>
                  <button
                    onClick={() => {
                      setRotation(0);
                      setFlipX(false);
                      setFlipY(false);
                    }}
                    className="text-[11px] text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="p-2 text-xs glass-btn rounded-xl flex items-center justify-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>-90°</span>
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 text-xs glass-btn rounded-xl flex items-center justify-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>+90°</span>
                  </button>
                  <button
                    onClick={() => setFlipX((prev) => !prev)}
                    className={`p-2 text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer font-medium transition-all ${
                      flipX ? 'glass-btn-primary font-bold' : 'glass-btn'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>{t.controlFlipH}</span>
                  </button>
                  <button
                    onClick={() => setFlipY((prev) => !prev)}
                    className={`p-2 text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer font-medium transition-all ${
                      flipY ? 'glass-btn-primary font-bold' : 'glass-btn'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>{t.controlFlipV}</span>
                  </button>
                </div>

                {/* Free angle slider */}
                <div className="space-y-1 pt-1 border-t border-white/40 dark:border-white/10">
                  <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>{t.controlRotate}</span>
                    <span className="font-mono tabular-nums">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Color & Tint Studio Card */}
              <div className="p-4 sm:p-5 glass-panel liquid-sheen rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.controlFill} / {t.controlStroke}</span>
                  </h3>
                  <button
                    onClick={() => {
                      setFillColor('original');
                      setStrokeColor('original');
                      setStrokeWidth(0);
                    }}
                    className="text-[11px] text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    Reset Colors
                  </button>
                </div>

                {/* Fill Color Preset Strip */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>{t.controlFill}</span>
                    <span className="font-mono text-[11px]">{fillColor}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setFillColor('original')}
                      className={`px-2.5 py-1 text-xs rounded-xl font-medium cursor-pointer transition-all ${
                        fillColor === 'original' ? 'glass-btn-primary' : 'glass-btn'
                      }`}
                    >
                      Original
                    </button>
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        onClick={() => setFillColor(swatch)}
                        style={{ backgroundColor: swatch }}
                        className={`w-6 h-6 rounded-full border border-white/50 shadow-2xs transition-transform cursor-pointer ${
                          fillColor === swatch ? 'ring-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                        }`}
                        title={swatch}
                      />
                    ))}
                    <input
                      type="color"
                      value={fillColor.startsWith('#') ? fillColor : '#10b981'}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer"
                      title="Custom Color"
                    />
                  </div>
                </div>

                {/* Stroke Color Preset Strip */}
                <div className="space-y-1.5 pt-2 border-t border-white/40 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>Global Stroke Color:</span>
                    <span className="font-mono text-[11px]">{strokeColor}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setStrokeColor('original')}
                      className={`px-2.5 py-1 text-xs rounded-xl font-medium cursor-pointer transition-all ${
                        strokeColor === 'original' ? 'glass-btn-primary' : 'glass-btn'
                      }`}
                    >
                      Original
                    </button>
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={`stroke-${swatch}`}
                        onClick={() => setStrokeColor(swatch)}
                        style={{ backgroundColor: swatch }}
                        className={`w-6 h-6 rounded-full border border-white/50 shadow-2xs transition-transform cursor-pointer ${
                          strokeColor === swatch ? 'ring-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                        }`}
                        title={swatch}
                      />
                    ))}
                    <input
                      type="color"
                      value={strokeColor.startsWith('#') ? strokeColor : '#3b82f6'}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer"
                      title="Custom Stroke"
                    />
                  </div>
                </div>

                {/* Stroke Width Slider */}
                <div className="space-y-1 pt-2 border-t border-white/40 dark:border-white/10">
                  <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>Stroke Width</span>
                    <span className="font-mono tabular-nums">{strokeWidth > 0 ? `${strokeWidth}px` : 'Default'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Detected Palette Color Replacer (SVGViewer.dev signature feature) */}
              {metrics.extractedColors.length > 0 && (
                <div className="p-4 sm:p-5 glass-panel liquid-sheen rounded-3xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Extracted Color Palette ({metrics.extractedColors.length})</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400">Click color to replace in SVG</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {metrics.extractedColors.map((color) => {
                      const replacement = colorReplacements[color] || color;
                      return (
                        <div
                          key={color}
                          className="p-2 rounded-xl glass-card flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              style={{ backgroundColor: replacement }}
                              className="w-5 h-5 rounded-full border border-white/50 shrink-0 shadow-2xs"
                            />
                            <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate">
                              {color}
                            </span>
                          </div>
                          <input
                            type="color"
                            value={replacement.startsWith('#') ? replacement : '#000000'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setColorReplacements((prev) => ({
                                ...prev,
                                [color]: newColor,
                              }));
                            }}
                            className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                            title={`Replace ${color}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MARKUP CODE EDITOR (Line numbers, Prettify, Minify) */}
          {/* ======================================================== */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              {/* Code Action Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrettify}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-btn rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Prettify XML</span>
                  </button>
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 glass-btn rounded-xl disabled:opacity-30 cursor-pointer"
                    title="Undo"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 glass-btn rounded-xl disabled:opacity-30 cursor-pointer"
                    title="Redo"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-mono text-xs text-neutral-400 tabular-nums">
                  {lines.length} lines · {formatBytes(getByteLength(baseSvgCode))}
                </div>
              </div>

              {/* Validation Alert */}
              {!validation.isValid && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">XML Validation Notice: </span>
                      <span>{validation.errorMessage}</span>
                    </div>
                  </div>
                  {validation.missingPrefix && (
                    <button
                      onClick={() => {
                        const cleaned = stripEditorArtifacts(baseSvgCode);
                        updateCodeWithHistory(cleaned);
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                    >
                      Strip Editor Metadata
                    </button>
                  )}
                </div>
              )}

              {/* Editor Workspace */}
              <div className="glass-panel liquid-sheen rounded-3xl overflow-hidden shadow-md">
                <div className="flex font-mono text-xs max-h-[460px] overflow-y-auto bg-neutral-950 text-neutral-100">
                  <div className="select-none py-3 px-3 text-right text-neutral-600 bg-neutral-900/60 border-r border-white/10 font-mono tabular-nums min-w-[42px]">
                    {lines.map((_, idx) => (
                      <div key={idx} className="leading-6 text-[11px]">
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={baseSvgCode}
                    onChange={(e) => updateCodeWithHistory(e.target.value)}
                    spellCheck={false}
                    rows={Math.max(16, lines.length)}
                    className="flex-1 p-3 bg-transparent text-neutral-100 font-mono text-xs leading-6 resize-none focus:outline-none whitespace-pre overflow-x-auto selection:bg-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MULTI-PASS SVGO OPTIMIZER                          */}
          {/* ======================================================== */}
          {activeTab === 'optimizer' && (
            <div className="space-y-4">
              <div className="p-5 glass-panel liquid-sheen rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Real-Time Size Comparison</span>
                  </h3>
                  <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                    Executed in {optimizationResult.durationMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl glass-card">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Original</span>
                    <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {formatBytes(optimizationResult.originalBytes)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl glass-card">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Optimized</span>
                    <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatBytes(optimizationResult.optimizedBytes)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Reduction</span>
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      -{optimizationResult.percentageSaved}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApplyOptimization}
                  disabled={optimizationResult.bytesSaved === 0}
                  className="w-full py-2.5 px-4 text-xs font-semibold glass-btn-primary rounded-xl cursor-pointer disabled:opacity-50 shadow-md"
                >
                  Apply Optimization ({optimizationResult.bytesSaved} Bytes Saved)
                </button>
              </div>

              {/* Granular Rules */}
              <div className="p-5 glass-panel liquid-sheen rounded-3xl space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Optimization Rules &amp; Passes</span>
                  </h4>
                  <button
                    onClick={() => setOptimizerOptions(defaultOptimizerOptions)}
                    className="text-[11px] text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.removeComments}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, removeComments: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Remove comments &amp; CDATA</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.removeDoctype}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, removeDoctype: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Strip DOCTYPE &amp; XML prolog</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.removeMetadata}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, removeMetadata: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Strip editor tags (inkscape, sketch)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.collapseGroups}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, collapseGroups: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Collapse redundant &lt;g&gt; containers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.removeEmptyAttrs}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, removeEmptyAttrs: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Clean empty attributes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={optimizerOptions.minifyWhitespace}
                      onChange={(e) =>
                        setOptimizerOptions((prev) => ({ ...prev, minifyWhitespace: e.target.checked }))
                      }
                      className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                    />
                    <span>Minify whitespace &amp; linebreaks</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: COMPREHENSIVE MULTI-FORMAT EXPORT & CONVERTER       */}
          {/* (SVG, PNG, WEBP, JPEG, React, Vue, Svelte, Data URI, CSS) */}
          {/* ======================================================== */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Format Category Pills */}
              <div className="p-4 sm:p-5 glass-panel liquid-sheen rounded-3xl space-y-4 shadow-sm">
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                    Choose Destination Format:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setExportFormat('svg')}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        exportFormat === 'svg' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      <span>SVG (.svg)</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('png')}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        exportFormat === 'png' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      <span>PNG Image</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('webp')}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        exportFormat === 'webp' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      <span>WebP Image</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('jpeg')}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        exportFormat === 'jpeg' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      <span>JPEG Image</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => setExportFormat('react')}
                      className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        exportFormat === 'react' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      React JSX
                    </button>
                    <button
                      onClick={() => setExportFormat('react-native')}
                      className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        exportFormat === 'react-native' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      React Native
                    </button>
                    <button
                      onClick={() => setExportFormat('vue')}
                      className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        exportFormat === 'vue' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      Vue 3
                    </button>
                    <button
                      onClick={() => setExportFormat('svelte')}
                      className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        exportFormat === 'svelte' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      Svelte
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => setExportFormat('datauri-utf8')}
                      className={`p-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all ${
                        exportFormat === 'datauri-utf8' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      Data URI (UTF-8)
                    </button>
                    <button
                      onClick={() => setExportFormat('datauri-base64')}
                      className={`p-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all ${
                        exportFormat === 'datauri-base64' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      Data URI (Base64)
                    </button>
                    <button
                      onClick={() => setExportFormat('css-bg')}
                      className={`p-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all ${
                        exportFormat === 'css-bg' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      CSS url()
                    </button>
                    <button
                      onClick={() => setExportFormat('html-img')}
                      className={`p-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all ${
                        exportFormat === 'html-img' ? 'glass-btn-primary shadow-sm' : 'glass-btn'
                      }`}
                    >
                      HTML &lt;img&gt;
                    </button>
                  </div>
                </div>

                {/* Raster Settings (if PNG, WEBP, JPEG) */}
                {(exportFormat === 'png' || exportFormat === 'webp' || exportFormat === 'jpeg') && (
                  <div className="space-y-3 pt-3 border-t border-white/40 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Resolution &amp; Scale Presets
                      </span>
                      <span className="font-mono text-xs text-neutral-500">
                        {rasterSize} × {rasterSize} px
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {[32, 64, 128, 256, 512, 1024, 2048].map((size) => (
                        <button
                          key={size}
                          onClick={() => setRasterSize(size)}
                          className={`py-1.5 text-xs font-mono rounded-xl cursor-pointer transition-all ${
                            rasterSize === size ? 'glass-btn-primary font-bold' : 'glass-btn'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={transparentBg}
                          onChange={(e) => setTransparentBg(e.target.checked)}
                          disabled={exportFormat === 'jpeg'}
                          className="rounded-lg border-neutral-300 text-emerald-600 focus:ring-0"
                        />
                        <span>Transparent Background {exportFormat === 'jpeg' && '(N/A for JPEG)'}</span>
                      </label>
                    </div>

                    <button
                      onClick={handleExecuteExport}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold glass-btn-primary rounded-2xl cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>{isExporting ? 'Generating Image...' : `Download ${exportFormat.toUpperCase()} (${rasterSize}×${rasterSize}px)`}</span>
                    </button>
                  </div>
                )}

                {/* SVG Direct Download if SVG is chosen */}
                {exportFormat === 'svg' && (
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteExport}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold glass-btn-primary rounded-2xl cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Cleaned SVG File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Code / URI Output Box with Copy Button */}
              <div className="glass-panel liquid-sheen rounded-3xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-white/10 text-xs">
                  <span className="font-mono text-[11px] text-neutral-400 uppercase">
                    {exportFormat} Code Preview
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedCodePreview, 'export-preview')}
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedKey === 'export-preview' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 font-mono text-[11px] text-neutral-200 max-h-52 overflow-x-auto whitespace-pre-wrap break-all bg-neutral-950/80 leading-relaxed">
                  {generatedCodePreview}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
