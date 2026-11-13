import React, { useState } from 'react';
import {
  MoreVertical,
  Settings,
  Copy,
  Trash2,
  GripVertical,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Loader2,
  X,
  Check,
  Clock,
  Timer,
  CheckSquare,
  StickyNote,
  Calendar,
  Bookmark,
  BarChart3,
  FolderKanban,
} from 'lucide-react';
import { WidgetSpan, WidgetType, WidgetVisualState } from '../../types/dashboard';
import { useDashboardStoreApi } from '../../store/DashboardStore';
import { WIDGET_CATALOG_META } from '../../utils/storageMigration';

interface WidgetCardShellProps {
  widgetId: string;
  type: WidgetType;
  title: string;
  colSpan: WidgetSpan;
  editMode: boolean;
  rightInfo?: React.ReactNode;
  customBgStyle?: React.CSSProperties;
  visualState?: WidgetVisualState;
  settingsContent?: React.ReactNode;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
  children: React.ReactNode;
}

export const renderWidgetTypeIcon = (type: WidgetType, size = 14) => {
  switch (type) {
    case 'clock_date':
      return <Clock size={size} />;
    case 'focus_timer':
      return <Timer size={size} />;
    case 'today_tasks':
      return <CheckSquare size={size} />;
    case 'quick_note':
      return <StickyNote size={size} />;
    case 'agenda':
      return <Calendar size={size} />;
    case 'shortcuts':
      return <Bookmark size={size} />;
    case 'weekly_activity':
      return <BarChart3 size={size} />;
    case 'project_status':
      return <FolderKanban size={size} />;
  }
};

