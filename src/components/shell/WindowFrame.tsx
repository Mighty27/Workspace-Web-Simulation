import React, { useState, useRef, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Columns,
  LayoutGrid,
  ExternalLink,
  RotateCw,
  FolderPlus,
  FilePlus,
  Plus,
  Pin,
  Sparkles,
  Sun,
  Moon,
  Download,
  Clock,
  Calculator,
  Palette,
  Globe,
  ShoppingBag,
  Activity,
  Gamepad2,
  FolderOpen,
} from 'lucide-react';
import { SnapPosition, WindowState } from '../../types/os';
import { useOS } from '../../context/OSContext';
import { AppIcon } from './AppIcon';
import { FilesApp } from '../apps/FilesApp';
import { NotepadApp } from '../apps/NotepadApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { ClockApp } from '../apps/ClockApp';
import { PaintApp } from '../apps/PaintApp';
import { BrowserApp } from '../apps/BrowserApp';
import { StoreApp } from '../apps/StoreApp';
import { TaskManagerApp } from '../apps/TaskManagerApp';
import { SettingsApp } from '../apps/SettingsApp';
import { Game2048App } from '../apps/Game2048App';

interface WindowFrameProps {
  win: WindowState;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const WindowFrame: React.FC<WindowFrameProps> = ({ win }) => {
  const {
    activeWindowId,
    settings,
    updateSettings,
    getAppById,
    openApp,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    setWindowBounds,
    snapWindow,
    moveWindowToWorkspace,
    addAppShortcutToDesktop,
    isAppPinnedToTaskbar,
    togglePinToTaskbar,
    createFolder,
    createFile,
    exportWorkspaceArchive,
    setWhatsNewOpen,
    minimizeAllWindows,
    notify,
    viewport,
    t,
  } = useOS();

  const [snapPreview, setSnapPreview] = useState<SnapPosition>(null);
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [winMenu, setWinMenu] = useState<{ x: number; y: number } | null>(null);

  const winMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!winMenu && !showSnapMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWinMenu(null);
        setShowSnapMenu(false);
      }
    };

    const handleOutsidePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const path = e.composedPath ? e.composedPath() : [];

      if (winMenu && winMenuRef.current) {
        const inside =
          path.includes(winMenuRef.current) || winMenuRef.current.contains(target);
        if (!inside) {
          setWinMenu(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [winMenu, showSnapMenu]);

  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    activeSnap: SnapPosition;
  } | null>(null);

  const resizeStateRef = useRef<{
    dir: ResizeDir;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  if (win.status === 'minimized') return null;

  const isFocused = activeWindowId === win.id;
  // On mobile phones (< 640px), follow PRD Section 9: single-window launcher mode
  if (viewport.isMobile && !isFocused) return null;

  const isFullViewport =
    viewport.isMobile || win.status === 'maximized' || settings.touchMode;

  const appManifest = getAppById(win.appId);

  const radiusClass =
    isFullViewport
      ? 'rounded-none'
      : settings.windowRadius === 'none'
      ? 'rounded-none'
      : settings.windowRadius === 'xl'
      ? 'rounded-2xl'
      : 'rounded-xl';

  const detectEdgeSnap = (clientX: number, clientY: number): SnapPosition => {
    const vw = window.innerWidth;
    const vh = window.innerHeight - 52;
    const edgeThreshold = 20;
    const cornerThreshold = 60;

    if (clientX <= cornerThreshold && clientY <= cornerThreshold) return 'top-left';
    if (clientX >= vw - cornerThreshold && clientY <= cornerThreshold) return 'top-right';
    if (clientX <= cornerThreshold && clientY >= vh - cornerThreshold) return 'bottom-left';
    if (clientX >= vw - cornerThreshold && clientY >= vh - cornerThreshold) return 'bottom-right';
    if (clientY <= edgeThreshold) return 'maximize';
    if (clientX <= edgeThreshold) return 'left';
    if (clientX >= vw - edgeThreshold) return 'right';
    return null;
  };

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = win.status === 'maximized' ? Math.max(40, startX - win.width / 2) : win.x;
    const origY = win.status === 'maximized' ? 16 : win.y;

    dragStateRef.current = {
      startX,
      startY,
      origX,
      origY,
      activeSnap: null,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStateRef.current) return;
      const dx = moveEvent.clientX - dragStateRef.current.startX;
      const dy = moveEvent.clientY - dragStateRef.current.startY;

      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

      const detected = detectEdgeSnap(moveEvent.clientX, moveEvent.clientY);
      dragStateRef.current.activeSnap = detected;
      setSnapPreview(detected);

      setWindowBounds(win.id, {
        x: dragStateRef.current.origX + dx,
        y: dragStateRef.current.origY + dy,
      });
    };

    const handlePointerUp = () => {
      if (dragStateRef.current?.activeSnap) {
        snapWindow(win.id, dragStateRef.current.activeSnap);
      }
      dragStateRef.current = null;
      setSnapPreview(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startResize = (dir: ResizeDir, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    focusWindow(win.id);
    if (win.status === 'maximized') return;

    resizeStateRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
    };

    const onMove = (moveEvent: PointerEvent) => {
      const st = resizeStateRef.current;
      if (!st) return;
      const dx = moveEvent.clientX - st.startX;
      const dy = moveEvent.clientY - st.startY;

      let nextX = st.origX;
      let nextY = st.origY;
      let nextW = st.origW;
      let nextH = st.origH;

      if (st.dir.includes('e')) {
        nextW = Math.max(win.minWidth, st.origW + dx);
      }
      if (st.dir.includes('s')) {
        nextH = Math.max(win.minHeight, st.origH + dy);
      }
      if (st.dir.includes('w')) {
        const candidateW = st.origW - dx;
        if (candidateW >= win.minWidth) {
          nextW = candidateW;
          nextX = st.origX + dx;
        }
      }
      if (st.dir.includes('n')) {
        const candidateH = st.origH - dy;
        if (candidateH >= win.minHeight) {
          nextH = candidateH;
          nextY = Math.max(0, st.origY + dy);
        }
      }

      setWindowBounds(win.id, {
        x: nextX,
        y: nextY,
        width: nextW,
        height: nextH,
      });
    };

    const onUp = () => {
      resizeStateRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleWindowContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFocused) focusWindow(win.id);
    setShowSnapMenu(false);
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - 260));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - 330));
    setWinMenu({ x, y });
  };

  const renderAppSpecificMenuItems = () => {
    switch (win.appId) {
      case 'files':
        return (
          <>
            <button
              onClick={async () => {
                setWinMenu(null);
                const folder = await createFolder(
                  `Folder-${Date.now().toString().slice(-3)}`,
                  'folder-documents'
                );
                notify(
                  t('Folder Dibuat', 'Folder Created'),
                  `${folder.name} ${t('ditambahkan ke Documents.', 'added to Documents.')}`,
                  'files'
                );
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FolderPlus size={14} />
              <span>{t('Buat Folder Baru di Documents', 'New Folder in Documents')}</span>
            </button>
            <button
              onClick={async () => {
                setWinMenu(null);
                const f = await createFile(
                  `Berkas-${Date.now().toString().slice(-3)}.md`,
                  'folder-documents',
                  '# Dokumen VFS Baru\n\n',
                  'text/markdown'
                );
                openApp('notepad', { fileId: f.id, customTitle: `Notepad — ${f.name}` });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FilePlus size={14} />
              <span>{t('Buat Berkas Markdown Baru', 'Create New Markdown File')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('files', { customTitle: 'Files — Jendela #2' });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FolderOpen size={14} />
              <span>{t('Buka Jendela Files Kedua', 'Open Second Files Window')}</span>
            </button>
          </>
        );

      case 'notepad':
        return (
          <>
            <button
              onClick={async () => {
                setWinMenu(null);
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
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FilePlus size={14} />
              <span>{t('Buat Catatan di Jendela Baru', 'New Note in New Window')}</span>
            </button>
            <button
              onClick={async () => {
                setWinMenu(null);
                const f = await createFile(
                  `Notulen-Rapat-${Date.now().toString().slice(-3)}.md`,
                  'folder-documents',
                  '# Notulen Rapat\n\n- **Tanggal**: ' +
                    new Date().toLocaleDateString() +
                    '\n- **Agenda**: \n- **Tindak Lanjut**: \n',
                  'text/markdown'
                );
                openApp('notepad', {
                  fileId: f.id,
                  customTitle: `Notepad — ${f.name}`,
                });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Sparkles size={14} />
              <span>{t('Buat Template Notulen Rapat', 'Insert Meeting Notes Template')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('files');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FolderOpen size={14} />
              <span>{t('Kelola Berkas di Files VFS', 'Manage Files in VFS')}</span>
            </button>
          </>
        );

      case 'calculator':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('calculator', { customTitle: 'Calculator #2' });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Calculator size={14} />
              <span>
                {t('Buka Kalkulator Baru (Multi-Instance)', 'Open Another Calculator')}
              </span>
            </button>
            <button
              onClick={async () => {
                setWinMenu(null);
                const f = await createFile(
                  `Perhitungan-${Date.now().toString().slice(-3)}.md`,
                  'folder-documents',
                  '# Catatan Perhitungan\n\n- Item A: \n- Item B: \n- Total: \n',
                  'text/markdown'
                );
                openApp('notepad', { fileId: f.id, customTitle: `Notepad — ${f.name}` });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FilePlus size={14} />
              <span>{t('Buka Lembar Catatan Hitungan', 'Open Calculation Scratchpad')}</span>
            </button>
          </>
        );

      case 'clock':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                updateSettings({ showClockSeconds: !settings.showClockSeconds });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Clock size={14} />
              <span>
                {settings.showClockSeconds
                  ? t('Sembunyikan Detik di Taskbar', 'Hide Seconds on Taskbar')
                  : t('Tampilkan Detik di Taskbar', 'Show Seconds on Taskbar')}
              </span>
            </button>
            <button
              onClick={async () => {
                setWinMenu(null);
                const f = await createFile(
                  `Log-Pomodoro-${Date.now().toString().slice(-3)}.md`,
                  'folder-documents',
                  '# Log Sesi Fokus Pomodoro\n\n- Sesi 1 (25 mnt): \n- Sesi 2 (25 mnt): \n',
                  'text/markdown'
                );
                openApp('notepad', { fileId: f.id, customTitle: `Notepad — ${f.name}` });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FilePlus size={14} />
              <span>{t('Buat Jurnal Sesi Fokus Pomodoro', 'Create Pomodoro Focus Log')}</span>
            </button>
          </>
        );

      case 'paint':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('paint', { customTitle: 'Paint — Kanvas Baru' });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Palette size={14} />
              <span>{t('Buka Kanvas Paint Baru', 'Open New Paint Canvas')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('files');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <FolderOpen size={14} />
              <span>{t('Buka Galeri Gambar di Files', 'Open Pictures in Files')}</span>
            </button>
          </>
        );

      case 'browser':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                setIframeKey((k) => k + 1);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <RotateCw size={14} />
              <span>{t('Muat Ulang Jendela Browser', 'Reload Browser Window')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('browser', { customTitle: 'BrowBrowser — Jendela Baru' });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Globe size={14} />
              <span>{t('Buka Jendela Browser Baru', 'Open New Browser Window')}</span>
            </button>
          </>
        );

      case 'store':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('task-manager');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Activity size={14} />
              <span>{t('Pantau Aplikasi di Task Manager', 'Monitor Apps in Task Manager')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('settings');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <ShoppingBag size={14} />
              <span>{t('Kelola Penyimpanan Aplikasi', 'Manage App Storage')}</span>
            </button>
          </>
        );

      case 'task-manager':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                minimizeAllWindows();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Minus size={14} />
              <span>{t('Minimalkan Semua Jendela', 'Minimize All Windows')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('settings');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Activity size={14} />
              <span>{t('Buka Pengaturan Sistem', 'Open System Settings')}</span>
            </button>
          </>
        );

      case 'settings':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                updateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              {settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>
                {t('Ubah Tema Gelap / Terang', 'Toggle Dark / Light Theme')}
              </span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                exportWorkspaceArchive();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Download size={14} />
              <span>{t('Ekspor Arsip Workspace (.json)', 'Export Workspace Archive')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                setWhatsNewOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Sparkles size={14} />
              <span>{t("Buka Dialog What's New", "Open What's New Dialog")}</span>
            </button>
          </>
        );

      case 'game-2048':
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('game-2048', { customTitle: '2048 — Sesi Baru' });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Gamepad2 size={14} />
              <span>{t('Buka Sesi 2048 Baru', 'Start New 2048 Window')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('task-manager');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Activity size={14} />
              <span>{t('Cek Performa di Task Manager', 'Check Performance in Task Manager')}</span>
            </button>
          </>
        );

      default: {
        const targetUrl = win.payload?.url || appManifest?.url || 'https://id.m.wikipedia.org';
        return (
          <>
            <button
              onClick={() => {
                setWinMenu(null);
                setIframeKey((k) => k + 1);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <RotateCw size={14} />
              <span>{t('Muat Ulang Sandbox Aplikasi', 'Reload App Sandbox')}</span>
            </button>
            <button
              onClick={() => {
                setWinMenu(null);
                openApp('browser', { url: targetUrl, customTitle: win.title });
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Globe size={14} />
              <span>{t('Buka di BrowBrowser Internal', 'Open in Internal BrowBrowser')}</span>
            </button>
          </>
        );
      }
    }
  };

  const renderWindowBody = () => {
    switch (win.appId) {
      case 'files':
        return <FilesApp />;
      case 'notepad':
        return <NotepadApp initialFileId={win.payload?.fileId} />;
      case 'calculator':
        return <CalculatorApp />;
      case 'clock':
        return <ClockApp />;
      case 'paint':
        return <PaintApp />;
      case 'browser':
        return <BrowserApp key={iframeKey} initialUrl={win.payload?.url} />;
      case 'store':
        return <StoreApp />;
      case 'task-manager':
        return <TaskManagerApp />;
      case 'settings':
        return <SettingsApp />;
      case 'game-2048':
        return <Game2048App />;
      default: {
        // Web or Third-Party Sandboxed App
        const targetUrl = win.payload?.url || appManifest?.url || 'https://id.m.wikipedia.org';
        return (
          <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono truncate">{targetUrl}</span>
                <span>·</span>
                <span>Sandbox Terisolasi</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="hover:text-sky-500 flex items-center gap-1"
                >
                  <RotateCw size={11} />
                  <span>{t('Muat Ulang', 'Reload')}</span>
                </button>
                <span>·</span>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{t('Buka di Tab Baru', 'Open in New Tab')}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
            <iframe
              key={iframeKey}
              src={targetUrl}
              title={win.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
              className="flex-1 w-full border-none bg-white"
            />
          </div>
        );
      }
    }
  };

  const renderControls = () => {
    if (settings.windowControlStyle === 'mac') {
      return (
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => closeWindow(win.id)}
            className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-rose-950 transition-colors"
            title={t('Tutup', 'Close')}
          >
            <X size={9} />
          </button>
          <button
            onClick={() => minimizeWindow(win.id)}
            className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-amber-950 transition-colors"
            title={t('Minimalkan', 'Minimize')}
          >
            <Minus size={9} />
          </button>
          <button
            onClick={() => toggleMaximizeWindow(win.id)}
            className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-emerald-950 transition-colors"
            title={t('Maksimalkan', 'Maximize')}
          >
            <Square size={8} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setShowSnapMenu((s) => !s)}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title={t('Tata Letak Snap & Desktop', 'Snap Layout & Workspace')}
        >
          <Columns size={13} />
        </button>
        <button
          onClick={() => minimizeWindow(win.id)}
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title={t('Minimalkan', 'Minimize')}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => toggleMaximizeWindow(win.id)}
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title={win.status === 'maximized' ? t('Pulihkan', 'Restore') : t('Maksimalkan', 'Maximize')}
        >
          {win.status === 'maximized' ? <Copy size={13} /> : <Square size={13} />}
        </button>
        <button
          onClick={() => closeWindow(win.id)}
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-colors"
          title={t('Tutup', 'Close')}
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  const clampedWidth = Math.min(win.width, Math.max(300, viewport.width - 12));
  const clampedHeight = Math.min(
    win.height,
    Math.max(240, viewport.height - 64)
  );
  const clampedLeft = Math.max(
    6,
    Math.min(win.x, Math.max(6, viewport.width - clampedWidth - 6))
  );
  const clampedTop = Math.max(
    6,
    Math.min(win.y, Math.max(6, viewport.height - 58 - clampedHeight))
  );

  const frameStyle: React.CSSProperties = isFullViewport
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100dvh - 52px)',
        zIndex: win.zIndex,
      }
    : {
        left: clampedLeft,
        top: clampedTop,
        width: clampedWidth,
        height: clampedHeight,
        zIndex: win.zIndex,
      };

  const appDisplayName = appManifest?.name || win.title;

  return (
    <>
      {/* Edge Snap Preview Ghost Overlay */}
      {snapPreview && (
        <div
          className="fixed z-[999] pointer-events-none bg-sky-500/20 border-2 border-sky-400 rounded-xl backdrop-blur-xs transition-all duration-100"
          style={{
            left:
              snapPreview === 'right' ||
              snapPreview === 'top-right' ||
              snapPreview === 'bottom-right'
                ? '50vw'
                : 8,
            top:
              snapPreview === 'bottom-left' || snapPreview === 'bottom-right'
                ? 'calc((100vh - 52px) / 2)'
                : 8,
            width:
              snapPreview === 'maximize'
                ? 'calc(100vw - 16px)'
                : 'calc(50vw - 12px)',
            height:
              snapPreview === 'maximize' ||
              snapPreview === 'left' ||
              snapPreview === 'right'
                ? 'calc(100vh - 68px)'
                : 'calc((100vh - 68px) / 2)',
          }}
        />
      )}

      <div
        data-window-frame="true"
        onPointerDown={() => {
          if (!isFocused) focusWindow(win.id);
        }}
        onContextMenu={handleWindowContextMenu}
        style={frameStyle}
        className={`fixed flex flex-col overflow-hidden border transition-shadow duration-150 ${radiusClass} ${
          isFocused
            ? 'border-sky-500/50 dark:border-sky-400/40 shadow-2xl ring-1 ring-sky-500/20'
            : 'border-slate-300 dark:border-slate-800 shadow-lg opacity-95'
        } ${
          settings.glassTransparency
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md'
            : 'bg-white dark:bg-slate-900'
        }`}
      >
        {/* 8-Direction Resize Handles (only when not maximized or mobile full-screen) */}
        {!isFullViewport && (
          <>
            <div
              onPointerDown={(e) => startResize('n', e)}
              className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-30"
            />
            <div
              onPointerDown={(e) => startResize('s', e)}
              className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-30"
            />
            <div
              onPointerDown={(e) => startResize('w', e)}
              className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-30"
            />
            <div
              onPointerDown={(e) => startResize('e', e)}
              className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-30"
            />
            <div
              onPointerDown={(e) => startResize('nw', e)}
              className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-40"
            />
            <div
              onPointerDown={(e) => startResize('ne', e)}
              className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-40"
            />
            <div
              onPointerDown={(e) => startResize('sw', e)}
              className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-40"
            />
            <div
              onPointerDown={(e) => startResize('se', e)}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-40"
            />
          </>
        )}

        {/* Window Titlebar Header */}
        <div
          onPointerDown={isFullViewport ? undefined : handleHeaderPointerDown}
          onDoubleClick={() => !viewport.isMobile && toggleMaximizeWindow(win.id)}
          className={`h-11 sm:h-10 px-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 select-none shrink-0 cursor-default touch-none ${
            isFocused
              ? 'bg-slate-100/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100'
              : 'bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400'
          }`}
        >
          {settings.windowControlStyle === 'mac' ? (
            <>
              <div className="flex items-center gap-2">
                {renderControls()}
                <button
                  onClick={() => setShowSnapMenu((s) => !s)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Snap Layout"
                >
                  <LayoutGrid size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <AppIcon icon={win.icon} appId={win.appId} size="sm" />
                <span className="text-xs font-semibold truncate">{win.title}</span>
              </div>
              <div className="w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <AppIcon icon={win.icon} appId={win.appId} size="sm" />
                <span className="text-xs font-semibold truncate">{win.title}</span>
              </div>
              {renderControls()}
            </>
          )}
        </div>

        {/* Snap Layout & Multi-Workspace Popover */}
        {showSnapMenu && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onPointerDown={(e) => {
                e.stopPropagation();
                setShowSnapMenu(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowSnapMenu(false);
              }}
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-11 z-50 w-56 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl text-xs space-y-2.5"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200">
                {t('Snap Posisi Jendela (F1)', 'Window Snap Positions (F1)')}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'left', label: t('Setengah Kiri', 'Left Half') },
                  { id: 'right', label: t('Setengah Kanan', 'Right Half') },
                  { id: 'top-left', label: t('Sudut Kiri Atas', 'Top Left 1/4') },
                  { id: 'top-right', label: t('Sudut Kanan Atas', 'Top Right 1/4') },
                  { id: 'bottom-left', label: t('Sudut Kiri Bawah', 'Bottom Left 1/4') },
                  { id: 'bottom-right', label: t('Sudut Kanan Bawah', 'Bottom Right 1/4') },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      snapWindow(win.id, s.id as SnapPosition);
                      setShowSnapMenu(false);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-[11px] font-medium transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">
                  {t('Pindah ke Desktop Virtual (F14):', 'Move to Virtual Desktop (F14):')}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((ws) => (
                    <button
                      key={ws}
                      onClick={() => {
                        moveWindowToWorkspace(win.id, ws);
                        setShowSnapMenu(false);
                      }}
                      className={`flex-1 py-1 rounded-md font-mono text-[11px] ${
                        win.workspaceId === ws
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      Desktop {ws}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Window Content Viewport */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {renderWindowBody()}
        </div>
      </div>

      {/* Dedicated Per-App Right-Click Context Menu (Separated from Desktop Menu) */}
      {winMenu && (
        <>
          {/* Full-screen click-outside catcher so clicking anywhere outside closes the menu */}
          <div
            className="fixed inset-0 z-[985] bg-transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              setWinMenu(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setWinMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWinMenu(null);
            }}
          />

          <div
            ref={winMenuRef}
            data-context-menu="true"
            style={{ left: winMenu.x, top: winMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed z-[990] w-64 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs text-slate-800 dark:text-slate-100 select-none"
          >
            {/* App-Specific Header */}
            <div className="px-3.5 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <AppIcon icon={win.icon} appId={win.appId} size="sm" />
              <div className="min-w-0">
                <div className="font-bold truncate">{appDisplayName}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {t('Menu Konteks Aplikasi', 'Application Context Menu')}
                </div>
              </div>
            </div>

            {/* App-Specific Actions */}
            <div className="py-1">{renderAppSpecificMenuItems()}</div>

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            {/* App Shortcut & Pin Actions */}
            <button
              onClick={() => {
                addAppShortcutToDesktop(win.appId);
                setWinMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Plus size={14} />
              <span>{t('Tambah Shortcut ke Home', 'Add Shortcut to Home')}</span>
            </button>

            <button
              onClick={() => {
                togglePinToTaskbar(win.appId);
                setWinMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Pin size={14} />
              <span>
                {isAppPinnedToTaskbar(win.appId)
                  ? t('Lepas Pin dari Taskbar', 'Unpin from Taskbar')
                  : t('Pin ke Taskbar', 'Pin to Taskbar')}
              </span>
            </button>

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            {/* Window Management Actions */}
            <div className="px-3.5 py-1 flex items-center justify-between gap-1">
              <button
                onClick={() => {
                  snapWindow(win.id, 'left');
                  setWinMenu(null);
                }}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-[11px] font-medium transition-colors text-center"
              >
                {t('Snap Kiri', 'Snap Left')}
              </button>
              <button
                onClick={() => {
                  snapWindow(win.id, 'right');
                  setWinMenu(null);
                }}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-[11px] font-medium transition-colors text-center"
              >
                {t('Snap Kanan', 'Snap Right')}
              </button>
              <button
                onClick={() => {
                  toggleMaximizeWindow(win.id);
                  setWinMenu(null);
                }}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-[11px] font-medium transition-colors text-center"
              >
                {win.status === 'maximized'
                  ? t('Pulihkan', 'Restore')
                  : t('Penuh', 'Maximize')}
              </button>
            </div>

            <button
              onClick={() => {
                minimizeWindow(win.id);
                setWinMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
            >
              <Minus size={14} />
              <span>{t('Minimalkan Jendela', 'Minimize Window')}</span>
            </button>

            <button
              onClick={() => {
                closeWindow(win.id);
                setWinMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-left"
            >
              <X size={14} />
              <span>{t('Tutup Aplikasi', 'Close Application')}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
