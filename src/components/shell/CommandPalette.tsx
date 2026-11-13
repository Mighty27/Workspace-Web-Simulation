import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  FileText,
  Wallpaper,
  Download,
  Moon,
  Sun,
  Layers,
  X,
  Plus,
  Settings,
  LayoutGrid,
  CornerDownLeft,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import {
  useDashboardSelector,
  useDashboardStoreApi,
} from '../../store/DashboardStore';
import { WIDGET_CATALOG_META } from '../../utils/storageMigration';
import { WidgetType } from '../../types/dashboard';
import { AppIcon } from './AppIcon';
import { renderWidgetTypeIcon } from '../widgets/WidgetCardShell';

interface PaletteActionItem {
  id: string;
  group: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  run: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    allApps,
    installedAppIds,
    files,
    openApp,
    cycleWallpaper,
    settings,
    updateSettings,
  } = useOS();

  const store = useDashboardStoreApi();
  const workspaces = useDashboardSelector((s) => s.workspaces);
  const activeWorkspaceId = useDashboardSelector((s) => s.activeWorkspaceId);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allCommands = useMemo<PaletteActionItem[]>(() => {
    const items: PaletteActionItem[] = [];

    // 1. Pindah Workspace Dashboard (Bagian D.1)
    workspaces.forEach((ws) => {
      items.push({
        id: `ws-switch-${ws.id}`,
        group: 'Pindah Workspace',
        label: `Pindah ke Workspace: ${ws.name}`,
        subtitle:
          ws.id === activeWorkspaceId
            ? 'Workspace sedang aktif'
            : `${ws.widgets.length} widget aktif`,
        icon: <Layers size={15} className="text-sky-500" />,
        run: () => store.setActiveWorkspace(ws.id),
      });
    });

    // 2. Tambah Widget Baru (Bagian D.1)
    (Object.keys(WIDGET_CATALOG_META) as WidgetType[]).forEach((type) => {
      const meta = WIDGET_CATALOG_META[type];
      items.push({
        id: `add-widget-${type}`,
        group: 'Tambah Widget',
        label: `Tambah Widget: ${meta.title}`,
        subtitle: meta.description,
        icon: (
          <span className="text-sky-500">{renderWidgetTypeIcon(type, 15)}</span>
        ),
        run: () => store.addWidget(type),
      });
    });

    // 3. Perintah Produktivitas & Sistem (Bagian D.1)
    items.push(
      {
        id: 'cmd-open-gallery',
        group: 'Perintah Utama',
        label: 'Buka Galeri Tambah Widget',
        subtitle: 'Lihat pratinjau semua widget (Alt+N)',
        icon: <Plus size={15} className="text-emerald-500" />,
        run: () => window.dispatchEvent(new CustomEvent('ws:open-widget-gallery')),
      },
      {
        id: 'cmd-global-search',
        group: 'Perintah Utama',
        label: 'Pencarian Global Lintas Catatan, Tugas, Pintasan & Agenda',
        subtitle: 'Cari isi widget di semua workspace (Alt+F)',
        icon: <Search size={15} className="text-sky-500" />,
        run: () => window.dispatchEvent(new CustomEvent('ws:open-global-search')),
      },
      {
        id: 'cmd-toggle-edit',
        group: 'Perintah Utama',
        label: 'Masuk / Keluar Mode Atur Layout Widget',
        subtitle: 'Geser posisi atau ubah ukuran kolom widget (Alt+E)',
        icon: <LayoutGrid size={15} className="text-amber-500" />,
        run: () => store.toggleEditMode(),
      },
      {
        id: 'cmd-toggle-theme',
        group: 'Perintah Utama',
        label: `Ganti Tema Tampilan (Saat ini: ${
          settings.theme === 'dark'
            ? 'Gelap'
            : settings.theme === 'light'
            ? 'Terang'
            : 'Sistem'
        })`,
        subtitle: 'Beralih antara mode Terang dan Gelap (Alt+T)',
        icon:
          settings.theme === 'dark' ? (
            <Sun size={15} className="text-amber-500" />
          ) : (
            <Moon size={15} className="text-sky-500" />
          ),
        run: () =>
          updateSettings({
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          }),
      },
      {
        id: 'cmd-export-json',
        group: 'Perintah Utama',
        label: 'Ekspor Data & Layout Dashboard (.json)',
        subtitle: 'Unduh cadangan JSON seluruh workspace',
        icon: <Download size={15} className="text-emerald-500" />,
        run: () => store.exportDashboardJson(),
      },
      {
        id: 'cmd-open-data-modal',
        group: 'Perintah Utama',
        label: 'Impor Data JSON & Pengaturan Notifikasi Browser',
        subtitle: 'Pulihkan cadangan JSON atau aktifkan notifikasi',
        icon: <Download size={15} className="text-sky-500" />,
        run: () => window.dispatchEvent(new CustomEvent('ws:open-data-modal')),
      },
      {
        id: 'cmd-open-settings',
        group: 'Perintah Utama',
        label: 'Buka Pengaturan Sistem (Settings)',
        subtitle: 'Kustomisasi tema, taskbar, suara, dan penyimpanan',
        icon: <Settings size={15} className="text-violet-500" />,
        run: () => openApp('settings'),
      },
      {
        id: 'cmd-cycle-wallpaper',
        group: 'Perintah Utama',
        label: 'Ganti Wallpaper Latar Belakang',
        subtitle: 'Beralih ke tema latar belakang berikutnya',
        icon: <Wallpaper size={15} className="text-sky-500" />,
        run: () => cycleWallpaper(),
      }
    );

    // 4. Aplikasi Terpasang
    allApps
      .filter((a) => installedAppIds.includes(a.id))
      .forEach((app) => {
        items.push({
          id: `app-${app.id}`,
          group: 'Aplikasi',
          label: `Buka Aplikasi: ${app.name}`,
          subtitle: app.description.id,
          icon: <AppIcon icon={app.icon} appId={app.id} size="sm" />,
          run: () => openApp(app.id),
        });
      });

    // 5. Berkas VFS
    files
      .filter((f) => !f.isTrash && !f.isFolder)
      .slice(0, 6)
      .forEach((f) => {
        items.push({
          id: `file-${f.id}`,
          group: 'Berkas VFS',
          label: `Buka Berkas: ${f.name}`,
          subtitle: 'Buka di dalam aplikasi Notepad',
          icon: <FileText size={15} className="text-sky-500" />,
          run: () =>
            openApp('notepad', {
              fileId: f.id,
              customTitle: `Notepad — ${f.name}`,
            }),
        });
      });

    return items;
  }, [
    workspaces,
    activeWorkspaceId,
    store,
    settings.theme,
    updateSettings,
    openApp,
    cycleWallpaper,
    allApps,
    installedAppIds,
    files,
  ]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
      return;
    }
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.run();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={() => setCommandPaletteOpen(false)}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[1150] bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden text-xs"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search size={17} className="text-sky-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            aria-label="Cari perintah di Command Palette"
            placeholder="Cari perintah: pindah workspace, tambah widget, ganti tema, ekspor JSON..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-[var(--text-muted)]">
            ESC
          </kbd>
          <button
            type="button"
            aria-label="Tutup Command Palette"
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Command List with Arrow Navigation */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Tidak ada perintah yang cocok dengan &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    cmd.run();
                    setCommandPaletteOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-sky-500 text-white'
                      : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{cmd.label}</div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected
                            ? 'text-sky-100'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {cmd.group} • {cmd.subtitle}
                      </div>
                    </div>
                  </div>
                  <CornerDownLeft
                    size={13}
                    className={
                      isSelected ? 'text-white shrink-0' : 'opacity-30 shrink-0'
                    }
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-slate-100/60 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Gunakan panah ↑↓ untuk memilih, Enter untuk menjalankan</span>
          <span className="font-mono">{filteredCommands.length} perintah</span>
        </div>
      </div>
    </div>
  );
};
