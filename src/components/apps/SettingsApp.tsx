import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Sliders,
  Cloud,
  HardDrive,
  Info,
  Award,
  Upload,
  Download,
  RefreshCw,
  Check,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import {
  APP_CATALOG,
  APP_VERSION,
  BUILTIN_WALLPAPERS,
  DEFAULT_SETTINGS,
  WHATS_NEW_CHANGELOG,
} from '../../data/catalog';
import {
  getStorageQuotaInfo,
  requestPersistentStorage,
  StorageQuotaInfo,
} from '../../services/storage';

export const SettingsApp: React.FC = () => {
  const {
    settings,
    updateSettings,
    createFile,
    files,
    account,
    loginAccount,
    logoutAccount,
    syncWorkspaceNow,
    exportWorkspaceArchive,
    importWorkspaceArchive,
    resetEntireWorkspace,
    setWhatsNewOpen,
    t,
  } = useOS();

  const [section, setSection] = useState<
    'personalize' | 'system' | 'sync' | 'storage' | 'about' | 'credits'
  >('personalize');

  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [quota, setQuota] = useState<StorageQuotaInfo>({
    usageBytes: 0,
    quotaBytes: 1024 * 1024 * 1024,
    persisted: false,
    opfsSupported: true,
  });

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStorageQuotaInfo().then(setQuota);
  }, [files, section]);

  const handleCustomWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(rawFile);
    });
    const vfsFile = await createFile(
      `Wallpaper-${rawFile.name}`,
      'folder-pictures',
      dataUrl,
      rawFile.type || 'image/jpeg'
    );
    updateSettings({
      customWallpaperFileId: vfsFile.id,
    });
  };

  const handleImportArchiveFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    const text = await rawFile.text();
    const res = await importWorkspaceArchive(text);
    setImportStatus(res.message);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const vfsTotalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs select-none">
      {/* Responsive Navigation Sidebar (Horizontal on mobile, Vertical on desktop) */}
      <aside className="w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto">
        {[
          {
            id: 'personalize',
            icon: <Palette size={15} />,
            label: t('Personalisasi', 'Personalization'),
          },
          {
            id: 'system',
            icon: <Sliders size={15} />,
            label: t('Taskbar & Startup', 'Taskbar & Startup'),
          },
          {
            id: 'sync',
            icon: <Cloud size={15} />,
            label: t('Akun & Ekspor/Impor', 'Account & Backup'),
          },
          {
            id: 'storage',
            icon: <HardDrive size={15} />,
            label: t('Penyimpanan VFS', 'VFS Storage'),
          },
          {
            id: 'about',
            icon: <Info size={15} />,
            label: t('Tentang & Pembaruan', 'About & Updates'),
          },
          {
            id: 'credits',
            icon: <Award size={15} />,
            label: t('Kredit & Lisensi', 'Credits & Licenses'),
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id as typeof section)}
            className={`md:w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              section === item.id
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {section === 'personalize' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold">
                {t('Personalisasi Tampilan & Desktop', 'Appearance & Desktop Personalization')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'Sesuaikan tema, wallpaper berbasis OPFS, gaya tombol jendela, dan kursor sesuai preferensi Anda.',
                  'Customize theme, OPFS-backed wallpapers, window button styles, and cursor to match your workflow.'
                )}
              </p>
            </div>

            {/* Wallpaper Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  {t('Wallpaper Desktop', 'Desktop Wallpaper')}
                </label>
                <button
                  onClick={() => wallpaperInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium"
                >
                  <Upload size={12} />
                  <span>{t('Unggah Gambar Sendiri (OPFS)', 'Upload Custom Image (OPFS)')}</span>
                </button>
                <input
                  ref={wallpaperInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomWallpaperUpload}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BUILTIN_WALLPAPERS.map((wp) => {
                  const active =
                    !settings.customWallpaperFileId && settings.wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() =>
                        updateSettings({
                          wallpaperId: wp.id,
                          customWallpaperFileId: undefined,
                        })
                      }
                      className={`group relative h-20 rounded-xl overflow-hidden border text-left p-2.5 flex flex-col justify-end transition-all ${
                        active
                          ? 'border-sky-500 ring-2 ring-sky-500/40'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                      style={{ background: wp.cssBackground }}
                    >
                      <div className="text-[11px] font-semibold text-white drop-shadow">
                        {wp.name[settings.language]}
                      </div>
                      <div className="text-[9px] text-slate-300">{wp.license}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme & Window Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="font-semibold">{t('Mode Tema', 'Theme Mode')}</label>
                <div className="flex gap-1.5">
                  {(['dark', 'light', 'system'] as const).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => updateSettings({ theme: thm })}
                      className={`flex-1 py-1.5 rounded-lg border font-medium capitalize ${
                        settings.theme === thm
                          ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {thm === 'dark'
                        ? t('Gelap', 'Dark')
                        : thm === 'light'
                        ? t('Terang', 'Light')
                        : t('Sistem', 'System')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">
                  {t('Gaya Tombol Jendela', 'Window Control Style')}
                </label>
                <div className="flex gap-1.5">
                  {(['windows', 'mac'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateSettings({ windowControlStyle: st })}
                      className={`flex-1 py-1.5 rounded-lg border font-medium ${
                        settings.windowControlStyle === st
                          ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {st === 'windows' ? 'Windows (Kanan)' : 'macOS (Kiri)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">
                  {t('Sudut Jendela', 'Window Corner Radius')}
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'none', label: t('Tegak (0px)', 'Sharp') },
                    { id: 'md', label: t('Standar (12px)', 'Rounded') },
                    { id: 'xl', label: t('Lengkung (20px)', 'Extra') },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      onClick={() =>
                        updateSettings({
                          windowRadius: rad.id as typeof settings.windowRadius,
                        })
                      }
                      className={`flex-1 py-1.5 rounded-lg border font-medium ${
                        settings.windowRadius === rad.id
                          ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">
                  {t('Gaya Kursor (Aksesibilitas)', 'Cursor Style (Accessibility)')}
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'default', label: t('Standar OS', 'System Default') },
                    { id: 'precision', label: t('Presisi (+)', 'Precision') },
                    { id: 'large', label: t('Tangan Fokus', 'Pointer') },
                  ].map((cur) => (
                    <button
                      key={cur.id}
                      onClick={() =>
                        updateSettings({
                          customCursor: cur.id as typeof settings.customCursor,
                        })
                      }
                      className={`flex-1 py-1.5 rounded-lg border font-medium ${
                        settings.customCursor === cur.id
                          ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {cur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Custom Watermark Label */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-semibold">
                {t('Teks Label Desktop (Opsional)', 'Desktop Custom Text Overlay (Optional)')}
              </label>
              <input
                type="text"
                value={settings.desktopLabelText}
                onChange={(e) => updateSettings({ desktopLabelText: e.target.value })}
                placeholder={t(
                  'Contoh: Ruang Kerja Riset Semester Ganjil',
                  'Example: Research Workstation Workspace'
                )}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        )}

        {section === 'system' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className="text-base font-bold">
                {t('Pengaturan Taskbar, Bahasa & Startup', 'Taskbar, Language & Startup Settings')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'Atur tata letak taskbar, bahasa antarmuka, mode sentuh tablet, dan perilaku boot.',
                  'Configure taskbar layout, interface language, tablet touch mode, and boot behavior.'
                )}
              </p>
            </div>

            <div className="space-y-3 divide-y divide-slate-200 dark:divide-slate-800">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{t('Bahasa Antarmuka (i18n)', 'Interface Language (i18n)')}</div>
                  <div className="text-slate-400">{t('Mendukung Bahasa Indonesia dan Inggris sejak awal', 'Supports Indonesian and English out of the box')}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSettings({ language: 'id' })}
                    className={`px-3 py-1 rounded-lg border font-medium ${
                      settings.language === 'id'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Indonesia
                  </button>
                  <button
                    onClick={() => updateSettings({ language: 'en' })}
                    className={`px-3 py-1 rounded-lg border font-medium ${
                      settings.language === 'en'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{t('Lebar Taskbar', 'Taskbar Width')}</div>
                  <div className="text-slate-400">{t('Penuh 100% atau Dock Tengah Otomatis', 'Full 100% bar or Auto Centered Dock')}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSettings({ taskbarWidth: 'full' })}
                    className={`px-3 py-1 rounded-lg border font-medium ${
                      settings.taskbarWidth === 'full'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {t('Penuh', 'Full')}
                  </button>
                  <button
                    onClick={() => updateSettings({ taskbarWidth: 'auto' })}
                    className={`px-3 py-1 rounded-lg border font-medium ${
                      settings.taskbarWidth === 'auto'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {t('Otomatis (Dock)', 'Auto (Dock)')}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{t('Mode Sentuh & Tablet (F17)', 'Touch & Tablet Mode (F17)')}</div>
                  <div className="text-slate-400">{t('Memaksimalkan jendela baru secara otomatis untuk layar sentuh', 'Automatically maximizes new windows for touch screens')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.touchMode}
                  onChange={(e) => updateSettings({ touchMode: e.target.checked })}
                  className="w-4 h-4 accent-sky-500"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{t('Transparansi Kaca (Glassmorphism)', 'Glass Transparency')}</div>
                  <div className="text-slate-400">{t('Efek blur halus pada jendela dan taskbar', 'Subtle backdrop blur on windows and taskbar')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.glassTransparency}
                  onChange={(e) => updateSettings({ glassTransparency: e.target.checked })}
                  className="w-4 h-4 accent-sky-500"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{t('Animasi & Suara Boot', 'Boot Animation & Sound')}</div>
                  <div className="text-slate-400">{t('Menghormati prefers-reduced-motion secara otomatis', 'Automatically respects prefers-reduced-motion')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.bootSound}
                  onChange={(e) =>
                    updateSettings({
                      bootSound: e.target.checked,
                      bootAnimation: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-sky-500"
                />
              </div>
            </div>

            {/* Customize Hide/Show Taskbar Buttons */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">
                    {t(
                      'Kustomisasi Tombol Taskbar (Tampilkan / Sembunyikan)',
                      'Customize Taskbar Buttons (Show / Hide)'
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {t(
                      'Pilih tombol mana saja yang ditampilkan atau disembunyikan pada taskbar.',
                      'Choose which buttons are shown or hidden on the taskbar.'
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      taskbarButtons: {
                        ...DEFAULT_SETTINGS.taskbarButtons,
                        hiddenAppIds: [],
                      },
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-500 hover:bg-sky-500/25 font-medium text-[11px] shrink-0"
                >
                  {t('Tampilkan Semua', 'Show All')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {(
                  [
                    { key: 'start', label: t('Tombol Start', 'Start Button') },
                    { key: 'home', label: t('Tombol Home / Desktop', 'Home / Show Desktop') },
                    { key: 'search', label: t('Tombol Cari (Ctrl+K)', 'Search (Ctrl+K)') },
                    { key: 'workspaces', label: t('Virtual Desktop (D1–D3)', 'Virtual Desktops (D1–D3)') },
                    { key: 'apps', label: t('Daftar Aplikasi Taskbar', 'Taskbar App List') },
                    { key: 'whatsNew', label: t("Tombol What's New (v1.0)", "What's New (v1.0)") },
                    { key: 'language', label: t('Tombol Bahasa (ID/EN)', 'Language (ID/EN)') },
                    { key: 'theme', label: t('Tombol Tema Gelap/Terang', 'Dark/Light Theme') },
                    { key: 'notifications', label: t('Tombol Notifikasi', 'Notifications') },
                    { key: 'clock', label: t('Jam & Tanggal', 'Clock & Date') },
                  ] as const
                ).map((item) => {
                  const tb = {
                    ...DEFAULT_SETTINGS.taskbarButtons,
                    ...(settings.taskbarButtons || {}),
                  };
                  const checked = tb[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                    >
                      <span className="font-medium">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          updateSettings({
                            taskbarButtons: {
                              ...tb,
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-sky-500"
                      />
                    </label>
                  );
                })}
              </div>

              {(settings.taskbarButtons?.hiddenAppIds?.length ?? 0) > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500">
                    {t('Aplikasi disembunyikan dari taskbar:', 'Apps hidden from taskbar:')}{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {settings.taskbarButtons.hiddenAppIds.length}
                    </strong>
                  </span>
                  <button
                    onClick={() =>
                      updateSettings({
                        taskbarButtons: {
                          ...DEFAULT_SETTINGS.taskbarButtons,
                          ...(settings.taskbarButtons || {}),
                          hiddenAppIds: [],
                        },
                      })
                    }
                    className="text-sky-500 hover:underline font-medium"
                  >
                    {t('Pulihkan Semua Aplikasi', 'Restore All Apps')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'sync' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold">
                {t('Akun Opsional & Ekspor/Impor Workspace', 'Optional Account & Workspace Export/Import')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'Data adalah milik Anda. Gunakan mode tamu lokal atau hubungkan akun, serta ekspor seluruh ruang kerja kapan saja.',
                  'Your data belongs to you. Use local guest mode or connect an account, and export your entire workspace anytime.'
                )}
              </p>
            </div>

            {/* Optional Account Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              {account ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">{account.name}</div>
                      <div className="text-slate-400 font-mono">{account.email}</div>
                    </div>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <Check size={14} />
                      <span>{t('Sinkronisasi Aktif', 'Sync Active')}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {t('Sinkronisasi terakhir:', 'Last synced:')}{' '}
                    {account.lastSyncedAt
                      ? new Date(account.lastSyncedAt).toLocaleString()
                      : '—'}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={syncWorkspaceNow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium"
                    >
                      <RefreshCw size={13} />
                      <span>{t('Sinkronkan Sekarang', 'Sync Now')}</span>
                    </button>
                    <button
                      onClick={logoutAccount}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {t('Beralih ke Mode Tamu', 'Switch to Guest Mode')}
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (accName.trim() && accEmail.trim()) {
                      loginAccount(accName, accEmail);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="font-semibold">
                    {t(
                      'Status Saat Ini: Mode Tamu Lokal (Tanpa Akun)',
                      'Current Status: Local Guest Mode (No Account)'
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={accName}
                      onChange={(e) => setAccName(e.target.value)}
                      placeholder={t('Nama Lengkap', 'Full Name')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <input
                      type="email"
                      required
                      value={accEmail}
                      onChange={(e) => setAccEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-semibold"
                  >
                    {t('Aktifkan Profil Sinkronisasi', 'Enable Sync Profile')}
                  </button>
                </form>
              )}
            </div>

            {/* Export / Import Workspace Archive (F12) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="font-semibold text-sm">
                {t('Ekspor & Impor Arsip Workspace (.json)', 'Export & Import Workspace Archive (.json)')}
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(
                  'Mengemas seluruh pengaturan, aplikasi terpasang, tata letak shortcut, dan berkas VFS ke dalam satu berkas JSON. Saat impor, konflik pengaturan diselesaikan dengan "perubahan terbaru menang", sedangkan berkas yang berbeda dibuatkan salinan konflik.',
                  'Packages all settings, installed apps, shortcut layouts, and VFS files into a single JSON archive. On import, setting conflicts resolve via "newest wins" and differing files generate conflict copies.'
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={exportWorkspaceArchive}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-semibold"
                >
                  <Download size={14} />
                  <span>{t('Ekspor Seluruh Workspace', 'Export Entire Workspace')}</span>
                </button>

                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  <Upload size={14} />
                  <span>{t('Impor Arsip Workspace (.json)', 'Import Workspace Archive (.json)')}</span>
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportArchiveFile}
                />
              </div>

              {importStatus && (
                <div className="text-emerald-500 font-medium pt-1">{importStatus}</div>
              )}
            </div>
          </div>
        )}

        {section === 'storage' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className="text-base font-bold">
                {t('Manajemen Penyimpanan (IndexedDB & OPFS)', 'Storage Management (IndexedDB & OPFS)')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'Menggantikan localStorage 5MB yang rapuh di BrowOS dengan penyimpanan transaksional berkapasitas besar.',
                  'Replaces BrowOS fragile 5MB localStorage with high-capacity transactional browser storage.'
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {t('Total Penggunaan VFS & Sistem', 'Total VFS & System Usage')}
                </span>
                <span className="font-mono tabular-nums font-bold text-sky-500">
                  {formatBytes(Math.max(vfsTotalBytes, quota.usageBytes))} /{' '}
                  {formatBytes(quota.quotaBytes)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">{t('Jumlah Berkas & Folder', 'Files & Folders')}</div>
                  <div className="text-base font-mono tabular-nums font-bold mt-0.5">
                    {files.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">{t('Status Persistensi', 'Persistence Status')}</div>
                  <div className="text-sm font-semibold mt-0.5 text-emerald-500">
                    {quota.persisted
                      ? t('Dilindungi (Persisted)', 'Protected (Persisted)')
                      : t('Standar Browser', 'Browser Standard')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={async () => {
                    const ok = await requestPersistentStorage();
                    setQuota((prev) => ({ ...prev, persisted: ok }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium"
                >
                  {t('Minta navigator.storage.persist()', 'Request navigator.storage.persist()')}
                </button>

                <button
                  onClick={resetEntireWorkspace}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 font-medium"
                >
                  <Trash2 size={13} />
                  <span>{t('Reset ke Pengaturan Awal', 'Reset Factory Defaults')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'about' && (
          <div className="space-y-5 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">
                  WebWorkstation v{APP_VERSION}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {t(
                    'Sistem operasi ruang kerja berbasis web & PWA terinspirasi dari BrowOS.',
                    'Web & PWA desktop workstation operating system inspired by BrowOS.'
                  )}
                </p>
              </div>
              <button
                onClick={() => setWhatsNewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium"
              >
                <Sparkles size={13} />
                <span>{t("Jendela What's New", "What's New Dialog")}</span>
              </button>
            </div>

            {WHATS_NEW_CHANGELOG.map((log) => (
              <div
                key={log.version}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{log.title[settings.language]}</span>
                  <span className="font-mono text-slate-400">{log.date}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {log.highlights[settings.language].map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {section === 'credits' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-bold">
                {t('Atribusi Lisensi & Komponen Sumber Terbuka', 'Open-Source Licenses & Component Attribution')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'Sesuai Bab 12 PRD, setiap komponen pihak ketiga dan aset wallpaper mempertahankan atribusi lisensi aslinya.',
                  'In compliance with PRD Section 12, all third-party components and wallpaper assets preserve their original license attributions.'
                )}
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                  <tr>
                    <th className="py-2 px-3 font-medium">{t('Komponen', 'Component')}</th>
                    <th className="py-2 px-3 font-medium">{t('Pembuat / Sumber', 'Author / Source')}</th>
                    <th className="py-2 px-3 font-medium">{t('Lisensi', 'License')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {APP_CATALOG.map((app) => (
                    <tr key={app.id}>
                      <td className="py-2 px-3 font-semibold">{app.name}</td>
                      <td className="py-2 px-3 text-slate-500">{app.author}</td>
                      <td className="py-2 px-3 font-mono text-sky-500">{app.license}</td>
                    </tr>
                  ))}
                  {BUILTIN_WALLPAPERS.map((wp) => (
                    <tr key={wp.id}>
                      <td className="py-2 px-3 font-semibold">
                        Wallpaper: {wp.name[settings.language]}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{wp.author}</td>
                      <td className="py-2 px-3 font-mono text-emerald-500">{wp.license}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
