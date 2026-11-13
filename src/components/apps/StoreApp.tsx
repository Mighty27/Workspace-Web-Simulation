import React, { useState } from 'react';
import {
  Search,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Code2,
  Plus,
  Play,
  X,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../shell/AppIcon';
import { AppCategory, AppManifest, AppPermission } from '../../types/os';

export const StoreApp: React.FC = () => {
  const {
    allApps,
    installedAppIds,
    installApp,
    uninstallApp,
    registerCustomApp,
    openApp,
    settings,
    t,
  } = useOS();

  const [activeTab, setActiveTab] = useState<'discover' | 'apps' | 'library' | 'sdk'>('discover');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AppCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppManifest | null>(null);
  const [confirmUninstallId, setConfirmUninstallId] = useState<string | null>(null);

  // Custom SDK Manifest state
  const [sdkName, setSdkName] = useState('');
  const [sdkUrl, setSdkUrl] = useState('https://');
  const [sdkAuthor, setSdkAuthor] = useState('');
  const [sdkLicense, setSdkLicense] = useState('MIT');
  const [sdkDesc, setSdkDesc] = useState('');
  const [sdkPermissions, setSdkPermissions] = useState<AppPermission[]>(['network']);

  const lang = settings.language;

  const filteredApps = allApps.filter((app) => {
    if (activeTab === 'library' && !installedAppIds.includes(app.id)) return false;
    if (categoryFilter !== 'all' && app.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.description[lang].toLowerCase().includes(q) ||
        app.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInstallCustomManifest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdkName.trim() || !sdkUrl.trim()) return;
    const id = `custom-${sdkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const manifest: AppManifest = {
      id,
      name: sdkName.trim(),
      description: {
        id: sdkDesc.trim() || 'Aplikasi web pihak ketiga yang dipasang lewat SDK Manifest.',
        en: sdkDesc.trim() || 'Third-party web application installed via Manifest SDK.',
      },
      icon: 'Code2',
      version: '1.0.0',
      author: sdkAuthor.trim() || 'Pengembang Independen',
      license: sdkLicense.trim() || 'MIT',
      sourceUrl: sdkUrl.trim(),
      type: 'thirdparty',
      category: 'web',
      url: sdkUrl.trim(),
      permissions: sdkPermissions,
      openMode: 'iframe',
      defaultSize: { width: 860, height: 560 },
    };
    registerCustomApp(manifest);
    setSdkName('');
    setSdkUrl('https://');
    setSdkDesc('');
    setActiveTab('library');
  };

  const togglePermission = (perm: AppPermission) => {
    setSdkPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          {[
            { id: 'discover', label: t('Eksplorasi', 'Discover') },
            { id: 'apps', label: t('Semua Aplikasi', 'All Apps') },
            {
              id: 'library',
              label: `${t('Terpasang', 'Library')} (${installedAppIds.length})`,
            },
            { id: 'sdk', label: t('SDK Pengembang', 'Developer SDK') },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as typeof activeTab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tb.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {activeTab !== 'sdk' && (
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari aplikasi atau pengembang...', 'Search apps or authors...')}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-sky-500 w-56"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'sdk' ? (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h2 className="text-base font-semibold">
                {t('Kemas & Pasang Aplikasi Web via Manifest SDK', 'Package & Install Web App via Manifest SDK')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  'Sesuai spesifikasi PRD F15, pengembang dapat mendaftarkan alat berbasis web sebagai aplikasi terisolasi (sandbox iframe) dengan deklarasi izin eksplisit.',
                  'Per PRD F15 specification, developers can register any web tool as a sandboxed workstation app with explicit permission declarations.'
                )}
              </p>
            </div>

            <form
              onSubmit={handleInstallCustomManifest}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {t('Nama Aplikasi', 'App Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={sdkName}
                    onChange={(e) => setSdkName(e.target.value)}
                    placeholder="Contoh: Pomodoro Tracker"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t('URL Aplikasi (HTTPS)', 'App URL (HTTPS)')} *
                  </label>
                  <input
                    type="url"
                    required
                    value={sdkUrl}
                    onChange={(e) => setSdkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {t('Pengembang / Organisasi', 'Developer / Author')}
                  </label>
                  <input
                    type="text"
                    value={sdkAuthor}
                    onChange={(e) => setSdkAuthor(e.target.value)}
                    placeholder="Studio Anda"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t('Lisensi', 'License')}
                  </label>
                  <input
                    type="text"
                    value={sdkLicense}
                    onChange={(e) => setSdkLicense(e.target.value)}
                    placeholder="MIT / Apache-2.0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  {t('Deskripsi Singkat', 'Short Description')}
                </label>
                <textarea
                  rows={2}
                  value={sdkDesc}
                  onChange={(e) => setSdkDesc(e.target.value)}
                  placeholder={t('Jelaskan fungsi aplikasi...', 'Describe what this app does...')}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5">
                  {t('Izin Sandbox yang Diminta', 'Requested Sandbox Permissions')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['network', 'files', 'clipboard', 'notifications'] as AppPermission[]).map(
                    (perm) => {
                      const active = sdkPermissions.includes(perm);
                      return (
                        <button
                          type="button"
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`px-2.5 py-1 rounded-md font-mono text-[11px] border transition-colors ${
                            active
                              ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          {perm}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  <Plus size={14} />
                  <span>{t('Pasang ke Workstation', 'Install to Workstation')}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Featured Hero Banner in Discover */}
            {activeTab === 'discover' && !searchQuery && (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 text-xs text-sky-400">
                    <span>{t('Kurasi Pilihan Editor', 'Editor Curated Spotlight')}</span>
                    <span aria-hidden="true">·</span>
                    <span>MIT Open Source</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {t(
                      'Ekosistem Aplikasi Terbuka Tanpa Mengorbankan Privasi',
                      'Open Application Ecosystem Without Compromising Privacy'
                    )}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t(
                      'Setiap aplikasi di BrowStore menampilkan lisensi sumber terbuka, pengembang asli, dan izin sandbox secara transparan sebelum Anda memasangnya.',
                      'Every app in BrowStore transparently lists its open-source license, original author, and sandbox permissions before you install it.'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sdk')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0"
                >
                  <Code2 size={14} />
                  <span>{t('Tambah App Kustom', 'Add Custom App')}</span>
                </button>
              </div>
            )}

            {/* Category Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: t('Semua Kategori', 'All Categories') },
                { id: 'productivity', label: t('Produktivitas', 'Productivity') },
                { id: 'creative', label: t('Kreatif', 'Creative') },
                { id: 'utilities', label: t('Utilitas', 'Utilities') },
                { id: 'games', label: t('Permainan', 'Games') },
                { id: 'system', label: t('Sistem Inti', 'Core System') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as typeof categoryFilter)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat.id
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredApps.map((app) => {
                const isInstalled = installedAppIds.includes(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/25 flex flex-col justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <AppIcon icon={app.icon} appId={app.id} size="lg" />
                      <div className="min-w-0 flex-1">
                        {/* Clean unboxed metadata kicker per Zero-Pill rule */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>v{app.version}</span>
                          <span aria-hidden="true">·</span>
                          <span>{app.license}</span>
                          {app.sponsored && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-500 font-medium">
                                Sponsored
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                          {app.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {app.description[lang]}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800/70 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {app.author}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {isInstalled ? (
                          <>
                            <button
                              onClick={() => openApp(app.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                            >
                              <Play size={12} />
                              <span>{t('Buka', 'Open')}</span>
                            </button>
                            {app.type !== 'builtin' && (
                              <button
                                onClick={() => setConfirmUninstallId(app.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                                title={t('Hapus Instalasi', 'Uninstall')}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => installApp(app.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                          >
                            <Download size={12} />
                            <span>{t('Pasang', 'Install')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* App Manifest Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <AppIcon icon={selectedApp.icon} appId={selectedApp.id} size="lg" />
                <div>
                  <h3 className="text-base font-bold">{selectedApp.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedApp.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>v{selectedApp.version}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedApp.license}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedApp.description[lang]}
            </p>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>{t('Transparansi Manifest & Izin', 'Manifest & Permission Transparency')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <div>
                  <span className="text-slate-400">{t('Mode Buka:', 'Open Mode:')}</span>{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {selectedApp.openMode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{t('Izin Diminta:', 'Permissions:')}</span>{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {selectedApp.permissions.length > 0
                      ? selectedApp.permissions.join(', ')
                      : t('Tidak ada (Terisolasi)', 'None (Sandboxed)')}
                  </span>
                </div>
              </div>
              {selectedApp.sourceUrl && (
                <div className="pt-1">
                  <a
                    href={selectedApp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-500 hover:underline"
                  >
                    <span>{t('Lihat Repositori / Situs Resmi', 'View Official Repository / Website')}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {installedAppIds.includes(selectedApp.id) ? (
                <>
                  {selectedApp.type !== 'builtin' && (
                    <button
                      onClick={() => {
                        uninstallApp(selectedApp.id, true);
                        setSelectedApp(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      {t('Hapus & Bersihkan Data', 'Uninstall & Clear Data')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      openApp(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600"
                  >
                    {t('Buka Aplikasi', 'Launch App')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    installApp(selectedApp.id);
                    setSelectedApp(null);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600"
                >
                  {t('Setujui Izin & Pasang', 'Approve Permissions & Install')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uninstall Confirmation Modal */}
      {confirmUninstallId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold">
              {t('Konfirmasi Hapus Aplikasi', 'Confirm App Uninstallation')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t(
                'Menghapus aplikasi ini juga akan menghapus shortcut di Desktop dan data manifest aplikasi. Lanjutkan?',
                'Uninstalling this application will also remove its Desktop shortcuts and app manifest data. Continue?'
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmUninstallId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  uninstallApp(confirmUninstallId, true);
                  setConfirmUninstallId(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
              >
                {t('Hapus Aplikasi', 'Uninstall')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
