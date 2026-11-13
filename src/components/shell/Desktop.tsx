import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  Plus,
  ShoppingBag,
  Activity,
  Settings,
  FilePlus,
  Edit3,
  Trash2,
  Pin,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useDashboardSelector } from '../../store/DashboardStore';
import { AppIcon } from './AppIcon';
import { BUILTIN_WALLPAPERS } from '../../data/catalog';
import { WindowFrame } from './WindowFrame';
import { DesktopShortcut } from '../../types/os';
import { DashboardWorkspace } from '../dashboard/DashboardWorkspace';

export const Desktop: React.FC = () => {
  const {
    settings,
    files,
    shortcuts,
    windows,
    activeWorkspace,
    allApps,
    installedAppIds,
    getAppById,
    openApp,
    sortDesktopShortcuts,
    addAppShortcutToDesktop,
    isAppOnDesktop,
    updateShortcut,
    removeShortcut,
    togglePinToTaskbar,
    isAppPinnedToTaskbar,
    createFile,
    setStartMenuOpen,
    viewport,
    t,
  } = useOS();

  const showDesktopShortcutsBar = useDashboardSelector(
    (s) => s.showDesktopShortcutsBar
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingShortcutId, setRenamingShortcutId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Context menus
  const [desktopMenu, setDesktopMenu] = useState<{ x: number; y: number } | null>(null);
  const [showAddAppSubmenu, setShowAddAppSubmenu] = useState(false);
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [shortcutMenu, setShortcutMenu] = useState<{
    x: number;
    y: number;
    shortcut: DesktopShortcut;
  } | null>(null);

  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const shortcutMenuRef = useRef<HTMLDivElement | null>(null);

  // Dismiss right-click context menus when clicking anywhere outside the menu box
  useEffect(() => {
    if (!desktopMenu && !shortcutMenu) return;
    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (e.button === 2) return;
      const target = e.target as Node | null;
      if (!target) return;
      const path = e.composedPath ? e.composedPath() : [];

      if (desktopMenu && desktopMenuRef.current) {
        const insideDesktopMenu =
          path.includes(desktopMenuRef.current) ||
          desktopMenuRef.current.contains(target);
        if (!insideDesktopMenu) {
          setDesktopMenu(null);
          setShowAddAppSubmenu(false);
        }
      }

      if (shortcutMenu && shortcutMenuRef.current) {
        const insideShortcutMenu =
          path.includes(shortcutMenuRef.current) ||
          shortcutMenuRef.current.contains(target);
        if (!insideShortcutMenu) {
          setShortcutMenu(null);
        }
      }
    };
    window.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown, true);
  }, [desktopMenu, shortcutMenu]);

  const desktopShortcuts = shortcuts.filter((s) => s.location === 'desktop');
  const workspaceWindows = windows.filter((w) => w.workspaceId === activeWorkspace);

  // Resolve wallpaper CSS or custom OPFS/IndexedDB image
  const customWallpaperFile = settings.customWallpaperFileId
    ? files.find((f) => f.id === settings.customWallpaperFileId)
    : undefined;

  const activeBuiltinWallpaper =
    BUILTIN_WALLPAPERS.find((w) => w.id === settings.wallpaperId) ||
    BUILTIN_WALLPAPERS[0];

  const backgroundStyle: React.CSSProperties =
    customWallpaperFile && customWallpaperFile.content
      ? {
          backgroundImage: `url("${customWallpaperFile.content}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {
          background: activeBuiltinWallpaper.cssBackground,
        };

  const cursorClass =
    settings.customCursor === 'precision'
      ? 'cursor-crosshair'
      : settings.customCursor === 'large'
      ? 'cursor-pointer'
      : 'cursor-default';

  const handleDesktopPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const targetEl = e.target as HTMLElement;

    if (
      (desktopMenuRef.current && desktopMenuRef.current.contains(targetEl)) ||
      (shortcutMenuRef.current && shortcutMenuRef.current.contains(targetEl)) ||
      targetEl.closest('[data-context-menu="true"]') ||
      targetEl.closest('[data-os-modal="true"]') ||
      targetEl.closest('[data-window-frame="true"]')
    ) {
      return;
    }

    setStartMenuOpen(false);
    setDesktopMenu(null);
    setShowAddAppSubmenu(false);
    setShortcutMenu(null);

    if (!targetEl.closest('[data-shortcut-id]')) {
      setSelectedIds([]);
    }
  };

  const handleDesktopContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetEl = e.target as HTMLElement;
    if (
      targetEl.closest('[data-window-frame="true"]') ||
      targetEl.closest('[data-shortcut-id]') ||
      targetEl.closest('[data-context-menu="true"]') ||
      targetEl.closest('[data-os-modal="true"]')
    ) {
      return;
    }
    e.preventDefault();
    setStartMenuOpen(false);
    setShortcutMenu(null);
    setShowAddAppSubmenu(false);
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - 250));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - 310));
    setDesktopMenu({ x, y });
  };

  const handleShortcutContextMenu = (
    sc: DesktopShortcut,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDesktopMenu(null);
    setShowAddAppSubmenu(false);
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - 240));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - 280));
    setShortcutMenu({ x, y, shortcut: sc });
  };

  const handleLaunchShortcut = (sc: DesktopShortcut) => {
    if (sc.customUrl) {
      openApp('browser', {
        url: sc.customUrl,
        customTitle: sc.customName || sc.customUrl,
      });
    } else {
      openApp(sc.appId, { customTitle: sc.customName });
    }
  };

  return (
    <div
      onPointerDown={handleDesktopPointerDown}
      onContextMenu={handleDesktopContextMenu}
      style={backgroundStyle}
      className={`relative w-screen h-[calc(100dvh-52px)] overflow-y-auto overflow-x-hidden select-none ${cursorClass}`}
    >
      {/* Subtle Desktop Text Overlay if user configured one */}
      {settings.desktopLabelText && !viewport.isMobile && (
        <div className="pointer-events-none fixed right-6 bottom-16 text-right z-0">
          <div className="text-sm font-semibold text-white/80 drop-shadow">
            {settings.desktopLabelText}
          </div>
        </div>
      )}

      {/* Desktop App Shortcuts Strip (Preserves OS Shortcuts + Per-App Right-Click Menu) */}
      {showDesktopShortcutsBar && desktopShortcuts.length > 0 && (
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 rounded-2xl border border-white/15 bg-slate-900/45 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 shrink-0 pr-2 border-r border-white/15">
              Pintasan Home
            </span>
            {desktopShortcuts.map((sc) => {
              const app = getAppById(sc.appId);
              const label = sc.customName || app?.name || sc.appId;
              const icon = sc.customUrl ? 'Globe' : app?.icon || 'AppWindow';
              const isSelected = selectedIds.includes(sc.id);

              return (
                <div
                  key={sc.id}
                  data-shortcut-id={sc.id}
                  onClick={() => {
                    setSelectedIds([sc.id]);
                    handleLaunchShortcut(sc);
                  }}
                  onContextMenu={(e) => handleShortcutContextMenu(sc, e)}
                  className={`ws-focusable flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer shrink-0 transition-all ${
                    isSelected
                      ? 'bg-sky-500/30 ring-1 ring-sky-400 text-white'
                      : 'hover:bg-white/15 text-slate-100'
                  }`}
                >
                  <AppIcon icon={icon} appId={sc.appId} size="sm" />
                  {renamingShortcutId === sc.id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateShortcut(sc.id, {
                              customName: renameText.trim() || undefined,
                            });
                            setRenamingShortcutId(null);
                          }
                        }}
                        autoFocus
                        className="w-24 px-1.5 py-0.5 text-[11px] rounded bg-slate-900 text-white border border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateShortcut(sc.id, {
                            customName: renameText.trim() || undefined,
                          });
                          setRenamingShortcutId(null);
                        }}
                        className="text-emerald-400"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modular Widget Dashboard Workspace (Bagian A, B, C, D) */}
      <DashboardWorkspace />

      {/* Active Workspace Windows */}
      {workspaceWindows.map((win) => (
        <WindowFrame key={win.id} win={win} />
      ))}

      {/* Desktop Right-Click Context Menu */}
      {desktopMenu && (
        <>
          <div
            className="fixed inset-0 z-[895] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setDesktopMenu(null);
              setShowAddAppSubmenu(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setDesktopMenu(null);
              setShowAddAppSubmenu(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDesktopMenu(null);
              setShowAddAppSubmenu(false);
            }}
          />

          <div
            ref={desktopMenuRef}
            data-context-menu="true"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ left: desktopMenu.x, top: desktopMenu.y }}
            className="fixed z-[900] w-60 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs text-slate-800 dark:text-slate-100"
          >
            <div className="px-3.5 py-1.5 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t('Menu Desktop', 'Desktop Menu')}
            </div>

            <button
              onClick={() => setShowAddAppSubmenu((s) => !s)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 font-semibold hover:bg-sky-500 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Plus size={14} />
                <span>{t('Tambah Shortcut Aplikasi ke Home', 'Add App Shortcut to Home')}</span>
              </span>
              <ChevronRight
                size={13}
                className={`transition-transform ${showAddAppSubmenu ? 'rotate-90' : ''}`}
              />
            </button>

            {showAddAppSubmenu && (
              <div className="max-h-48 overflow-y-auto bg-slate-50/90 dark:bg-slate-950/80 border-y border-slate-200 dark:border-slate-800 py-1 px-1.5 space-y-0.5">
                {allApps
                  .filter((a) => installedAppIds.includes(a.id))
                  .map((app) => {
                    const alreadyOnHome = isAppOnDesktop(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          addAppShortcutToDesktop(app.id);
                          setDesktopMenu(null);
                          setShowAddAppSubmenu(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white transition-colors text-left"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <AppIcon icon={app.icon} appId={app.id} size="sm" />
                          <span className="truncate font-medium">{app.name}</span>
                        </span>
                        {alreadyOnHome && (
                          <span className="text-[10px] opacity-75 shrink-0">
                            {t('Ada di Home', 'On Home')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                <button
                  onClick={() => {
                    setDesktopMenu(null);
                    setShowAddAppSubmenu(false);
                    setShowAddAppModal(true);
                  }}
                  className="w-full text-center py-1.5 text-[11px] font-semibold text-sky-500 hover:underline"
                >
                  {t('Lihat Semua Aplikasi...', 'View All Applications...')}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                sortDesktopShortcuts('name');
                setDesktopMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <ArrowUpDown size={14} />
              <span>{t('Urutkan Ikon (A–Z)', 'Sort Icons (A–Z)')}</span>
            </button>

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            <button
              onClick={async () => {
                setDesktopMenu(null);
                const f = await createFile(
                  `Catatan-Desktop-${Date.now().toString().slice(-3)}.md`,
                  'folder-documents',
                  '# Catatan Cepat Desktop\n\n',
                  'text/markdown'
                );
                openApp('notepad', { fileId: f.id, customTitle: `Notepad — ${f.name}` });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <FilePlus size={14} />
              <span>{t('Buat Catatan Baru', 'New Text Note')}</span>
            </button>

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            <button
              onClick={() => {
                setDesktopMenu(null);
                openApp('store');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <ShoppingBag size={14} />
              <span>{t('Buka BrowStore', 'Open BrowStore')}</span>
            </button>

            <button
              onClick={() => {
                setDesktopMenu(null);
                openApp('task-manager');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Activity size={14} />
              <span>Task Manager</span>
            </button>

            <button
              onClick={() => {
                setDesktopMenu(null);
                openApp('settings');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Settings size={14} />
              <span>{t('Personalisasi & Pengaturan', 'Personalize & Settings')}</span>
            </button>
          </div>
        </>
      )}

      {/* Shortcut Right-Click Context Menu (Per-App Differentiated Menu) */}
      {shortcutMenu && (
        <>
          <div
            className="fixed inset-0 z-[895] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setShortcutMenu(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShortcutMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShortcutMenu(null);
            }}
          />

          <div
            ref={shortcutMenuRef}
            data-context-menu="true"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ left: shortcutMenu.x, top: shortcutMenu.y }}
            className="fixed z-[900] w-56 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs text-slate-800 dark:text-slate-100"
          >
            {(() => {
              const scApp = getAppById(shortcutMenu.shortcut.appId);
              const scName =
                shortcutMenu.shortcut.customName ||
                scApp?.name ||
                shortcutMenu.shortcut.appId;
              return (
                <>
                  <div className="px-3.5 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <AppIcon
                      icon={scApp?.icon || 'AppWindow'}
                      appId={shortcutMenu.shortcut.appId}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="font-bold truncate">{scName}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {scApp?.category || 'Application'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleLaunchShortcut(shortcutMenu.shortcut);
                      setShortcutMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    <span>
                      {t('Buka', 'Open')} {scName}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      openApp(shortcutMenu.shortcut.appId, {
                        customTitle: `${scName} (#${Date.now().toString().slice(-2)})`,
                      });
                      setShortcutMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    <Plus size={13} />
                    <span>
                      {t('Buka Jendela Baru', 'Open in New Window')}
                    </span>
                  </button>

                  {shortcutMenu.shortcut.appId === 'notepad' && (
                    <button
                      onClick={async () => {
                        setShortcutMenu(null);
                        const f = await createFile(
                          `Catatan-${Date.now().toString().slice(-3)}.md`,
                          'folder-documents',
                          '# Catatan Baru\n\n',
                          'text/markdown'
                        );
                        openApp('notepad', {
                          fileId: f.id,
                          customTitle: `Notepad — ${f.name}`,
                        });
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
                    >
                      <FilePlus size={13} />
                      <span>{t('Buat Catatan Kosong Baru', 'Create New Blank Note')}</span>
                    </button>
                  )}
                </>
              );
            })()}

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            <button
              onClick={() => {
                addAppShortcutToDesktop(shortcutMenu.shortcut.appId);
                setShortcutMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Plus size={13} />
              <span>{t('Gandakan Shortcut ke Home', 'Duplicate Shortcut to Home')}</span>
            </button>

            <button
              onClick={() => {
                togglePinToTaskbar(shortcutMenu.shortcut.appId);
                setShortcutMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Pin size={13} />
              <span>
                {isAppPinnedToTaskbar(shortcutMenu.shortcut.appId)
                  ? t('Lepas Pin dari Taskbar', 'Unpin from Taskbar')
                  : t('Pin ke Taskbar', 'Pin to Taskbar')}
              </span>
            </button>

            <button
              onClick={() => {
                const app = getAppById(shortcutMenu.shortcut.appId);
                setRenamingShortcutId(shortcutMenu.shortcut.id);
                setRenameText(
                  shortcutMenu.shortcut.customName || app?.name || shortcutMenu.shortcut.appId
                );
                setShortcutMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Edit3 size={13} />
              <span>{t('Ubah Nama Shortcut', 'Rename Shortcut')}</span>
            </button>

            <button
              onClick={() => {
                removeShortcut(shortcutMenu.shortcut.id);
                setShortcutMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
            >
              <Trash2 size={13} />
              <span>{t('Hapus Shortcut', 'Remove Shortcut')}</span>
            </button>
          </div>
        </>
      )}

      {/* Add App Shortcut to Home Picker Modal */}
      {showAddAppModal && (
        <div
          data-os-modal="true"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setShowAddAppModal(false)}
          className="fixed inset-0 z-[950] bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {t('Tambah Shortcut Aplikasi ke Home', 'Add Application Shortcut to Home')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAppModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
              {allApps.map((app) => {
                const onHome = isAppOnDesktop(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      addAppShortcutToDesktop(app.id);
                      setShowAddAppModal(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-slate-50/60 dark:bg-slate-800/40 text-left transition-colors"
                  >
                    <AppIcon icon={app.icon} appId={app.id} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{app.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {onHome
                          ? t('Sudah ada di Home (+Tambah)', 'On Home (+Add)')
                          : t('Klik untuk tambah', 'Click to add')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
