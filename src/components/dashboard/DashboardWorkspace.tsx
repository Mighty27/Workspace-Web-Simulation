import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  LayoutGrid,
  RotateCcw,
  Search,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  Database,
  Edit3,
  Trash2,
  Check,
  X,
  AppWindow,
  Layers,
} from 'lucide-react';
import {
  useDashboardSelector,
  useDashboardStoreApi,
} from '../../store/DashboardStore';
import { useOS } from '../../context/OSContext';
import {
  WidgetInstance,
  WidgetSpan,
  WorkspaceTemplateId,
} from '../../types/dashboard';
import { FocusTimerWidget } from '../widgets/items/FocusTimerWidget';
import { TodayTasksWidget } from '../widgets/items/TodayTasksWidget';
import { QuickNoteWidget } from '../widgets/items/QuickNoteWidget';
import { ShortcutsWidget } from '../widgets/items/ShortcutsWidget';
import { AgendaWidget } from '../widgets/items/AgendaWidget';
import { WeeklyActivityWidget } from '../widgets/items/WeeklyActivityWidget';
import { ProjectStatusWidget } from '../widgets/items/ProjectStatusWidget';
import { ClockDateWidget } from '../widgets/items/ClockDateWidget';
import {
  WidgetGalleryModal,
  GlobalSearchModal,
  KeyboardHelpModal,
  DataAndNotificationModal,
  OnboardingModal,
} from './DashboardModals';

const getColSpanClass = (span: WidgetSpan): string => {
  switch (span) {
    case 1:
      return 'col-span-1';
    case 2:
      return 'col-span-1 md:col-span-2';
    case 3:
      return 'col-span-1 md:col-span-2 lg:col-span-3';
    case 4:
      return 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4';
  }
};

