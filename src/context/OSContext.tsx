import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  AppManifest,
  AppOpenMode,
  DesktopShortcut,
  OSSettings,
  SnapPosition,
  SystemNotification,
  UserAccount,
  VFSFile,
  WindowState,
  WorkspaceArchive,
} from '../types/os';
import {
  APP_CATALOG,
  APP_VERSION,
  DEFAULT_INSTALLED_APP_IDS,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
} from '../data/catalog';
import {
  createDefaultShortcuts,
  createSeedFiles,
  idbClearAll,
  idbDeleteFile,
  idbPutFile,
  idbSet,
  loadInitialOSData,
  playSystemSound,
} from '../services/storage';

interface OSContextValue {
  isBooting: boolean;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  settings: OSSettings;
  updateSettings: (partial: Partial<OSSettings>) => void;
  cycleWallpaper: () => void;
  activeWorkspace: number;
  setActiveWorkspace: (ws: number) => void;

  // App Registry & Store
  allApps: AppManifest[];
  installedAppIds: string[];
  customApps: AppManifest[];
  getAppById: (id: string) => AppManifest | undefined;
  installApp: (appId: string) => void;
  uninstallApp: (appId: string, deleteData?: boolean) => void;
  registerCustomApp: (manifest: AppManifest) => void;

  // Window Manager API
  windows: WindowState[];
  activeWindowId: string | null;
  openApp: (
    appId: string,
    payload?: { fileId?: string; url?: string; customTitle?: string; forceMode?: AppOpenMode }
  ) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  toggleMaximizeWindow: (windowId: string) => void;
  setWindowBounds: (
    windowId: string,
    bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>
  ) => void;
  snapWindow: (windowId: string, snap: SnapPosition) => void;
  reloadWindow: (windowId: string) => void;
  moveWindowToWorkspace: (windowId: string, workspaceId: number) => void;

  // Shortcuts (Desktop & Taskbar)
  shortcuts: DesktopShortcut[];
  addDesktopShortcut: (shortcut: Omit<DesktopShortcut, 'id'>) => void;
  updateShortcut: (id: string, partial: Partial<DesktopShortcut>) => void;
  removeShortcut: (id: string) => void;
  sortDesktopShortcuts: (by: 'name' | 'category') => void;
  isAppPinnedToTaskbar: (appId: string) => boolean;
  togglePinToTaskbar: (appId: string) => void;
  isAppOnDesktop: (appId: string) => boolean;
  addAppShortcutToDesktop: (appId: string) => void;

  // Virtual File System (VFS)
  files: VFSFile[];
  createFolder: (name: string, parentId: string | null) => Promise<VFSFile>;
  createFile: (
    name: string,
    parentId: string | null,
    content: string,
    mimeType?: string
  ) => Promise<VFSFile>;
  updateFileContent: (fileId: string, content: string) => Promise<void>;
  saveFileSnapshot: (fileId: string, label: string) => Promise<void>;
  restoreFileSnapshot: (fileId: string, snapshotId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, targetParentId: string | null) => Promise<void>;
  trashFile: (fileId: string) => Promise<void>;
  restoreFile: (fileId: string) => Promise<void>;
  deleteFilePermanently: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Account, Sync & Workspace Export/Import
  account: UserAccount | null;
  loginAccount: (name: string, email: string) => void;
  logoutAccount: () => void;
  syncWorkspaceNow: () => void;
  exportWorkspaceArchive: () => void;
  importWorkspaceArchive: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  resetEntireWorkspace: () => Promise<void>;

  // UI Overlays & Notifications
  startMenuOpen: boolean;
  setStartMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  whatsNewOpen: boolean;
  setWhatsNewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: SystemNotification[];
  notify: (title: string, message: string, appId?: string) => void;
  clearNotifications: () => void;

  // Responsive Viewport Info
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
  };
  minimizeAllWindows: () => void;

  // I18n helper
  t: (idText: string, enText: string) => string;
}