export const WidgetCardShell: React.FC<WidgetCardShellProps> = React.memo(
  ({
    widgetId,
    type,
    title,
    colSpan,
    editMode,
    rightInfo,
    customBgStyle,
    visualState = 'ready',
    settingsContent,
    onDragStart,
    onDragOver,
    onDrop,
    children,
  }) => {
    const store = useDashboardStoreApi();
    const meta = WIDGET_CATALOG_META[type];

    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [titleDraft, setTitleDraft] = useState(title);

    const canShrink = colSpan > meta.minColSpan;
    const canGrow = colSpan < meta.maxColSpan;

    const handleSaveTitle = (e: React.FormEvent) => {
      e.preventDefault();
      if (titleDraft.trim()) {
        store.renameWidget(widgetId, titleDraft.trim());
      }
    };

    return (
      <section
        aria-label={`Widget ${title}`}
        draggable={editMode}
        onDragStart={() => editMode && onDragStart?.(widgetId)}
        onDragOver={(e) => editMode && onDragOver?.(e, widgetId)}
        onDrop={() => editMode && onDrop?.(widgetId)}
        style={customBgStyle}
        className={`ws-widget-card relative flex flex-col justify-between p-4 backdrop-blur-md ${
          editMode
            ? 'ring-2 ring-sky-500/50 cursor-grab active:cursor-grabbing'
            : ''
        }`}
      >
        {/* Uniform Small Uppercase Gray Header + Right Summary Info (Bagian C) */}
        <header className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 min-w-0">
            {editMode && (
              <span
                className="text-sky-500 shrink-0 cursor-grab"
                title="Seret untuk memindahkan posisi widget"
              >
                <GripVertical size={14} />
              </span>
            )}
            <span className="text-[var(--accent-primary)] shrink-0">
              {renderWidgetTypeIcon(type, 13)}
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {rightInfo && (
              <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--text-muted)]">
                {rightInfo}
              </span>
            )}

            {/* Edit Mode Quick Resize Controls (Bagian B.2 & B.5) */}
            {editMode && (
              <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg p-0.5">
                <button
                  type="button"
                  disabled={!canShrink}
                  onClick={() =>
                    canShrink &&
                    store.resizeWidget(widgetId, (colSpan - 1) as WidgetSpan)
                  }
                  aria-label="Kecilkan lebar widget"
                  title={`Kecilkan lebar (Min ${meta.minColSpan} kolom)`}
                  className="ws-focusable p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Minimize2 size={11} />
                </button>
                <span className="px-1 text-[10px] font-mono font-bold">
                  {colSpan}K
                </span>
                <button
                  type="button"
                  disabled={!canGrow}
                  onClick={() =>
                    canGrow &&
                    store.resizeWidget(widgetId, (colSpan + 1) as WidgetSpan)
                  }
                  aria-label="Perbesar lebar widget"
                  title={`Perbesar lebar (Maks ${meta.maxColSpan} kolom)`}
                  className="ws-focusable p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Maximize2 size={11} />
                </button>
              </div>
            )}

            {/* 3-Dot Widget Menu Button (Bagian B.4) */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Menu opsi untuk widget ${title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                  setConfirmDelete(false);
                }}
                className="ws-focusable p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/60 dark:hover:bg-slate-800/70 transition-colors"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[940] bg-transparent"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setConfirmDelete(false);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setConfirmDelete(false);
                    }}
                  />
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-7 z-[945] w-48 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl text-xs text-slate-800 dark:text-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setTitleDraft(title);
                        setSettingsOpen((s) => !s);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
                    >
                      <Settings size={13} />
                      <span>Pengaturan Widget</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        store.duplicateWidget(widgetId);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sky-500 hover:text-white transition-colors text-left"
                    >
                      <Copy size={13} />
                      <span>Duplikasi Widget</span>
                    </button>

                    <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-left"
                      >
                        <Trash2 size={13} />
                        <span>Hapus Widget...</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 space-y-2 bg-rose-500/10">
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Yakin hapus widget ini?
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              store.removeWidget(widgetId);
                            }}
                            className="flex-1 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-500"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px]"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Inline Widget Settings Panel (Bagian B.1 & B.4) */}
        {settingsOpen && (
          <div className="mb-3 p-3 rounded-xl border border-sky-500/30 bg-slate-100/90 dark:bg-slate-950/90 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-600 dark:text-sky-400">
                Pengaturan Widget
              </span>
              <button
                type="button"
                aria-label="Tutup pengaturan widget"
                onClick={() => setSettingsOpen(false)}
                className="ws-focusable p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X size={13} />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="space-y-1">
              <label className="text-[11px] text-[var(--text-muted)] block">
                Judul Widget
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  maxLength={40}
                  className="ws-focusable flex-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="submit"
                  aria-label="Simpan judul widget"
                  className="ws-focusable px-2.5 py-1 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 flex items-center gap-1"
                >
                  <Check size={12} />
                  <span>Simpan</span>
                </button>
              </div>
            </form>

            {/* Width Span Picker within min/max bounds */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">
                Lebar Kolom ({meta.minColSpan}–{meta.maxColSpan})
              </span>
              <div className="flex items-center gap-1">
                {([1, 2, 3, 4] as WidgetSpan[])
                  .filter((c) => c >= meta.minColSpan && c <= meta.maxColSpan)
                  .map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => store.resizeWidget(widgetId, c)}
                      className={`ws-focusable px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                        colSpan === c
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {c}K
                    </button>
                  ))}
              </div>
            </div>

            {/* Widget-Specific Custom Settings */}
            {settingsContent && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {settingsContent}
              </div>
            )}

            {/* State Simulation Switcher to verify Loading & Error states (Bagian A.5) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">
                Status Tampilan:
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'ready', label: 'Normal' },
                    { id: 'loading', label: 'Memuat' },
                    { id: 'error', label: 'Error' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      store.setWidgetSimulatedState(widgetId, st.id)
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      visualState === st.id
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Body Content with Loading & Error States (Bagian A.5) */}
        <div className="flex-1 flex flex-col justify-between min-h-[130px]">
          {visualState === 'loading' ? (
            <div
              role="status"
              aria-live="polite"
              className="flex-1 flex flex-col items-center justify-center py-6 gap-2 text-[var(--text-muted)]"
            >
              <Loader2 size={22} className="animate-spin text-sky-500" />
              <span className="text-xs font-medium">
                Memuat data widget...
              </span>
            </div>
          ) : visualState === 'error' ? (
            <div
              role="alert"
              className="flex-1 flex flex-col items-center justify-center py-5 px-3 text-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25"
            >
              <AlertTriangle size={20} className="text-rose-500" />
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Gagal memuat komponen widget
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Terjadi kendala saat menyinkronkan status widget.
              </p>
              <button
                type="button"
                onClick={() => store.setWidgetSimulatedState(widgetId, 'ready')}
                className="ws-focusable mt-1 px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-500"
              >
                Muat Ulang Widget
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      </section>
    );
  }
);
