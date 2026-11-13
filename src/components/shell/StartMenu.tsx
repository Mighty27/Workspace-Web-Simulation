import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FolderOpen,
  ShoppingBag,
  Settings,
  Download,
  Lock,
  FileText,
  User,
  Plus,
  Pin,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from './AppIcon';

export const StartMenu: React.FC = () => {
  const {
    startMenuOpen,
    setStartMenuOpen,
    allApps,
    installedAppIds,
    files,
    openApp,
    account,
    exportWorkspaceArchive,
    setIsLocked,
    settings,
    isAppOnDesktop,
    addAppShortcutToDesktop,
    isAppPinnedToTaskbar,
    togglePinToTaskbar,
    t,
  } = useOS();

  const [query, setQuery] = useState('');
  const [appContextMenu, setAppContextMenu] = useState<{
    x: number;
    y: number;
    appId: string;
  } | null>(null);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu or Start Menu when clicking outside
  useEffect(() => {
    if (!startMenuOpen) {
      setAppContextMenu(null);
      return;
    }

    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (e.button === 2) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const path = e.composedPath ? e.composedPath() : [];

      const insideContextMenu = Boolean(
        contextMenuRef.current &&
          (path.includes(contextMenuRef.current) ||
            contextMenuRef.current.contains(target))
      );

      const insideStartMenu = Boolean(
        menuContainerRef.current &&
          (path.includes(menuContainerRef.current) ||
            menuContainerRef.current.contains(target))
      );

      // If clicking inside the right-click context menu of an app, let the button onClick run
      if (insideContextMenu) {
        return;
      }

      if (appContextMenu) {
        setAppContextMenu(null);
      }

      // Close StartMenu only if clicking outside StartMenu, outside its context menu, and not on the Start button
      if (!insideStartMenu && !target.closest('[data-start-button="true"]')) {
        setStartMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [startMenuOpen, appContextMenu, setStartMenuOpen]);

  if (!startMenuOpen) return null;

  const installedApps = allApps.filter((a) => installedAppIds.includes(a.id));
  const builtinApps = installedApps.filter((a) => a.type === 'builtin');
  const storeApps = installedApps.filter((a) => a.type !== 'builtin');

  const q = query.trim().toLowerCase();
  const matchedApps = q
    ? installedApps.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description[settings.language].toLowerCase().includes(q)
      )
    : [];

  const matchedFiles = q
    ? files.filter(
        (f) => !f.isTrash && !f.isFolder && f.name.toLowerCase().includes(q)
      )
    : [];

  const handleAppRightClick = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.min(e.clientY, window.innerHeight - 170);
    setAppContextMenu({ x: Math.max(8, x), y: Math.max(8, y), appId });
  };

  return (
    <>
      {/* Full-screen click-outside catcher for Start Menu */}
      <div
        className="fixed inset-0 z-[945] bg-transparent"
        onPointerDown={(e) => {
          e.stopPropagation();
          setAppContextMenu(null);
          setStartMenuOpen(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setAppContextMenu(null);
          setStartMenuOpen(false);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAppContextMenu(null);
          setStartMenuOpen(false);
        }}
      />

      <div
        ref={menuContainerRef}
        data-context-menu="true"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setAppContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="fixed bottom-14 inset-x-2 sm:inset-x-auto sm:left-3 z-[950] sm:w-[420px] max-h-[calc(100dvh-68px)] rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 select-none"
      >
        {/* Search Bar — autoFocus disabled so virtual keyboard does not auto-open */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                'Cari aplikasi atau berkas di VFS...',
                'Search apps or files in VFS...'
              )}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/90 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-5">
          {q ? (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  {t('Aplikasi Cocok', 'Matching Applications')} ({matchedApps.length})
                </div>
                {matchedApps.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t('Tidak ada aplikasi ditemukan.', 'No matching apps found.')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {matchedApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => openApp(app.id)}
                        onContextMenu={(e) => handleAppRightClick(e, app.id)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                      >
                        <AppIcon icon={app.icon} appId={app.id} size="md" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{app.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {app.category}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  {t('Berkas di Virtual File System', 'Files in Virtual File System')} (
                  {matchedFiles.length})
                </div>
                {matchedFiles.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t('Tidak ada berkas VFS yang cocok.', 'No matching VFS files.')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {matchedFiles.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          openApp('notepad', {
                            fileId: f.id,
                            customTitle: `Notepad — ${f.name}`,
                          });
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-sky-500 shrink-0" />
                          <span className="font-medium truncate">{f.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">VFS</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Default Built-in Apps */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2.5 px-1">
                  <span>{t('Aplikasi Bawaan (Default Apps)', 'Default Built-in Apps')}</span>
                  <span>{builtinApps.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {builtinApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => openApp(app.id)}
                      onContextMenu={(e) => handleAppRightClick(e, app.id)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-center"
                    >
                      <AppIcon icon={app.icon} appId={app.id} size="md" />
                      <span className="text-[11px] font-medium truncate w-full">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Installed Store / Web Apps */}
              {storeApps.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2 px-1">
                    <span>{t('Aplikasi Terpasang (Installed Apps)', 'Installed Store Apps')}</span>
                    <span>{storeApps.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {storeApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => openApp(app.id)}
                        onContextMenu={(e) => handleAppRightClick(e, app.id)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-center"
                      >
                        <AppIcon icon={app.icon} appId={app.id} size="md" />
                        <span className="text-[11px] font-medium truncate w-full">
                          {app.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Footer Bar */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between text-xs">
          <button
            onClick={() => openApp('settings')}
            className="flex items-center gap-2 text-left hover:opacity-80"
          >
            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center">
              <User size={14} />
            </div>
            <div>
              <div className="font-semibold text-[11px]">
                {account ? account.name : t('Pengguna Tamu', 'Guest User')}
              </div>
              <div className="text-[10px] text-slate-400">
                {account ? t('Tersinkron', 'Synced') : t('Penyimpanan Lokal', 'Local Storage')}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openApp('files')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Files"
            >
              <FolderOpen size={15} />
            </button>
            <button
              onClick={() => openApp('store')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="BrowStore"
            >
              <ShoppingBag size={15} />
            </button>
            <button
              onClick={() => openApp('settings')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={() => {
                setStartMenuOpen(false);
                exportWorkspaceArchive();
              }}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title={t('Ekspor Workspace (.json)', 'Export Workspace (.json)')}
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => {
                setStartMenuOpen(false);
                setIsLocked(true);
              }}
              className="p-2 rounded-lg hover:bg-rose-500/15 text-rose-500"
              title={t('Kunci Sesi', 'Lock Session')}
            >
              <Lock size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Right-Click Context Menu for Start Menu Apps */}
      {appContextMenu && (
        <>
          <div
            className="fixed inset-0 z-[975] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setAppContextMenu(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setAppContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAppContextMenu(null);
            }}
          />

          <div
            ref={contextMenuRef}
            data-context-menu="true"
            style={{ left: appContextMenu.x, top: appContextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed z-[980] w-56 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs text-slate-800 dark:text-slate-100 select-none"
          >
            <button
              onClick={() => {
                openApp(appContextMenu.appId);
                setAppContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
              <span>{t('Buka Aplikasi', 'Open Application')}</span>
            </button>

            <button
              onClick={() => {
                addAppShortcutToDesktop(appContextMenu.appId);
                setAppContextMenu(null);
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Plus size={14} />
                <span>{t('Tambah Shortcut ke Home', 'Add Shortcut to Home')}</span>
              </span>
              {isAppOnDesktop(appContextMenu.appId) && (
                <Check size={12} className="opacity-80 shrink-0" />
              )}
            </button>

            <button
              onClick={() => {
                togglePinToTaskbar(appContextMenu.appId);
                setAppContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Pin size={14} />
              <span>
                {isAppPinnedToTaskbar(appContextMenu.appId)
                  ? t('Lepas Pin dari Taskbar', 'Unpin from Taskbar')
                  : t('Pin ke Taskbar', 'Pin to Taskbar')}
              </span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