const OSContext = createContext<OSContextValue | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBooting, setIsBooting] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [settings, setSettings] = useState<OSSettings>(DEFAULT_SETTINGS);
  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [viewport, setViewport] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1366;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    return {
      width: w,
      height: h,
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
    };
  });

  const [installedAppIds, setInstalledAppIds] = useState<string[]>(DEFAULT_INSTALLED_APP_IDS);
  const [customApps, setCustomApps] = useState<AppManifest[]>([]);
  const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>([]);
  const [files, setFiles] = useState<VFSFile[]>([]);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const allApps = useMemo(() => [...APP_CATALOG, ...customApps], [customApps]);

  const getAppById = useCallback(
    (id: string) => allApps.find((a) => a.id === id),
    [allApps]
  );

  const t = useCallback(
    (idText: string, enText: string) => (settings.language === 'id' ? idText : enText),
    [settings.language]
  );

  const notify = useCallback(
    (title: string, message: string, appId?: string) => {
      const item: SystemNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        timestamp: Date.now(),
        read: false,
        appId,
      };
      setNotifications((prev) => [item, ...prev.slice(0, 29)]);
      playSystemSound('notification', settings.bootSound);
    },
    [settings.bootSound]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Load initial state from IndexedDB
  useEffect(() => {
    let mounted = true;
    loadInitialOSData().then((data) => {
      if (!mounted) return;
      setSettings(data.settings);
      setFiles(data.files);
      setShortcuts(data.shortcuts);
      setInstalledAppIds(data.installedAppIds);
      setCustomApps(data.customApps);
      setAccount(data.account);

      if (data.windows.length > 0) {
        setWindows(data.windows);
        const topWin = [...data.windows]
          .filter((w) => w.status !== 'minimized')
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        if (topWin) setActiveWindowId(topWin.id);
      } else {
        // Open Files & Notepad side-by-side on first boot so the desktop feels alive and immediately useful
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1366;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
        const isSmallScreen = vw < 640;
        const initialWindows: WindowState[] = [
          {
            id: 'win-initial-files',
            appId: 'files',
            title: 'Files',
            icon: 'FolderOpen',
            x: isSmallScreen ? 0 : Math.max(16, Math.round(vw * 0.06)),
            y: isSmallScreen ? 0 : Math.max(20, Math.round(vh * 0.07)),
            width: Math.min(760, vw - 24),
            height: Math.min(500, vh - 84),
            minWidth: 320,
            minHeight: 240,
            status: 'minimized',
            zIndex: 10,
            workspaceId: 1,
            openedAt: Date.now() - 2000,
            lastActiveAt: Date.now() - 1000,
            memoryEstimateMB: 18.4,
            responsive: true,
          },
          {
            id: 'win-initial-notepad',
            appId: 'notepad',
            title: 'Notepad — PRD-WebWorkstation.md',
            icon: 'FileText',
            x: isSmallScreen ? 0 : Math.max(24, Math.min(vw - 660, Math.round(vw * 0.4))),
            y: isSmallScreen ? 0 : Math.max(36, Math.round(vh * 0.12)),
            width: Math.min(650, vw - 24),
            height: Math.min(500, vh - 84),
            minWidth: 320,
            minHeight: 240,
            status: 'minimized',
            zIndex: 11,
            workspaceId: 1,
            openedAt: Date.now() - 1000,
            lastActiveAt: Date.now(),
            memoryEstimateMB: 14.2,
            responsive: true,
            payload: { fileId: 'file-prd-md' },
          },
        ];
        setWindows(initialWindows);
        setActiveWindowId(null);
        idbSet('windows', initialWindows);
      }

      const bootDuration = data.settings.bootAnimation ? 650 : 50;
      setTimeout(() => {
        if (!mounted) return;
        setIsBooting(false);
        playSystemSound('boot', data.settings.bootSound);
      }, bootDuration);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync theme to documentElement & follow system preference live (Bagian A.3)
  useEffect(() => {
    const root = document.documentElement;
    const mql =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const applyTheme = () => {
      const isSystemDark = mql ? mql.matches : true;
      const shouldBeDark =
        settings.theme === 'dark' || (settings.theme === 'system' && isSystemDark);

      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    if (mql && settings.theme === 'system') {
      mql.addEventListener('change', applyTheme);
      return () => mql.removeEventListener('change', applyTheme);
    }
  }, [settings.theme]);

  // Responsive viewport resize listener & automatic window clamping
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const taskbarH = 52;
      setViewport({
        width: vw,
        height: vh,
        isMobile: vw < 640,
        isTablet: vw >= 640 && vw < 1024,
      });

      setWindows((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((w) => {
          if (w.status === 'maximized' || w.status === 'minimized') return w;
          const clampedW = Math.max(Math.min(w.minWidth, vw - 16), Math.min(w.width, vw - 16));
          const clampedH = Math.max(
            Math.min(w.minHeight, vh - taskbarH - 16),
            Math.min(w.height, vh - taskbarH - 16)
          );
          const clampedX = Math.max(8, Math.min(w.x, Math.max(8, vw - clampedW - 8)));
          const clampedY = Math.max(8, Math.min(w.y, Math.max(8, vh - taskbarH - clampedH - 8)));

          if (
            clampedW !== w.width ||
            clampedH !== w.height ||
            clampedX !== w.x ||
            clampedY !== w.y
          ) {
            changed = true;
            return {
              ...w,
              width: clampedW,
              height: clampedH,
              x: clampedX,
              y: clampedY,
            };
          }
          return w;
        });
        if (changed) idbSet('windows', next);
        return changed ? next : prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const minimizeAllWindows = useCallback(() => {
    setWindows((prev) => {
      const next = prev.map((w) =>
        w.workspaceId === activeWorkspace ? { ...w, status: 'minimized' as const } : w
      );
      idbSet('windows', next);
      return next;
    });
    setActiveWindowId(null);
    setStartMenuOpen(false);
    setCommandPaletteOpen(false);
  }, [activeWorkspace]);

  // Global keyboard shortcuts (Alt+Tab, Ctrl+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        setStartMenuOpen(false);
      } else if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        setStartMenuOpen(false);
      } else if (e.key === 'Escape') {
        setStartMenuOpen(false);
        setCommandPaletteOpen(false);
      } else if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const wsWindows = windows.filter((w) => w.workspaceId === activeWorkspace);
        if (wsWindows.length > 0) {
          const sorted = [...wsWindows].sort((a, b) => b.zIndex - a.zIndex);
          const nextWin = sorted[1] || sorted[0];
          if (nextWin) {
            focusWindow(nextWin.id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const updateSettings = useCallback((partial: Partial<OSSettings>) => {
    setSettings((prev) => {
      const next: OSSettings = {
        ...prev,
        ...partial,
        updatedAt: Date.now(),
      };
      idbSet('settings', next);
      return next;
    });
  }, []);

  const cycleWallpaper = useCallback(() => {
    const ids = [
      'nordic-dusk',
      'archipelago-horizon',
      'graphite-studio',
      'volcanic-ember',
      'daylight-mineral',
      'blueprint-grid',
    ];
    setSettings((prev) => {
      const idx = ids.indexOf(prev.wallpaperId);
      const nextId = ids[(idx + 1) % ids.length];
      const next: OSSettings = {
        ...prev,
        wallpaperId: nextId,
        customWallpaperFileId: undefined,
        updatedAt: Date.now(),
      };
      idbSet('settings', next);
      return next;
    });
  }, []);

  // Persist windows whenever changed
  const persistWindows = useCallback((nextWindows: WindowState[]) => {
    setWindows(nextWindows);
    idbSet('windows', nextWindows);
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      const next = prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              status: w.status === 'minimized' ? ('normal' as const) : w.status,
              zIndex: maxZ + 1,
              lastActiveAt: Date.now(),
            }
          : w
      );
      idbSet('windows', next);
      return next;
    });
    setActiveWindowId(windowId);
    setStartMenuOpen(false);
  }, []);

  const openApp = useCallback(
    (
      appId: string,
      payload?: { fileId?: string; url?: string; customTitle?: string; forceMode?: AppOpenMode }
    ) => {
      const app = getAppById(appId);
      const title = payload?.customTitle || app?.name || appId;
      const icon = app?.icon || 'AppWindow';
      const targetUrl = payload?.url || app?.url;
      const effectiveMode = payload?.forceMode || app?.openMode || 'iframe';

      // If the app is an external web app configured to open in a browser tab or popup,
      // open it inside our in-window Web Browser app with the fallback bar ready!
      if (app && app.type !== 'builtin' && effectiveMode === 'tab' && targetUrl) {
        appId = 'browser';
        payload = { url: targetUrl, customTitle: `Browser — ${app.name}` };
      }

      setWindows((prev) => {
        // Check if an existing window of this app (without conflicting file payload) exists on current workspace
        const existing = prev.find(
          (w) =>
            w.appId === appId &&
            w.workspaceId === activeWorkspace &&
            (!payload?.fileId || w.payload?.fileId === payload.fileId)
        );

        const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);

        if (existing) {
          const next = prev.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  title: payload?.customTitle || w.title,
                  payload: payload ? { ...w.payload, ...payload } : w.payload,
                  status: w.status === 'minimized' ? ('normal' as const) : w.status,
                  zIndex: maxZ + 1,
                  lastActiveAt: Date.now(),
                }
              : w
          );
          setActiveWindowId(existing.id);
          idbSet('windows', next);
          return next;
        }

        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
        const defaultW = app?.defaultSize.width || 760;
        const defaultH = app?.defaultSize.height || 520;
        const width = Math.min(defaultW, vw - 32);
        const height = Math.min(defaultH, vh - 84);
        const offset = (prev.length % 6) * 26;
        const x = Math.max(16, Math.min(vw - width - 16, Math.round((vw - width) / 2) + offset - 40));
        const y = Math.max(16, Math.min(vh - height - 68, Math.round((vh - height - 56) / 2) + offset - 30));

        const newWin: WindowState = {
          id: `win-${appId}-${Date.now()}`,
          appId,
          title,
          icon,
          x,
          y,
          width,
          height,
          minWidth: app?.minSize?.width || 360,
          minHeight: app?.minSize?.height || 240,
          status: settings.touchMode ? 'maximized' : 'normal',
          zIndex: maxZ + 1,
          workspaceId: activeWorkspace,
          openedAt: Date.now(),
          lastActiveAt: Date.now(),
          memoryEstimateMB: Number((12 + Math.random() * 18).toFixed(1)),
          responsive: true,
          payload,
        };

        const next = [...prev, newWin];
        setActiveWindowId(newWin.id);
        idbSet('windows', next);
        return next;
      });

      setStartMenuOpen(false);
      setCommandPaletteOpen(false);
    },
    [activeWorkspace, getAppById, settings.touchMode]
  );

  const closeWindow = useCallback(
    (windowId: string) => {
      setWindows((prev) => {
        const next = prev.filter((w) => w.id !== windowId);
        idbSet('windows', next);
        if (activeWindowId === windowId) {
          const topRemaining = [...next]
            .filter((w) => w.workspaceId === activeWorkspace && w.status !== 'minimized')
            .sort((a, b) => b.zIndex - a.zIndex)[0];
          setActiveWindowId(topRemaining ? topRemaining.id : null);
        }
        return next;
      });
    },
    [activeWindowId, activeWorkspace]
  );

  const minimizeWindow = useCallback(
    (windowId: string) => {
      setWindows((prev) => {
        const next = prev.map((w) =>
          w.id === windowId ? { ...w, status: 'minimized' as const } : w
        );
        idbSet('windows', next);
        if (activeWindowId === windowId) {
          const topRemaining = [...next]
            .filter((w) => w.workspaceId === activeWorkspace && w.status !== 'minimized')
            .sort((a, b) => b.zIndex - a.zIndex)[0];
          setActiveWindowId(topRemaining ? topRemaining.id : null);
        }
        return next;
      });
    },
    [activeWindowId, activeWorkspace]
  );

  const toggleMaximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      const next = prev.map((w) => {
        if (w.id !== windowId) return w;
        if (w.status === 'maximized') {
          return {
            ...w,
            status: 'normal' as const,
            x: w.restoreBounds?.x ?? 80,
            y: w.restoreBounds?.y ?? 60,
            width: w.restoreBounds?.width ?? 760,
            height: w.restoreBounds?.height ?? 500,
            zIndex: maxZ + 1,
          };
        }
        return {
          ...w,
          status: 'maximized' as const,
          restoreBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          zIndex: maxZ + 1,
        };
      });
      idbSet('windows', next);
      return next;
    });
    setActiveWindowId(windowId);
  }, []);

  const setWindowBounds = useCallback(
    (
      windowId: string,
      bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>
    ) => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1366;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      const taskbarH = 52;

      setWindows((prev) => {
        const next = prev.map((w) => {
          if (w.id !== windowId) return w;
          const newW = Math.max(w.minWidth, Math.min(vw, bounds.width ?? w.width));
          const newH = Math.max(
            w.minHeight,
            Math.min(vh - taskbarH, bounds.height ?? w.height)
          );
          const newX = Math.max(0, Math.min(vw - 120, bounds.x ?? w.x));
          const newY = Math.max(0, Math.min(vh - taskbarH - 42, bounds.y ?? w.y));

          return {
            ...w,
            status: 'normal' as const,
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          };
        });
        idbSet('windows', next);
        return next;
      });
    },
    []
  );

  const snapWindow = useCallback((windowId: string, snap: SnapPosition) => {
    if (!snap) return;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1366;
    const vh = (typeof window !== 'undefined' ? window.innerHeight : 768) - 52; // leave taskbar

    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      const next = prev.map((w) => {
        if (w.id !== windowId) return w;
        const restoreBounds =
          w.status === 'normal'
            ? { x: w.x, y: w.y, width: w.width, height: w.height }
            : w.restoreBounds;

        if (snap === 'maximize') {
          return {
            ...w,
            status: 'maximized' as const,
            restoreBounds,
            zIndex: maxZ + 1,
          };
        }
        const boundsMap: Record<Exclude<SnapPosition, 'maximize' | null>, { x: number; y: number; width: number; height: number }> = {
          left: { x: 0, y: 0, width: Math.round(vw / 2), height: vh },
          right: { x: Math.round(vw / 2), y: 0, width: Math.round(vw / 2), height: vh },
          'top-left': { x: 0, y: 0, width: Math.round(vw / 2), height: Math.round(vh / 2) },
          'top-right': { x: Math.round(vw / 2), y: 0, width: Math.round(vw / 2), height: Math.round(vh / 2) },
          'bottom-left': { x: 0, y: Math.round(vh / 2), width: Math.round(vw / 2), height: Math.round(vh / 2) },
          'bottom-right': { x: Math.round(vw / 2), y: Math.round(vh / 2), width: Math.round(vw / 2), height: Math.round(vh / 2) },
        };
        const target = boundsMap[snap];
        return {
          ...w,
          status: 'normal' as const,
          restoreBounds,
          ...target,
          zIndex: maxZ + 1,
        };
      });
      idbSet('windows', next);
      return next;
    });
    setActiveWindowId(windowId);
  }, []);

  const reloadWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? { ...w, openedAt: Date.now(), lastActiveAt: Date.now(), responsive: true }
          : w
      )
    );
  }, []);

  const moveWindowToWorkspace = useCallback((windowId: string, workspaceId: number) => {
    setWindows((prev) => {
      const next = prev.map((w) => (w.id === windowId ? { ...w, workspaceId } : w));
      idbSet('windows', next);
      return next;
    });
  }, []);

  // Shortcuts
  const addDesktopShortcut = useCallback((shortcut: Omit<DesktopShortcut, 'id'>) => {
    setShortcuts((prev) => {
      const next: DesktopShortcut[] = [
        ...prev,
        { ...shortcut, id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` },
      ];
      idbSet('shortcuts', next);
      return next;
    });
  }, []);

  const updateShortcut = useCallback((id: string, partial: Partial<DesktopShortcut>) => {
    setShortcuts((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...partial } : s));
      idbSet('shortcuts', next);
      return next;
    });
  }, []);

  const removeShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const next = prev.filter((s) => s.id !== id);
      idbSet('shortcuts', next);
      return next;
    });
  }, []);

  const sortDesktopShortcuts = useCallback(
    (by: 'name' | 'category') => {
      setShortcuts((prev) => {
        const desktopItems = prev.filter((s) => s.location === 'desktop');
        const taskbarItems = prev.filter((s) => s.location === 'taskbar');
        const sorted = [...desktopItems].sort((a, b) => {
          const appA = getAppById(a.appId);
          const appB = getAppById(b.appId);
          if (by === 'category') {
            return (appA?.category || '').localeCompare(appB?.category || '');
          }
          const nameA = a.customName || appA?.name || a.appId;
          const nameB = b.customName || appB?.name || b.appId;
          return nameA.localeCompare(nameB);
        });
        const maxRows = 6;
        const repositioned = sorted.map((item, index) => ({
          ...item,
          gridX: Math.floor(index / maxRows),
          gridY: index % maxRows,
        }));
        const next = [...repositioned, ...taskbarItems];
        idbSet('shortcuts', next);
        return next;
      });
    },
    [getAppById]
  );

  const isAppPinnedToTaskbar = useCallback(
    (appId: string) =>
      shortcuts.some((s) => s.location === 'taskbar' && s.appId === appId),
    [shortcuts]
  );

  const togglePinToTaskbar = useCallback((appId: string) => {
    setShortcuts((prev) => {
      const exists = prev.find((s) => s.location === 'taskbar' && s.appId === appId);
      let next: DesktopShortcut[];
      if (exists) {
        next = prev.filter((s) => s.id !== exists.id);
      } else {
        const count = prev.filter((s) => s.location === 'taskbar').length;
        next = [
          ...prev,
          {
            id: `tb-${appId}-${Date.now()}`,
            appId,
            gridX: count,
            gridY: 0,
            location: 'taskbar',
          },
        ];
      }
      idbSet('shortcuts', next);
      return next;
    });
  }, []);

  const isAppOnDesktop = useCallback(
    (appId: string) =>
      shortcuts.some((s) => s.location === 'desktop' && s.appId === appId && !s.customUrl),
    [shortcuts]
  );

  const addAppShortcutToDesktop = useCallback(
    (appId: string) => {
      setShortcuts((prev) => {
        const desktopItems = prev.filter((s) => s.location === 'desktop');
        // Find first free grid position
        let gridX = 0;
        let gridY = 0;
        const maxRows = 6;
        for (let i = 0; i < 60; i++) {
          const cx = Math.floor(i / maxRows);
          const cy = i % maxRows;
          if (!desktopItems.some((s) => s.gridX === cx && s.gridY === cy)) {
            gridX = cx;
            gridY = cy;
            break;
          }
        }
        const next: DesktopShortcut[] = [
          ...prev,
          {
            id: `sc-${appId}-${Date.now()}`,
            appId,
            gridX,
            gridY,
            location: 'desktop',
          },
        ];
        idbSet('shortcuts', next);
        return next;
      });
      const app = getAppById(appId);
      notify(
        t('Shortcut Ditambahkan ke Home', 'Shortcut Added to Home'),
        `${app?.name || appId} ${t('telah ditambahkan ke Home / Desktop.', 'has been added to Home / Desktop.')}`,
        appId
      );
    },
    [getAppById, notify, t]
  );

  // Store Install / Uninstall
  const installApp = useCallback(
    (appId: string) => {
      setInstalledAppIds((prev) => {
        if (prev.includes(appId)) return prev;
        const next = [...prev, appId];
        idbSet('installedAppIds', next);
        return next;
      });
      // Also place shortcut on desktop if not present
      setShortcuts((prev) => {
        if (prev.some((s) => s.location === 'desktop' && s.appId === appId)) return prev;
        const desktopCount = prev.filter((s) => s.location === 'desktop').length;
        const next: DesktopShortcut[] = [
          ...prev,
          {
            id: `sc-${appId}-${Date.now()}`,
            appId,
            gridX: Math.floor(desktopCount / 6),
            gridY: desktopCount % 6,
            location: 'desktop',
          },
        ];
        idbSet('shortcuts', next);
        return next;
      });
      const app = getAppById(appId);
      notify(
        t('Aplikasi Terpasang', 'App Installed'),
        `${app?.name || appId} ${t('telah ditambahkan ke Desktop dan Start Menu.', 'has been added to Desktop and Start Menu.')}`,
        'store'
      );
    },
    [getAppById, notify, t]
  );

  const uninstallApp = useCallback(
    (appId: string, deleteData = true) => {
      setInstalledAppIds((prev) => {
        const next = prev.filter((id) => id !== appId);
        idbSet('installedAppIds', next);
        return next;
      });
      setShortcuts((prev) => {
        const next = prev.filter((s) => s.appId !== appId);
        idbSet('shortcuts', next);
        return next;
      });
      // Close any running windows of this app
      setWindows((prev) => {
        const next = prev.filter((w) => w.appId !== appId);
        idbSet('windows', next);
        return next;
      });
      if (deleteData) {
        setCustomApps((prev) => {
          const next = prev.filter((a) => a.id !== appId);
          idbSet('customApps', next);
          return next;
        });
      }
      notify(
        t('Aplikasi Dihapus', 'App Uninstalled'),
        t('Aplikasi dan shortcut terkait telah dihapus dari ruang kerja.', 'App and its shortcuts have been removed from the workspace.'),
        'store'
      );
    },
    [notify, t]
  );

  const registerCustomApp = useCallback(
    (manifest: AppManifest) => {
      setCustomApps((prev) => {
        const filtered = prev.filter((a) => a.id !== manifest.id);
        const next = [...filtered, manifest];
        idbSet('customApps', next);
        return next;
      });
      installApp(manifest.id);
    },
    [installApp]
  );

  // VFS Operations
  const createFolder = useCallback(
    async (name: string, parentId: string | null): Promise<VFSFile> => {
      const now = Date.now();
      const folder: VFSFile = {
        id: `folder-${now}-${Math.random().toString(36).slice(2, 6)}`,
        parentId,
        name: name.trim() || 'Folder Baru',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: now,
        updatedAt: now,
        isFolder: true,
        isTrash: false,
      };
      await idbPutFile(folder);
      setFiles((prev) => [...prev, folder]);
      return folder;
    },
    []
  );

  const createFile = useCallback(
    async (
      name: string,
      parentId: string | null,
      content: string,
      mimeType = 'text/plain'
    ): Promise<VFSFile> => {
      const now = Date.now();
      const size = new Blob([content]).size;
      const newFile: VFSFile = {
        id: `file-${now}-${Math.random().toString(36).slice(2, 6)}`,
        parentId,
        name: name.trim() || 'Catatan-Baru.txt',
        mimeType,
        size,
        createdAt: now,
        updatedAt: now,
        isFolder: false,
        isTrash: false,
        content,
        snapshots: [],
      };
      await idbPutFile(newFile);
      setFiles((prev) => [...prev, newFile]);
      return newFile;
    },
    []
  );

  const updateFileContent = useCallback(async (fileId: string, content: string) => {
    const size = new Blob([content]).size;
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updated: VFSFile = { ...f, content, size, updatedAt: now };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const saveFileSnapshot = useCallback(async (fileId: string, label: string) => {
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const snap = {
          id: `snap-${now}`,
          timestamp: now,
          label: label.trim() || `Snapshot ${new Date(now).toLocaleTimeString()}`,
          content: f.content || '',
        };
        const updated: VFSFile = {
          ...f,
          snapshots: [snap, ...(f.snapshots || [])],
          updatedAt: now,
        };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const restoreFileSnapshot = useCallback(
    async (fileId: string, snapshotId: string) => {
      const now = Date.now();
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f;
          const snap = f.snapshots?.find((s) => s.id === snapshotId);
          if (!snap) return f;
          const updated: VFSFile = {
            ...f,
            content: snap.content,
            size: new Blob([snap.content]).size,
            updatedAt: now,
          };
          idbPutFile(updated);
          return updated;
        })
      );
    },
    []
  );

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    if (!newName.trim()) return;
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updated: VFSFile = { ...f, name: newName.trim(), updatedAt: now };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const moveFile = useCallback(async (fileId: string, targetParentId: string | null) => {
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updated: VFSFile = { ...f, parentId: targetParentId, updatedAt: now };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const trashFile = useCallback(async (fileId: string) => {
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updated: VFSFile = { ...f, isTrash: true, updatedAt: now };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const restoreFile = useCallback(async (fileId: string) => {
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updated: VFSFile = { ...f, isTrash: false, updatedAt: now };
        idbPutFile(updated);
        return updated;
      })
    );
  }, []);

  const deleteFilePermanently = useCallback(async (fileId: string) => {
    await idbDeleteFile(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const emptyTrash = useCallback(async () => {
    const trashed = files.filter((f) => f.isTrash);
    for (const f of trashed) {
      await idbDeleteFile(f.id);
    }
    setFiles((prev) => prev.filter((f) => !f.isTrash));
  }, [files]);

  // Account & Sync
  const loginAccount = useCallback(
    (name: string, email: string) => {
      const acc: UserAccount = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        syncEnabled: true,
        lastSyncedAt: Date.now(),
        deviceName: navigator.platform || 'Browser Workstation',
      };
      setAccount(acc);
      idbSet('account', acc);
      notify(
        t('Akun Tersambung', 'Account Connected'),
        `${t('Sinkronisasi aktif untuk', 'Sync enabled for')} ${acc.email}`,
        'settings'
      );
    },
    [notify, t]
  );

  const logoutAccount = useCallback(() => {
    setAccount(null);
    idbSet('account', null);
  }, []);

  const syncWorkspaceNow = useCallback(() => {
    if (!account) return;
    const updated: UserAccount = { ...account, lastSyncedAt: Date.now() };
    setAccount(updated);
    idbSet('account', updated);
    notify(
      t('Sinkronisasi Selesai', 'Sync Completed'),
      t(
        'Seluruh pengaturan, shortcut, dan indeks berkas telah disinkronkan.',
        'All settings, shortcuts, and file indices have been synchronized.'
      ),
      'settings'
    );
  }, [account, notify, t]);

  // Workspace Export / Import (F12)
  const exportWorkspaceArchive = useCallback(() => {
    const archive: WorkspaceArchive = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: Date.now(),
      appVersion: APP_VERSION,
      settings,
      installedAppIds,
      customApps,
      shortcuts,
      files,
    };
    const blob = new Blob([JSON.stringify(archive, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `webworkstation-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(
      t('Ekspor Workspace Berhasil', 'Workspace Exported'),
      t(
        'Berkas arsip .json telah diunduh ke perangkat Anda.',
        'Workspace archive .json has been downloaded to your device.'
      ),
      'settings'
    );
  }, [customApps, files, installedAppIds, notify, settings, shortcuts, t]);

  const importWorkspaceArchive = useCallback(
    async (jsonString: string): Promise<{ success: boolean; message: string }> => {
      try {
        const parsed = JSON.parse(jsonString) as WorkspaceArchive;
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.files)) {
          return {
            success: false,
            message: t('Format arsip tidak valid.', 'Invalid workspace archive format.'),
          };
        }

        // Conflict resolution per PRD Section 8.10:
        // 1. Settings: "perubahan terbaru menang" (Newest Wins)
        if (parsed.settings) {
          const incomingTime = parsed.settings.updatedAt || 0;
          const localTime = settings.updatedAt || 0;
          const mergedSettings =
            incomingTime >= localTime
              ? { ...DEFAULT_SETTINGS, ...parsed.settings, updatedAt: Date.now() }
              : { ...settings, updatedAt: Date.now() };
          setSettings(mergedSettings);
          await idbSet('settings', mergedSettings);
        }

        // 2. Files: Create conflict copy when same ID or same parent+name has different content
        const mergedFiles = [...files];
        for (const incomingFile of parsed.files) {
          const existingIdx = mergedFiles.findIndex((f) => f.id === incomingFile.id);
          if (existingIdx === -1) {
            mergedFiles.push(incomingFile);
            await idbPutFile(incomingFile);
          } else {
            const existing = mergedFiles[existingIdx];
            if (
              !incomingFile.isFolder &&
              existing.content !== incomingFile.content &&
              existing.updatedAt !== incomingFile.updatedAt
            ) {
              // Create conflict copy per PRD 8.10
              const conflictCopy: VFSFile = {
                ...incomingFile,
                id: `${incomingFile.id}-conflict-${Date.now()}`,
                name: `${incomingFile.name.replace(/(\.[^.]+)$/, '')} (Salinan Konflik)${
                  incomingFile.name.match(/(\.[^.]+)$/)?.[1] || ''
                }`,
                updatedAt: Date.now(),
              };
              mergedFiles.push(conflictCopy);
              await idbPutFile(conflictCopy);
            }
          }
        }
        setFiles(mergedFiles);

        if (Array.isArray(parsed.installedAppIds)) {
          const mergedApps = Array.from(new Set([...installedAppIds, ...parsed.installedAppIds]));
          setInstalledAppIds(mergedApps);
          await idbSet('installedAppIds', mergedApps);
        }

        if (Array.isArray(parsed.shortcuts) && parsed.shortcuts.length > 0) {
          setShortcuts(parsed.shortcuts);
          await idbSet('shortcuts', parsed.shortcuts);
        }

        notify(
          t('Impor Workspace Selesai', 'Workspace Imported'),
          t(
            'Pengaturan dan berkas berhasil dipulihkan dengan resolusi konflik otomatis.',
            'Settings and files restored with automatic conflict resolution.'
          ),
          'settings'
        );

        return {
          success: true,
          message: t('Workspace berhasil dipulihkan!', 'Workspace successfully restored!'),
        };
      } catch {
        return {
          success: false,
          message: t('Gagal membaca berkas JSON.', 'Failed to parse JSON archive.'),
        };
      }
    },
    [files, installedAppIds, notify, settings, t]
  );

  const resetEntireWorkspace = useCallback(async () => {
    await idbClearAll();
    const seedFiles = createSeedFiles();
    for (const f of seedFiles) {
      await idbPutFile(f);
    }
    const defaultSc = createDefaultShortcuts();
    await idbSet('shortcuts', defaultSc);
    await idbSet('settings', DEFAULT_SETTINGS);
    await idbSet('installedAppIds', DEFAULT_INSTALLED_APP_IDS);
    setSettings(DEFAULT_SETTINGS);
    setFiles(seedFiles);
    setShortcuts(defaultSc);
    setInstalledAppIds(DEFAULT_INSTALLED_APP_IDS);
    setCustomApps([]);
    persistWindows([]);
    notify(
      t('Workspace Direset', 'Workspace Reset'),
      t('Seluruh data dikembalikan ke kondisi awal pabrik.', 'All data restored to factory defaults.'),
      'settings'
    );
  }, [notify, persistWindows, t]);

  return (
    <OSContext.Provider
      value={{
        isBooting,
        isLocked,
        setIsLocked,
        settings,
        updateSettings,
        cycleWallpaper,
        activeWorkspace,
        setActiveWorkspace,
        allApps,
        installedAppIds,
        customApps,
        getAppById,
        installApp,
        uninstallApp,
        registerCustomApp,
        windows,
        activeWindowId,
        openApp,
        closeWindow,
        focusWindow,
        minimizeWindow,
        toggleMaximizeWindow,
        setWindowBounds,
        snapWindow,
        reloadWindow,
        moveWindowToWorkspace,
        shortcuts,
        addDesktopShortcut,
        updateShortcut,
        removeShortcut,
        sortDesktopShortcuts,
        isAppPinnedToTaskbar,
        togglePinToTaskbar,
        isAppOnDesktop,
        addAppShortcutToDesktop,
        files,
        createFolder,
        createFile,
        updateFileContent,
        saveFileSnapshot,
        restoreFileSnapshot,
        renameFile,
        moveFile,
        trashFile,
        restoreFile,
        deleteFilePermanently,
        emptyTrash,
        account,
        loginAccount,
        logoutAccount,
        syncWorkspaceNow,
        exportWorkspaceArchive,
        importWorkspaceArchive,
        resetEntireWorkspace,
        startMenuOpen,
        setStartMenuOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        whatsNewOpen,
        setWhatsNewOpen,
        notifications,
        notify,
        clearNotifications,
        viewport,
        minimizeAllWindows,
        t,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
};
