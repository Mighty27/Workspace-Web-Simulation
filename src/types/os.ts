export type Language = 'id' | 'en';

export type AppPermission = 'files' | 'network' | 'notifications' | 'clipboard';

export type AppOpenMode = 'iframe' | 'popup' | 'tab';

export type AppCategory = 'system' | 'productivity' | 'creative' | 'utilities' | 'games' | 'web';

export interface AppManifest {
  id: string;
  name: string;
  description: {
    id: string;
    en: string;
  };
  icon: string; // lucide icon identifier or custom data/url
  version: string;
  author: string;
  license: string;
  sourceUrl?: string;
  type: 'builtin' | 'web' | 'thirdparty';
  category: AppCategory;
  url?: string;
  permissions: AppPermission[];
  openMode: AppOpenMode;
  blocksIframe?: boolean;
  sponsored?: boolean;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize?: {
    width: number;
    height: number;
  };
}

export interface DesktopShortcut {
  id: string;
  appId: string;
  customName?: string;
  customUrl?: string;
  customIcon?: string;
  openMode?: AppOpenMode;
  gridX: number;
  gridY: number;
  location: 'desktop' | 'taskbar';
}

export type SnapPosition =
  | 'left'
  | 'right'
  | 'maximize'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | null;

export interface WindowState {
  id: string; // unique window instance id
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  status: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  workspaceId: number; // 1, 2, or 3 for multi-desktop (F14)
  openedAt: number;
  lastActiveAt: number;
  memoryEstimateMB: number;
  responsive: boolean;
  payload?: {
    fileId?: string;
    url?: string;
  };
  restoreBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NoteSnapshot {
  id: string;
  timestamp: number;
  label: string;
  content: string;
}

export interface VFSFile {
  id: string;
  parentId: string | null; // null for root folders
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  isFolder: boolean;
  isTrash: boolean;
  content?: string; // text, markdown, json, or dataURL for images/media
  opfsPath?: string; // reference path in Origin Private File System when stored in OPFS
  snapshots?: NoteSnapshot[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  syncEnabled: boolean;
  lastSyncedAt: number | null;
  deviceName: string;
}

export interface TaskbarButtonVisibility {
  start: boolean;
  home: boolean;
  search: boolean;
  workspaces: boolean;
  apps: boolean;
  whatsNew: boolean;
  language: boolean;
  theme: boolean;
  notifications: boolean;
  clock: boolean;
  hiddenAppIds: string[];
}

export interface OSSettings {
  schemaVersion: number;
  updatedAt: number;
  language: Language;
  theme: 'dark' | 'light' | 'system';
  accentColor: 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
  wallpaperId: string;
  customWallpaperFileId?: string;
  windowRadius: 'none' | 'md' | 'xl';
  windowControlStyle: 'windows' | 'mac';
  glassTransparency: boolean;
  taskbarWidth: 'auto' | 'full';
  showClockSeconds: boolean;
  customCursor: 'default' | 'precision' | 'large';
  desktopLabelText: string;
  bootAnimation: boolean;
  bootSound: boolean;
  touchMode: boolean;
  alwaysTabDomains: string[];
  seenVersion: string;
  taskbarButtons: TaskbarButtonVisibility;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  appId?: string;
}

export interface WorkspaceArchive {
  schemaVersion: number;
  exportedAt: number;
  appVersion: string;
  settings: OSSettings;
  installedAppIds: string[];
  customApps: AppManifest[];
  shortcuts: DesktopShortcut[];
  files: VFSFile[];
}