export const DashboardWorkspace: React.FC = () => {
  const store = useDashboardStoreApi();
  const { settings, updateSettings } = useOS();

  const activeWorkspaceId = useDashboardSelector((s) => s.activeWorkspaceId);
  const workspaces = useDashboardSelector((s) => s.workspaces);
  const editMode = useDashboardSelector((s) => s.editMode);
  const showDesktopShortcutsBar = useDashboardSelector(
    (s) => s.showDesktopShortcutsBar
  );

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Modals state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [confirmResetLayout, setConfirmResetLayout] = useState(false);

  // Multi-workspace management state (Bagian D.2)
  const [creatingWs, setCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsTemplate, setNewWsTemplate] =
    useState<WorkspaceTemplateId>('kerja');
  const [renamingWsId, setRenamingWsId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteWsId, setConfirmDeleteWsId] = useState<string | null>(
    null
  );

  // Drag & drop widget IDs (Bagian B.2)
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [highlightedWidgetId, setHighlightedWidgetId] = useState<string | null>(
    null
  );

  const cycleTheme = useCallback(() => {
    const order: ('dark' | 'light' | 'system')[] = ['dark', 'light', 'system'];
    const nextIdx = (order.indexOf(settings.theme) + 1) % order.length;
    updateSettings({ theme: order[nextIdx] });
  }, [settings.theme, updateSettings]);

  // Global keyboard shortcuts for main actions & "?" help panel (Bagian D.4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        setGalleryOpen(false);
        setGlobalSearchOpen(false);
        setHelpOpen(false);
        setDataModalOpen(false);
        setCreatingWs(false);
        setRenamingWsId(null);
        setConfirmResetLayout(false);
        return;
      }

      if (isInput) return;

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setGalleryOpen(true);
      } else if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      } else if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        store.toggleEditMode();
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        cycleTheme();
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen((h) => !h);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, cycleTheme]);

  // Listen for custom events triggered by CommandPalette
  useEffect(() => {
    const onOpenWidgetGallery = () => setGalleryOpen(true);
    const onOpenGlobalSearch = () => setGlobalSearchOpen(true);
    const onOpenDataModal = () => setDataModalOpen(true);
    const onOpenKeyboardHelp = () => setHelpOpen(true);

    window.addEventListener('ws:open-widget-gallery', onOpenWidgetGallery);
    window.addEventListener('ws:open-global-search', onOpenGlobalSearch);
    window.addEventListener('ws:open-data-modal', onOpenDataModal);
    window.addEventListener('ws:open-keyboard-help', onOpenKeyboardHelp);

    return () => {
      window.removeEventListener('ws:open-widget-gallery', onOpenWidgetGallery);
      window.removeEventListener('ws:open-global-search', onOpenGlobalSearch);
      window.removeEventListener('ws:open-data-modal', onOpenDataModal);
      window.removeEventListener('ws:open-keyboard-help', onOpenKeyboardHelp);
    };
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggedWidgetId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (draggedWidgetId && draggedWidgetId !== targetId) {
        store.reorderWidgets(draggedWidgetId, targetId);
      }
      setDraggedWidgetId(null);
    },
    [draggedWidgetId, store]
  );

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newWsName.trim() || 'Workspace Baru';
    store.createWorkspace(name, newWsTemplate);
    setNewWsName('');
    setCreatingWs(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingWsId && renameDraft.trim()) {
      store.renameWorkspace(renamingWsId, renameDraft.trim());
    }
    setRenamingWsId(null);
  };

  const handleSelectSearchResult = (workspaceId: string, widgetId: string) => {
    store.setActiveWorkspace(workspaceId);
    setHighlightedWidgetId(widgetId);
    setTimeout(() => {
      const el = document.getElementById(`widget-container-${widgetId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    setTimeout(() => setHighlightedWidgetId(null), 2200);
  };

  const renderWidgetItem = (widget: WidgetInstance) => {
    const commonProps = {
      widgetId: widget.id,
      editMode,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    };

    switch (widget.type) {
      case 'focus_timer':
        return <FocusTimerWidget {...commonProps} />;
      case 'today_tasks':
        return <TodayTasksWidget {...commonProps} />;
      case 'quick_note':
        return <QuickNoteWidget {...commonProps} />;
      case 'shortcuts':
        return <ShortcutsWidget {...commonProps} />;
      case 'agenda':
        return <AgendaWidget {...commonProps} />;
      case 'weekly_activity':
        return <WeeklyActivityWidget {...commonProps} />;
      case 'project_status':
        return <ProjectStatusWidget {...commonProps} />;
      case 'clock_date':
        return <ClockDateWidget {...commonProps} />;
    }
  };

  const getThemeButtonLabel = () => {
    if (settings.theme === 'light') {
      return { icon: <Sun size={14} className="text-amber-500" />, text: 'Terang' };
    }
    if (settings.theme === 'dark') {
      return { icon: <Moon size={14} className="text-sky-400" />, text: 'Gelap' };
    }
    return { icon: <Monitor size={14} className="text-emerald-400" />, text: 'Sistem' };
  };

  const themeBtn = getThemeButtonLabel();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 pt-3 pb-8 space-y-4 select-none"
    >
      {/* Top Productivity & Multi-Workspace Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl shadow-lg">
        {/* Left: Multi-Workspace Switcher & CRUD (Bagian D.2) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--border-subtle)] text-xs font-bold text-sky-500">
            <Layers size={15} />
            <span className="hidden sm:inline">Workspace:</span>
          </div>

          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspace?.id;
            if (renamingWsId === ws.id) {
              return (
                <form
                  key={ws.id}
                  onSubmit={handleRenameSubmit}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    maxLength={28}
                    className="ws-focusable px-2 py-1 rounded-lg border border-sky-500 bg-white dark:bg-slate-900 text-xs w-28"
                  />
                  <button
                    type="submit"
                    aria-label="Simpan nama workspace"
                    className="p-1 rounded bg-emerald-500 text-white"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="Batal ubah nama workspace"
                    onClick={() => setRenamingWsId(null)}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800"
                  >
                    <X size={12} />
                  </button>
                </form>
              );
            }

            return (
              <div key={ws.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => store.setActiveWorkspace(ws.id)}
                  className={`ws-focusable px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-200/60 dark:bg-slate-800/60 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {ws.name}
                </button>
                {isActive && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      aria-label={`Ubah nama workspace ${ws.name}`}
                      title="Ubah nama workspace"
                      onClick={() => {
                        setRenamingWsId(ws.id);
                        setRenameDraft(ws.name);
                      }}
                      className="ws-focusable p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <Edit3 size={12} />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Hapus workspace ${ws.name}`}
                        title="Hapus workspace ini"
                        onClick={() =>
                          setConfirmDeleteWsId(
                            confirmDeleteWsId === ws.id ? null : ws.id
                          )
                        }
                        className="ws-focusable p-1 rounded-lg text-rose-500/80 hover:text-rose-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {confirmDeleteWsId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px]">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Hapus workspace?
              </span>
              <button
                type="button"
                onClick={() => {
                  store.deleteWorkspace(confirmDeleteWsId);
                  setConfirmDeleteWsId(null);
                }}
                className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteWsId(null)}
                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800"
              >
                Batal
              </button>
            </div>
          )}

          {!creatingWs ? (
            <button
              type="button"
              onClick={() => setCreatingWs(true)}
              aria-label="Buat workspace baru"
              title="Buat workspace baru"
              className="ws-focusable px-2.5 py-1.5 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-sky-500 text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Workspace Baru</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateWorkspace}
              className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800/80"
            >
              <input
                type="text"
                autoFocus
                placeholder="Nama workspace..."
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                maxLength={28}
                className="ws-focusable px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs w-32"
              />
              <select
                aria-label="Pilih template workspace baru"
                value={newWsTemplate}
                onChange={(e) =>
                  setNewWsTemplate(e.target.value as WorkspaceTemplateId)
                }
                className="ws-focusable px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs"
              >
                <option value="kerja">Template Kerja</option>
                <option value="belajar">Template Belajar</option>
                <option value="proyek">Template Proyek</option>
              </select>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-xs font-semibold"
              >
                Buat
              </button>
              <button
                type="button"
                onClick={() => setCreatingWs(false)}
                className="p-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                <X size={13} />
              </button>
            </form>
          )}
        </div>

        {/* Right: Dashboard Actions & Productivity Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(true)}
            aria-label="Cari di seluruh catatan, tugas, pintasan, dan agenda"
            className="ws-focusable flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-[var(--text-secondary)]"
          >
            <Search size={13} className="text-sky-500" />
            <span>Cari Global</span>
          </button>

          {/* Add Widget Button (Bagian B.3) */}
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            aria-label="Tambah widget baru"
            className="ws-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm"
          >
            <Plus size={14} />
            <span>Tambah Widget</span>
          </button>

          {/* Edit Mode Toggle (Bagian B.5) */}
          <button
            type="button"
            onClick={() => store.toggleEditMode()}
            aria-pressed={editMode}
            className={`ws-focusable flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              editMode
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-[var(--border-subtle)] bg-slate-200/50 dark:bg-slate-800/60 text-[var(--text-secondary)] hover:border-sky-500/40'
            }`}
          >
            <LayoutGrid size={13} />
            <span>{editMode ? 'Selesai Edit' : 'Atur Layout'}</span>
          </button>

          {/* Reset Layout Button (Bagian B.4) */}
          {!confirmResetLayout ? (
            <button
              type="button"
              onClick={() => setConfirmResetLayout(true)}
              aria-label="Atur ulang layout ke bawaan"
              title="Atur ulang layout workspace ini ke bawaan"
              className="ws-focusable flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-[var(--text-secondary)]"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Atur Ulang Layout</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px]">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Reset layout?
              </span>
              <button
                type="button"
                onClick={() => {
                  store.resetActiveWorkspaceLayout();
                  setConfirmResetLayout(false);
                }}
                className="px-2 py-0.5 rounded bg-amber-500 text-white font-semibold"
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetLayout(false)}
                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800"
              >
                Batal
              </button>
            </div>
          )}

          {/* Manual Theme Toggle: Light / Dark / System (Bagian A.3) */}
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Ganti tema tampilan, saat ini ${themeBtn.text}`}
            title="Klik untuk beralih antara mode Terang, Gelap, atau Sistem"
            className="ws-focusable flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-[var(--text-secondary)]"
          >
            {themeBtn.icon}
            <span className="hidden md:inline">{themeBtn.text}</span>
          </button>

          {/* Export / Import JSON & Browser Notifications */}
          <button
            type="button"
            onClick={() => setDataModalOpen(true)}
            aria-label="Ekspor, impor data JSON, dan pengaturan notifikasi"
            title="Cadangan JSON & Notifikasi Browser"
            className="ws-focusable flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-[var(--text-secondary)]"
          >
            <Database size={13} className="text-sky-500" />
            <span className="hidden xl:inline">Data & Notifikasi</span>
          </button>

          {/* Toggle Desktop OS Shortcuts Bar */}
          <button
            type="button"
            onClick={() =>
              store.setShowDesktopShortcutsBar(!showDesktopShortcutsBar)
            }
            aria-label="Tampilkan atau sembunyikan bar aplikasi desktop"
            title="Tampilkan/sembunyikan pintasan aplikasi desktop"
            className={`ws-focusable flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              showDesktopShortcutsBar
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                : 'bg-slate-200/50 dark:bg-slate-800/60 text-[var(--text-secondary)]'
            }`}
          >
            <AppWindow size={13} />
            <span className="hidden xl:inline">Aplikasi OS</span>
          </button>

          {/* "?" Keyboard Shortcuts Help Button (Bagian D.4) */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Bantuan pintasan keyboard"
            title="Pintasan Keyboard (?)"
            className="ws-focusable w-7 h-7 rounded-xl bg-slate-200/60 dark:bg-slate-800/70 hover:bg-sky-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-700 dark:text-amber-300"
        >
          <span>
            <strong>Mode Atur Layout Aktif:</strong> Seret kartu widget untuk
            memindahkan urutan, atau gunakan tombol <strong>1K–4K</strong> di
            header kartu untuk mengubah lebar kolom.
          </span>
          <button
            type="button"
            onClick={() => store.setEditMode(false)}
            className="ws-focusable px-3 py-1 rounded-lg bg-amber-500 text-white font-semibold"
          >
            Selesai Edit
          </button>
        </div>
      )}

      {/* Responsive Widget Grid: 1 col HP, 2 col Tablet, 3-4 col Desktop (Bagian A.4) */}
      {!activeWorkspace || activeWorkspace.widgets.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
          <div className="text-sm font-bold text-[var(--text-primary)]">
            Workspace &ldquo;{activeWorkspace?.name}&rdquo; masih kosong
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Tambahkan widget produktivitas seperti Fokus Timer, Tugas Hari Ini,
            Catatan Cepat, atau Agenda untuk mulai bekerja.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="ws-focusable px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Tambah Widget Pertama</span>
            </button>
            <button
              type="button"
              onClick={() => store.resetActiveWorkspaceLayout()}
              className="ws-focusable px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
            >
              Muat Layout Bawaan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {activeWorkspace.widgets.map((widget) => (
            <div
              key={widget.id}
              id={`widget-container-${widget.id}`}
              className={`${getColSpanClass(widget.colSpan)} flex flex-col ${
                highlightedWidgetId === widget.id
                  ? 'ring-4 ring-sky-500 rounded-2xl transition-all'
                  : ''
              }`}
            >
              {renderWidgetItem(widget)}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <WidgetGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
      <GlobalSearchModal
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onSelectWidgetResult={handleSelectSearchResult}
      />
      <KeyboardHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <DataAndNotificationModal
        open={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
      />
      <OnboardingModal />
    </div>
  );
};
