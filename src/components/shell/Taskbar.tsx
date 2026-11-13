import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Pin,
  X,
  Minus,
  Home,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { TaskbarButtonVisibility } from '../../types/os';
import { DEFAULT_SETTINGS } from '../../data/catalog';
import { AppIcon } from './AppIcon';

type SystemButtonKey = Exclude<keyof TaskbarButtonVisibility, 'hiddenAppIds'>;

export const Taskbar: React.FC = () => {
  const {
    settings,
    updateSettings,
    shortcuts,
    windows,
    activeWindowId,
    activeWorkspace,
    setActiveWorkspace,
    getAppById,
    openApp,
    focusWindow,
    minimizeWindow,
    closeWindow,
    isAppPinnedToTaskbar,
    togglePinToTaskbar,
    addAppShortcutToDesktop,
    startMenuOpen,
    setStartMenuOpen,
    setCommandPaletteOpen,
    setWhatsNewOpen,
    notifications,
    clearNotifications,
    minimizeAllWindows,
    t,
  } = useOS();

  const [now, setNow] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [showCustomizeSubmenu, setShowCustomizeSubmenu] = useState(false);
  const [taskbarMenu, setTaskbarMenu] = useState<{
    x: number;
    y: number;
    appId?: string;
    windowId?: string;
    systemButtonKey?: SystemButtonKey;
    systemButtonLabel?: string;
  } | null>(null);

  const taskbarMenuRef = useRef<HTMLDivElement>(null);
  const customizeMenuRef = useRef<HTMLDivElement>(null);
  const notifsMenuRef = useRef<HTMLDivElement>(null);
  const notifsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Dismiss right-click context menu, customize modal, and Win11 notification/calendar flyout when clicking outside
  useEffect(() => {
    if (!taskbarMenu && !customizeOpen && !showNotifs) return;

    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (e.button === 2) return;
      const target = e.target as Node | null;
      if (!target) return;
      const path = e.composedPath ? e.composedPath() : [];

      if (taskbarMenu && taskbarMenuRef.current) {
        const insideTaskbarMenu =
          path.includes(taskbarMenuRef.current) ||
          taskbarMenuRef.current.contains(target);
        if (!insideTaskbarMenu) {
          setTaskbarMenu(null);
          setShowCustomizeSubmenu(false);
        }
      }

      if (customizeOpen && customizeMenuRef.current) {
        const insideCustomizeMenu =
          path.includes(customizeMenuRef.current) ||
          customizeMenuRef.current.contains(target);
        if (!insideCustomizeMenu) {
          setCustomizeOpen(false);
        }
      }

      if (showNotifs && notifsMenuRef.current) {
        const insideNotifsMenu =
          path.includes(notifsMenuRef.current) ||
          notifsMenuRef.current.contains(target);
        const insideNotifsBtn = Boolean(
          notifsBtnRef.current &&
            (path.includes(notifsBtnRef.current) ||
              notifsBtnRef.current.contains(target))
        );
        if (!insideNotifsMenu && !insideNotifsBtn) {
          setShowNotifs(false);
        }
      }
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [taskbarMenu, customizeOpen, showNotifs]);

  const tbVisibility: TaskbarButtonVisibility = {
    ...DEFAULT_SETTINGS.taskbarButtons,
    ...(settings.taskbarButtons || {}),
    hiddenAppIds: settings.taskbarButtons?.hiddenAppIds || [],
  };

  const toggleSystemButton = (key: SystemButtonKey) => {
    updateSettings({
      taskbarButtons: {
        ...tbVisibility,
        [key]: !tbVisibility[key],
      },
    });
  };

  const toggleAppButtonVisibility = (appId: string) => {
    const exists = tbVisibility.hiddenAppIds.includes(appId);
    const nextHidden = exists
      ? tbVisibility.hiddenAppIds.filter((id) => id !== appId)
      : [...tbVisibility.hiddenAppIds, appId];

    updateSettings({
      taskbarButtons: {
        ...tbVisibility,
        hiddenAppIds: nextHidden,
      },
    });
  };

  const resetAllTaskbarButtons = () => {
    updateSettings({
      taskbarButtons: {
        ...DEFAULT_SETTINGS.taskbarButtons,
        hiddenAppIds: [],
      },
    });
  };

  const pinnedAppIds = shortcuts
    .filter((s) => s.location === 'taskbar')
    .map((s) => s.appId);

  const runningWorkspaceWindows = windows.filter(
    (w) => w.workspaceId === activeWorkspace
  );

  // Merge pinned apps + currently running apps on this workspace
  const allTaskbarAppIds = Array.from(
    new Set([
      ...pinnedAppIds,
      ...runningWorkspaceWindows.map((w) => w.appId),
    ])
  );

  const visibleAppIds = allTaskbarAppIds.filter(
    (appId) => !tbVisibility.hiddenAppIds.includes(appId)
  );

  const handleTaskbarAppClick = (appId: string) => {
    setTaskbarMenu(null);
    setShowCustomizeSubmenu(false);
    const appWindows = runningWorkspaceWindows.filter((w) => w.appId === appId);
    if (appWindows.length === 0) {
      openApp(appId);
      return;
    }
    const topWin = [...appWindows].sort((a, b) => b.zIndex - a.zIndex)[0];
    if (topWin.id === activeWindowId && topWin.status !== 'minimized') {
      minimizeWindow(topWin.id);
    } else {
      focusWindow(topWin.id);
    }
  };

  const openContextMenuAt = (
    e: React.MouseEvent,
    extra?: {
      appId?: string;
      windowId?: string;
      systemButtonKey?: SystemButtonKey;
      systemButtonLabel?: string;
    }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCustomizeSubmenu(false);
    setShowNotifs(false);
    setTaskbarMenu({
      x: Math.min(Math.max(8, e.clientX), window.innerWidth - 265),
      y: Math.max(8, Math.min(e.clientY - 12, window.innerHeight - 64)),
      ...extra,
    });
  };

  const systemButtonItems: { key: SystemButtonKey; label: string }[] = [
    { key: 'start', label: t('Tombol Start', 'Start Button') },
    { key: 'home', label: t('Tombol Home / Desktop', 'Home / Show Desktop') },
    { key: 'search', label: t('Tombol Cari (Ctrl+K)', 'Search / Command Palette') },
    { key: 'workspaces', label: t('Virtual Desktop (D1–D3)', 'Virtual Desktops (D1–D3)') },
    { key: 'apps', label: t('Daftar Aplikasi Taskbar', 'Taskbar App List') },
    { key: 'whatsNew', label: t("Tombol What's New (v1.0)", "What's New (v1.0)") },
    { key: 'language', label: t('Tombol Bahasa (ID/EN)', 'Language Switcher (ID/EN)') },
    { key: 'theme', label: t('Tombol Tema Gelap/Terang', 'Dark/Light Theme Button') },
    { key: 'clock', label: t('Jam & Tanggal (Win11)', 'Clock & Date (Win11)') },
    { key: 'notifications', label: t('Ikon Notifikasi (Win11)', 'Notification Bell (Win11)') },
  ];

  const hiddenCount =
    systemButtonItems.filter((item) => !tbVisibility[item.key]).length +
    tbVisibility.hiddenAppIds.length;

  const isAutoDock = settings.taskbarWidth === 'auto';

  // Build Windows 11 Calendar Grid for calendarMonth
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: { day: number; currentMonth: boolean; isToday: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      isToday: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === now.getDate() &&
      month === now.getMonth() &&
      year === now.getFullYear();
    calendarCells.push({ day: d, currentMonth: true, isToday });
  }
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({
      day: calendarCells.length - (firstDayOfWeek + daysInMonth) + 1,
      currentMonth: false,
      isToday: false,
    });
  }

  const dayHeaders =
    settings.language === 'id'
      ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <>
      <header
        onContextMenu={(e) => openContextMenuAt(e)}
        className={`fixed bottom-0 left-0 right-0 h-[52px] z-[920] flex items-center justify-between px-3 select-none ${
          isAutoDock ? 'pointer-events-none justify-center' : ''
        } ${
          !isAutoDock
            ? settings.glassTransparency
              ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90'
              : 'bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800'
            : ''
        }`}
      >
        <div
          onContextMenu={(e) => openContextMenuAt(e)}
          className={`flex items-center justify-between gap-2 sm:gap-3 ${
            isAutoDock
              ? 'pointer-events-auto px-3 py-1.5 mb-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl'
              : 'w-full'
          }`}
        >
          {/* Left Zone: Start Button, Home, Search Command Palette, Virtual Desktops */}
          <div className="flex items-center gap-1.5 shrink-0">
            {tbVisibility.start && (
              <button
                data-start-button="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartMenuOpen((s) => !s);
                  setShowNotifs(false);
                  setCustomizeOpen(false);
                }}
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'start',
                    systemButtonLabel: t('Tombol Start', 'Start Button'),
                  })
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  startMenuOpen
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <LayoutGrid
                  size={15}
                  className={startMenuOpen ? 'text-white' : 'text-sky-500'}
                />
                <span className="hidden xs:inline">Start</span>
              </button>
            )}

            {tbVisibility.home && (
              <button
                onClick={minimizeAllWindows}
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'home',
                    systemButtonLabel: t('Tombol Home / Desktop', 'Home / Show Desktop'),
                  })
                }
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 transition-colors shrink-0"
                title={t('Tampilkan Desktop / Home', 'Show Desktop / Home')}
              >
                <Home size={14} />
              </button>
            )}

            {tbVisibility.search && (
              <button
                onClick={() => setCommandPaletteOpen(true)}
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'search',
                    systemButtonLabel: t('Tombol Cari', 'Search Button'),
                  })
                }
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 transition-colors whitespace-nowrap shrink-0"
                title="Command Palette (Ctrl+K)"
              >
                <Search size={13} />
                <span className="hidden md:inline">{t('Cari / Perintah', 'Search')}</span>
                <kbd className="hidden sm:inline text-[10px] font-mono opacity-75">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Virtual Desktops (F14) */}
            {tbVisibility.workspaces && (
              <div
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'workspaces',
                    systemButtonLabel: t(
                      'Virtual Desktop (D1–D3)',
                      'Virtual Desktops (D1–D3)'
                    ),
                  })
                }
                className="hidden md:flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
              >
                {[1, 2, 3].map((ws) => {
                  const count = windows.filter((w) => w.workspaceId === ws).length;
                  const active = activeWorkspace === ws;
                  return (
                    <button
                      key={ws}
                      onClick={() => setActiveWorkspace(ws)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono tabular-nums font-semibold transition-colors ${
                        active
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={`Virtual Desktop ${ws} (${count} windows)`}
                    >
                      D{ws}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center Zone: Pinned & Running Applications */}
          {tbVisibility.apps && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {visibleAppIds.map((appId) => {
                const app = getAppById(appId);
                if (!app) return null;
                const appWins = runningWorkspaceWindows.filter(
                  (w) => w.appId === appId
                );
                const isRunning = appWins.length > 0;
                const isFocused = appWins.some(
                  (w) => w.id === activeWindowId && w.status !== 'minimized'
                );

                return (
                  <button
                    key={appId}
                    onClick={() => handleTaskbarAppClick(appId)}
                    onContextMenu={(e) =>
                      openContextMenuAt(e, {
                        appId,
                        windowId: appWins[0]?.id,
                      })
                    }
                    title={app.name}
                    className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      isFocused
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30'
                        : isRunning
                        ? 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <AppIcon icon={app.icon} appId={app.id} size="sm" />
                    <span className="hidden lg:inline truncate max-w-[100px]">
                      {app.name}
                    </span>
                    {isRunning && (
                      <span
                        className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all ${
                          isFocused ? 'w-4 bg-sky-500' : 'w-1.5 bg-slate-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right System Tray Zone */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* What's New Button */}
            {tbVisibility.whatsNew && (
              <button
                onClick={() => setWhatsNewOpen(true)}
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'whatsNew',
                    systemButtonLabel: t("Tombol What's New (v1.0)", "What's New (v1.0)"),
                  })
                }
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors whitespace-nowrap shrink-0"
                title="What's New v1.0"
              >
                <Sparkles size={12} />
                <span className="hidden xl:inline">v1.0</span>
              </button>
            )}

            {/* Language Switcher (ID/EN) */}
            {tbVisibility.language && (
              <button
                onClick={() =>
                  updateSettings({
                    language: settings.language === 'id' ? 'en' : 'id',
                  })
                }
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'language',
                    systemButtonLabel: t('Tombol Bahasa (ID/EN)', 'Language Button'),
                  })
                }
                className="px-2 py-1.5 rounded-xl text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title={t('Ganti Bahasa (ID / EN)', 'Switch Language (ID / EN)')}
              >
                {settings.language.toUpperCase()}
              </button>
            )}

            {/* Quick Theme Switcher */}
            {tbVisibility.theme && (
              <button
                onClick={() =>
                  updateSettings({
                    theme: settings.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: 'theme',
                    systemButtonLabel: t('Tombol Tema Gelap/Terang', 'Theme Button'),
                  })
                }
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title={t('Ubah Tema Gelap/Terang', 'Toggle Dark/Light Theme')}
              >
                {settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}

            {/* Windows 11-Style Combined Date/Time + Notification Bell Button */}
            {(tbVisibility.clock || tbVisibility.notifications) && (
              <button
                ref={notifsBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifs((s) => !s);
                  setCustomizeOpen(false);
                  setStartMenuOpen(false);
                  setTaskbarMenu(null);
                }}
                onContextMenu={(e) =>
                  openContextMenuAt(e, {
                    systemButtonKey: tbVisibility.clock ? 'clock' : 'notifications',
                    systemButtonLabel: t(
                      'Jam & Notifikasi',
                      'Clock & Notifications'
                    ),
                  })
                }
                className={`flex items-center gap-2.5 px-2.5 py-1 rounded-xl border transition-colors shrink-0 ${
                  showNotifs
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400'
                    : 'bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
                title={t(
                  'Kalender, Jam & Pusat Notifikasi (Gaya Windows 11)',
                  'Calendar, Clock & Notification Center (Windows 11 Style)'
                )}
              >
                {tbVisibility.clock && (
                  <div className="text-right leading-tight">
                    <div className="text-[11px] font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {now.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        ...(settings.showClockSeconds ? { second: '2-digit' } : {}),
                      })}
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {now.toLocaleDateString(
                        settings.language === 'id' ? 'id-ID' : 'en-US',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </div>
                  </div>
                )}

                {tbVisibility.notifications && (
                  <div className="relative flex items-center justify-center">
                    <Bell size={14} className="text-slate-600 dark:text-slate-300" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[14px] h-[14px] rounded-full bg-sky-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Taskbar Right-Click Context Menu (Supports Customize Taskbar directly on right-click) */}
      {taskbarMenu && (
        <>
          <div
            className="fixed inset-0 z-[955] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setTaskbarMenu(null);
              setShowCustomizeSubmenu(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setTaskbarMenu(null);
              setShowCustomizeSubmenu(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTaskbarMenu(null);
              setShowCustomizeSubmenu(false);
            }}
          />

          <div
            ref={taskbarMenuRef}
            data-context-menu="true"
            style={{
              left: taskbarMenu.x,
              bottom: Math.max(58, window.innerHeight - taskbarMenu.y),
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed z-[960] w-64 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs text-slate-800 dark:text-slate-100 select-none"
          >
          {taskbarMenu.appId && (
            <>
              <button
                onClick={() => {
                  addAppShortcutToDesktop(taskbarMenu.appId!);
                  setTaskbarMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
              >
                <Plus size={13} />
                <span>{t('Tambah Shortcut ke Home', 'Add Shortcut to Home')}</span>
              </button>

              <button
                onClick={() => {
                  togglePinToTaskbar(taskbarMenu.appId!);
                  setTaskbarMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
              >
                <Pin size={13} />
                <span>
                  {isAppPinnedToTaskbar(taskbarMenu.appId)
                    ? t('Lepas Pin dari Taskbar', 'Unpin from Taskbar')
                    : t('Pin ke Taskbar', 'Pin to Taskbar')}
                </span>
              </button>

              <button
                onClick={() => {
                  toggleAppButtonVisibility(taskbarMenu.appId!);
                  setTaskbarMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
              >
                <EyeOff size={13} />
                <span>
                  {t('Sembunyikan Tombol Ini', 'Hide This Button from Taskbar')}
                </span>
              </button>

              {taskbarMenu.windowId && (
                <>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      minimizeWindow(taskbarMenu.windowId!);
                      setTaskbarMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    <Minus size={13} />
                    <span>{t('Minimalkan Jendela', 'Minimize Window')}</span>
                  </button>
                  <button
                    onClick={() => {
                      closeWindow(taskbarMenu.windowId!);
                      setTaskbarMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X size={13} />
                    <span>{t('Tutup Jendela', 'Close Window')}</span>
                  </button>
                </>
              )}
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
            </>
          )}

          {taskbarMenu.systemButtonKey && (
            <>
              <button
                onClick={() => {
                  toggleSystemButton(taskbarMenu.systemButtonKey!);
                  setTaskbarMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
              >
                <EyeOff size={13} />
                <span>
                  {t('Sembunyikan', 'Hide')} {taskbarMenu.systemButtonLabel}
                </span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
            </>
          )}

          {/* Expandable Customize Taskbar Submenu directly in right-click menu */}
          <button
            onClick={() => setShowCustomizeSubmenu((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2 font-semibold hover:bg-sky-500 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <SlidersHorizontal size={13} />
              <span>
                {t('Kustomisasi Tombol Taskbar', 'Customize Taskbar Buttons')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              {hiddenCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-mono">
                  {hiddenCount}
                </span>
              )}
              <ChevronRight
                size={13}
                className={`transition-transform ${
                  showCustomizeSubmenu ? 'rotate-90' : ''
                }`}
              />
            </span>
          </button>

          {showCustomizeSubmenu && (
            <div className="max-h-60 overflow-y-auto bg-slate-50/95 dark:bg-slate-950/90 border-y border-slate-200 dark:border-slate-800 py-1.5 px-1.5 space-y-1">
              <div className="flex items-center justify-between px-2 py-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t('Tombol Sistem', 'System Buttons')}
                </span>
                {hiddenCount > 0 && (
                  <button
                    onClick={resetAllTaskbarButtons}
                    className="text-[10px] font-semibold text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} />
                    <span>{t('Tampilkan Semua', 'Show All')}</span>
                  </button>
                )}
              </div>

              {systemButtonItems.map((item) => {
                const visible = tbVisibility[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleSystemButton(item.key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <span
                      className={
                        visible
                          ? 'font-medium truncate'
                          : 'text-slate-400 line-through truncate'
                      }
                    >
                      {item.label}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        visible
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                      <span>
                        {visible ? t('Tampil', 'Shown') : t('Sembunyi', 'Hidden')}
                      </span>
                    </span>
                  </button>
                );
              })}

              {allTaskbarAppIds.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    {t('Tombol Aplikasi', 'App Buttons')}
                  </div>
                  {allTaskbarAppIds.map((appId) => {
                    const app = getAppById(appId);
                    if (!app) return null;
                    const isHidden = tbVisibility.hiddenAppIds.includes(appId);
                    return (
                      <button
                        key={appId}
                        onClick={() => toggleAppButtonVisibility(appId)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors text-left"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <AppIcon icon={app.icon} appId={app.id} size="sm" />
                          <span
                            className={
                              !isHidden
                                ? 'font-medium truncate'
                                : 'text-slate-400 line-through truncate'
                            }
                          >
                            {app.name}
                          </span>
                        </span>
                        <span
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            !isHidden
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {!isHidden ? <Eye size={10} /> : <EyeOff size={10} />}
                          <span>
                            {!isHidden ? t('Tampil', 'Shown') : t('Sembunyi', 'Hidden')}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setTaskbarMenu(null);
              setShowCustomizeSubmenu(false);
              setCustomizeOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors"
          >
            <Eye size={13} />
            <span>
              {t('Buka Panel Kustomisasi Taskbar...', 'Open Customize Taskbar Panel...')}
            </span>
          </button>
          </div>
        </>
      )}

      {/* Full Customize Taskbar Buttons Modal/Flyout */}
      {customizeOpen && (
        <>
          <div
            className="fixed inset-0 z-[955] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setCustomizeOpen(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setCustomizeOpen(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCustomizeOpen(false);
            }}
          />

          <div
            ref={customizeMenuRef}
            data-context-menu="true"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed bottom-14 right-3 left-3 sm:left-auto sm:w-80 z-[960] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 space-y-3 text-xs text-slate-900 dark:text-slate-100 select-none"
          >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div>
              <div className="font-bold">
                {t('Kustomisasi Tombol Taskbar', 'Customize Taskbar Buttons')}
              </div>
              <div className="text-[10px] text-slate-400">
                {t(
                  'Tampilkan atau sembunyikan semua tombol di taskbar',
                  'Show or hide any button on the taskbar'
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hiddenCount > 0 && (
                <button
                  onClick={resetAllTaskbarButtons}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-500 hover:bg-sky-500/25 text-[11px] font-medium"
                  title={t('Tampilkan Semua Tombol', 'Show All Buttons')}
                >
                  <RotateCcw size={11} />
                  <span>{t('Reset', 'Reset')}</span>
                </button>
              )}
              <button
                onClick={() => setCustomizeOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                {t('Tombol Sistem & Navigasi', 'System & Navigation Buttons')}
              </div>
              {systemButtonItems.map((item) => {
                const visible = tbVisibility[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleSystemButton(item.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <span className={visible ? 'font-medium' : 'text-slate-400 line-through'}>
                      {item.label}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                        visible
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      <span>
                        {visible ? t('Tampil', 'Shown') : t('Sembunyi', 'Hidden')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {allTaskbarAppIds.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  {t('Tombol Aplikasi di Taskbar', 'App Buttons on Taskbar')}
                </div>
                {allTaskbarAppIds.map((appId) => {
                  const app = getAppById(appId);
                  if (!app) return null;
                  const isHidden = tbVisibility.hiddenAppIds.includes(appId);
                  return (
                    <button
                      key={appId}
                      onClick={() => toggleAppButtonVisibility(appId)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <AppIcon icon={app.icon} appId={app.id} size="sm" />
                        <span
                          className={
                            !isHidden
                              ? 'font-medium truncate'
                              : 'text-slate-400 line-through truncate'
                          }
                        >
                          {app.name}
                        </span>
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0 ${
                          !isHidden
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {!isHidden ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span>
                          {!isHidden ? t('Tampil', 'Shown') : t('Sembunyi', 'Hidden')}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </>
      )}

      {/* Windows 11-Style Combined Notification Center & Calendar/Clock Flyout */}
      {showNotifs && (
        <>
          <div
            className="fixed inset-0 z-[945] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setShowNotifs(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifs(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowNotifs(false);
            }}
          />

          <div
            ref={notifsMenuRef}
            data-context-menu="true"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed bottom-14 right-3 left-3 sm:left-auto sm:w-[340px] z-[950] flex flex-col gap-2.5 text-xs text-slate-900 dark:text-slate-100 select-none"
          >
          {/* Top Card: Windows 11 Notification Center */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold">
                {t('Notifikasi', 'Notifications')}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[11px] text-sky-500 hover:underline font-medium"
                >
                  {t('Bersihkan Semua', 'Clear All')}
                </button>
              )}
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <p className="text-slate-400 py-5 text-center">
                  {t('Tidak ada notifikasi baru', 'No new notifications')}
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Card: Windows 11 Calendar & Live Clock */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 space-y-3">
            {/* Full Date & Clock Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize">
                  {now.toLocaleDateString(
                    settings.language === 'id' ? 'id-ID' : 'en-US',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNotifs(false);
                  openApp('clock');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 font-medium text-[11px]"
                title={t('Buka Aplikasi Jam & Timer', 'Open Clock & Timer App')}
              >
                <Clock size={13} />
                <span>{t('Aplikasi Jam', 'Clock App')}</span>
              </button>
            </div>

            {/* Month Switcher */}
            <div className="flex items-center justify-between px-1">
              <span className="font-bold text-xs capitalize">
                {calendarMonth.toLocaleDateString(
                  settings.language === 'id' ? 'id-ID' : 'en-US',
                  { month: 'long', year: 'numeric' }
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCalendarMonth(new Date(year, month - 1, 1))
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title={t('Bulan Sebelumnya', 'Previous Month')}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  className="px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-sky-500"
                >
                  {t('Hari Ini', 'Today')}
                </button>
                <button
                  onClick={() =>
                    setCalendarMonth(new Date(year, month + 1, 1))
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title={t('Bulan Berikutnya', 'Next Month')}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* 7-Column Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayHeaders.map((dh) => (
                <div
                  key={dh}
                  className="text-[10px] font-semibold text-slate-400 py-1"
                >
                  {dh}
                </div>
              ))}
              {calendarCells.map((cell, idx) => (
                <div
                  key={idx}
                  className={`h-7 flex items-center justify-center rounded-full text-[11px] font-mono tabular-nums ${
                    cell.isToday
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : cell.currentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          </div>
          </div>
        </>
      )}
    </>
  );
};
