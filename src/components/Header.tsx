import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Code2,
  Layers,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Palette,
  Globe,
  Briefcase,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AppRoute, navigateTo } from '../utils/router';
import { IconCategory } from '../types/icon';
import { useAdminSession, sessionChanged } from '../lib/adminSession';
import { useI18n } from '../i18n';
import { Language } from '../i18n/translations';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../lib/theme';

interface HeaderProps {
  currentRoute: AppRoute;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  searchQuery,
  onSearchChange,
}) => {
  const { language, setLanguage, t } = useI18n();
  const { mode, isDark, toggleTheme, accent, setAccent } = useTheme();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);

  const { profile: currentUser, loading: authLoading } = useAdminSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (preferencesRef.current && !preferencesRef.current.contains(e.target as Node)) {
        setPrefDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer and dropdown when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setPrefDropdownOpen(false);
  }, [currentRoute]);

  const handleSignIn = () => navigateTo({ type: 'login' });
  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    sessionChanged();
    navigateTo({ type: 'directory', category: 'all', page: 1 });
  };

  const handleNavCategory = (category: IconCategory) => {
    navigateTo({ type: 'directory', category, page: 1 });
    setMobileMenuOpen(false);
  };

  const handleNavEditor = () => {
    navigateTo({ type: 'editor' });
    setMobileMenuOpen(false);
  };

  const handleNavPortfolio = () => {
    navigateTo({ type: 'portfolio' });
    setMobileMenuOpen(false);
  };

  const handleNavAdmin = () => {
    navigateTo({ type: 'admin' });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/80 dark:border-white/10 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
            className="group flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg cursor-pointer"
          >
            <div
              className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white/20 transition-transform group-hover:scale-105 active:scale-95"
              style={{ backgroundColor: ACCENT_PALETTES[accent].hex }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              VectorHub
            </span>
          </button>
        </div>

        {/* Center: Clean Navigation Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 p-0.5 rounded-xl bg-slate-100/70 dark:bg-neutral-900/70 border border-slate-200/70 dark:border-white/10">
          <button
            onClick={() => handleNavCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'directory'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs'
                : 'hover:text-neutral-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            {t.navDirectory}
          </button>

          <button
            onClick={handleNavPortfolio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'portfolio'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs'
                : 'hover:text-neutral-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.navPortfolio}</span>
          </button>

          <button
            onClick={handleNavEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'editor'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs'
                : 'hover:text-neutral-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.navStudio}</span>
          </button>

          {currentUser?.role === 'admin' && <button
            onClick={handleNavAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'admin'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs'
                : 'hover:text-neutral-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.navAdmin}</span>
          </button>}
        </nav>

        {/* Right: Search, Preferences (Lang + Accent), Theme, Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Desktop Search */}
          <div className="relative hidden lg:block w-44 xl:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-100/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-slate-200/80 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Mobile Search Icon */}
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Toggle mobile search"
            className="lg:hidden p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Unified Compact Preferences Dropdown (Lang & Accent Color) */}
          <div className="relative" ref={preferencesRef}>
            <button
              onClick={() => setPrefDropdownOpen(!prefDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-neutral-800/80 border border-transparent hover:border-slate-200/70 dark:hover:border-white/10 rounded-lg cursor-pointer transition-colors"
              title={`${t.language} & ${t.accentColor}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: ACCENT_PALETTES[accent].hex }}
              />
              <span className="uppercase text-[11px] font-semibold tracking-wide">{language}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {prefDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 glass-panel rounded-xl p-2.5 shadow-xl border border-slate-200/90 dark:border-white/10 z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Language Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block px-1">
                    {t.language}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'vi', label: 'Tiếng Việt', code: 'VI' },
                        { id: 'en', label: 'English', code: 'EN' },
                        { id: 'zh', label: '中文', code: 'ZH' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLanguage(item.id as Language);
                          setPrefDropdownOpen(false);
                        }}
                        className={`px-2 py-1.5 text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                          language === item.id
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="text-[11px] font-medium">{item.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Section */}
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block px-1">
                    {t.accentColor}
                  </span>
                  <div className="grid grid-cols-6 gap-1 pt-0.5">
                    {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((col) => {
                      const pal = ACCENT_PALETTES[col];
                      const isSelected = accent === col;
                      return (
                        <button
                          key={col}
                          onClick={() => {
                            setAccent(col);
                            setPrefDropdownOpen(false);
                          }}
                          className={`flex items-center justify-center p-1.5 rounded-lg transition-transform cursor-pointer ${
                            isSelected ? 'ring-2 ring-emerald-500 scale-110 shadow-xs' : 'hover:scale-105'
                          }`}
                          title={pal.label}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-2xs"
                            style={{ backgroundColor: pal.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-neutral-800/80 rounded-lg transition-colors cursor-pointer"
            title={mode === 'light' ? t.themeLight : mode === 'dark' ? t.themeDark : t.themeSystem}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Sign-In / Account Status */}
          {!authLoading && (
            currentUser ? (
              <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg text-neutral-800 dark:text-neutral-200">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-medium max-w-[70px] truncate text-[11px]">
                    {currentUser.display_name || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title={t.signOut}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-slate-100/80 dark:bg-neutral-800/80 hover:bg-slate-200/80 dark:hover:bg-neutral-700/80 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.signIn}</span>
              </button>
            )
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Dropdown Bar */}
      {mobileSearchOpen && (
        <div className="lg:hidden px-4 pb-2.5 pt-1 border-t border-slate-200/80 dark:border-white/10 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 border-t border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0d111c]/95 backdrop-blur-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleNavCategory('all')}
              className={`p-2 text-xs text-left rounded-lg transition-all cursor-pointer ${
                currentRoute.type === 'directory'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                  : 'bg-slate-100/70 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {t.navDirectory}
            </button>
            <button
              onClick={handleNavPortfolio}
              className={`p-2 text-xs text-left rounded-lg transition-all cursor-pointer ${
                currentRoute.type === 'portfolio'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                  : 'bg-slate-100/70 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {t.navPortfolio}
            </button>
            <button
              onClick={handleNavEditor}
              className={`p-2 text-xs text-left rounded-lg transition-all cursor-pointer ${
                currentRoute.type === 'editor'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                  : 'bg-slate-100/70 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {t.navStudio}
            </button>
            {currentUser?.role === 'admin' && <button
              onClick={handleNavAdmin}
              className={`p-2 text-xs text-left rounded-lg transition-all cursor-pointer ${
                currentRoute.type === 'admin'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                  : 'bg-slate-100/70 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {t.navAdmin}
            </button>}
          </div>

          {/* User authentication in mobile drawer */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-xs">
                  <UserIcon className="w-4 h-4 text-neutral-500" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                    {currentUser.display_name || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-slate-100 dark:bg-neutral-800 rounded-lg cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-500" />
                <span>{t.signIn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
