import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Search,
  Keyboard,
  Download,
  Upload,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Briefcase,
  FolderKanban,
} from 'lucide-react';
import {
  useDashboardSelector,
  useDashboardStoreApi,
} from '../../store/DashboardStore';
import {
  WIDGET_CATALOG_META,
  requestBrowserNotificationPermission,
  sanitizeExternalUrl,
} from '../../utils/storageMigration';
import {
  AgendaWidgetData,
  QuickNoteData,
  ShortcutsWidgetData,
  TodayTasksData,
  WidgetType,
  WorkspaceTemplateId,
} from '../../types/dashboard';
import { renderWidgetTypeIcon } from '../widgets/WidgetCardShell';

/* ============================================================================
 * 1. GALERI TAMBAH WIDGET (Bagian B.3)
 * ========================================================================== */
interface WidgetGalleryModalProps {
  open: boolean;
  onClose: () => void;
}

const MINI_PREVIEWS: Record<WidgetType, React.ReactNode> = {
  focus_timer: (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] font-mono">
      <span className="font-bold text-sky-500">25:00</span>
      <span className="px-1.5 py-0.5 rounded bg-sky-500 text-white text-[9px]">
        FOKUS
      </span>
    </div>
  ),
  today_tasks: (
    <div className="space-y-1 text-[10px]">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
        <span className="line-through opacity-60">Riset arsitektur</span>
        <span className="ml-auto px-1 rounded bg-rose-500/15 text-rose-500 text-[9px]">
          Tinggi
        </span>
      </div>
    </div>
  ),
  quick_note: (
    <div className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-300 truncate">
      Catatan otomatis tersimpan...
    </div>
  ),
  shortcuts: (
    <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold">
      <span className="px-1.5 py-1 rounded bg-slate-200/70 dark:bg-slate-800 truncate">
        🌐 GitHub
      </span>
      <span className="px-1.5 py-1 rounded bg-slate-200/70 dark:bg-slate-800 truncate">
        📚 MDN Docs
      </span>
    </div>
  ),
  agenda: (
    <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[10px]">
      <span className="font-mono font-bold text-sky-500">14:00</span>
      <span className="truncate mx-1">Rilis Produk</span>
      <span className="px-1 rounded bg-rose-500 text-white text-[8px]">
        TENGGAT
      </span>
    </div>
  ),
  weekly_activity: (
    <div className="flex items-end gap-1 h-6 px-2">
      {[35, 65, 50, 85, 70, 95, 60].map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className="flex-1 rounded-t bg-sky-500"
        />
      ))}
    </div>
  ),
  project_status: (
    <div className="space-y-1 text-[10px]">
      <div className="flex justify-between">
        <span className="font-semibold">Sistem Widget</span>
        <span className="text-emerald-500 font-mono">80%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full w-4/5 bg-emerald-500" />
      </div>
    </div>
  ),
  clock_date: (
    <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/70 text-[10px]">
      <span className="font-mono font-bold text-xs">09:42</span>
      <span className="text-[var(--text-muted)]">Selamat Pagi!</span>
    </div>
  ),
};

export const WidgetGalleryModal: React.FC<WidgetGalleryModalProps> = ({
  open,
  onClose,
}) => {
  const store = useDashboardStoreApi();

  if (!open) return null;

  const widgetTypes = Object.keys(WIDGET_CATALOG_META) as WidgetType[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galeri Tambah Widget"
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold">Galeri Widget Workspace</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Pilih widget baru untuk ditambahkan ke workspace aktif Anda
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup galeri widget"
            className="ws-focusable p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {widgetTypes.map((type) => {
            const meta = WIDGET_CATALOG_META[type];
            return (
              <div
                key={type}
                className="flex flex-col justify-between p-4 rounded-2xl border border-[var(--border-subtle)] bg-slate-100/50 dark:bg-slate-900/50 hover:border-sky-500/50 transition-all gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-sky-500/15 text-sky-500">
                        {renderWidgetTypeIcon(type, 16)}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold">{meta.title}</h3>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Ukuran default: {meta.defaultColSpan} kolom (Min {meta.minColSpan}–Maks {meta.maxColSpan})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Line Description (Bagian B.3) */}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                    {meta.description}
                  </p>

                  {/* Mini Preview */}
                  <div className="pt-1">{MINI_PREVIEWS[type]}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    store.addWidget(type);
                    onClose();
                  }}
                  className="ws-focusable w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  <span>Tambahkan ke Workspace</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. PENCARIAN GLOBAL LINTAS CATATAN, TUGAS, PINTASAN, AGENDA (Bagian D.3)
 * ========================================================================== */
interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectWidgetResult: (workspaceId: string, widgetId: string) => void;
}

interface SearchHit {
  id: string;
  category: 'Tugas' | 'Catatan' | 'Pintasan' | 'Agenda';
  title: string;
  subtitle: string;
  workspaceId: string;
  workspaceName: string;
  widgetId: string;
  externalUrl?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  onClose,
  onSelectWidgetResult,
}) => {
  const workspaces = useDashboardSelector((s) => s.workspaces);
  const [query, setQuery] = useState('');

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: SearchHit[] = [];

    workspaces.forEach((ws) => {
      ws.widgets.forEach((w) => {
        if (w.type === 'today_tasks') {
          const data = w.data as TodayTasksData;
          data.tasks.forEach((t) => {
            if (t.title.toLowerCase().includes(q)) {
              hits.push({
                id: `hit-task-${t.id}`,
                category: 'Tugas',
                title: t.title,
                subtitle: `Prioritas ${t.priority.toUpperCase()} • ${
                  t.completed ? 'Selesai' : 'Belum selesai'
                }`,
                workspaceId: ws.id,
                workspaceName: ws.name,
                widgetId: w.id,
              });
            }
          });
        } else if (w.type === 'quick_note') {
          const data = w.data as QuickNoteData;
          if (
            data.content.toLowerCase().includes(q) ||
            w.title.toLowerCase().includes(q)
          ) {
            hits.push({
              id: `hit-note-${w.id}`,
              category: 'Catatan',
              title: w.title,
              subtitle: data.content.slice(0, 90),
              workspaceId: ws.id,
              workspaceName: ws.name,
              widgetId: w.id,
            });
          }
        } else if (w.type === 'shortcuts') {
          const data = w.data as ShortcutsWidgetData;
          data.links.forEach((l) => {
            if (
              l.name.toLowerCase().includes(q) ||
              l.url.toLowerCase().includes(q)
            ) {
              hits.push({
                id: `hit-link-${l.id}`,
                category: 'Pintasan',
                title: l.name,
                subtitle: l.url,
                workspaceId: ws.id,
                workspaceName: ws.name,
                widgetId: w.id,
                externalUrl: sanitizeExternalUrl(l.url) || undefined,
              });
            }
          });
        } else if (w.type === 'agenda') {
          const data = w.data as AgendaWidgetData;
          data.events.forEach((ev) => {
            if (ev.title.toLowerCase().includes(q) || ev.time.includes(q)) {
              hits.push({
                id: `hit-agenda-${ev.id}`,
                category: 'Agenda',
                title: `${ev.time} — ${ev.title}`,
                subtitle: ev.isDeadline ? 'Tenggat Waktu Penting' : 'Acara Harian',
                workspaceId: ws.id,
                workspaceName: ws.name,
                widgetId: w.id,
              });
            }
          });
        }
      });
    });

    return hits;
  }, [query, workspaces]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Global Workspace"
      className="fixed inset-0 z-[1100] flex items-start justify-center pt-16 p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search size={18} className="text-sky-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tugas, catatan cepat, pintasan, atau agenda..."
            aria-label="Kata kunci pencarian global"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pencarian global"
            className="ws-focusable p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-1.5">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Ketik kata kunci untuk mencari di seluruh Tugas, Catatan Cepat, Pintasan, dan Agenda lintas workspace.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;.
            </div>
          ) : (
            results.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  onSelectWidgetResult(hit.workspaceId, hit.widgetId);
                  onClose();
                }}
                className="ws-focusable w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-sky-500/10 border border-transparent hover:border-sky-500/30 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase">
                      {hit.category}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Workspace: <strong>{hit.workspaceName}</strong>
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-1 truncate">
                    {hit.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {hit.subtitle}
                  </div>
                </div>
                {hit.externalUrl ? (
                  <ExternalLink size={14} className="text-sky-500 shrink-0" />
                ) : (
                  <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. PANEL BANTUAN PINTASAN KEYBOARD "?" (Bagian D.4)
 * ========================================================================== */
interface KeyboardHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  const shortcuts = [
    { keys: 'Ctrl + K / Cmd + K', desc: 'Buka Command Palette (Eksekusi Cepat)' },
    { keys: 'Alt + N', desc: 'Buka Galeri Tambah Widget Baru' },
    { keys: 'Alt + F', desc: 'Buka Pencarian Global Lintas Workspace' },
    { keys: 'Alt + E', desc: 'Masuk / Keluar Mode Atur Layout Widget' },
    { keys: 'Alt + T', desc: 'Ganti Tema Tampilan (Terang / Gelap)' },
    { keys: '?', desc: 'Buka Panel Bantuan Pintasan Keyboard Ini' },
    { keys: 'Esc', desc: 'Tutup Dialog, Menu, atau Mode Edit' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daftar Pintasan Keyboard"
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-sky-500" />
            <h2 className="text-sm font-bold">Pintasan Keyboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup bantuan pintasan keyboard"
            className="ws-focusable p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-none text-xs"
            >
              <span className="text-[var(--text-secondary)]">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 shrink-0">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. MODAL EKSPOR / IMPOR JSON & NOTIFIKASI BROWSER (Bagian D.5 & D.6)
 * ========================================================================== */
interface DataAndNotificationModalProps {
  open: boolean;
  onClose: () => void;
}

export const DataAndNotificationModal: React.FC<DataAndNotificationModalProps> = ({
  open,
  onClose,
}) => {
  const store = useDashboardStoreApi();
  const browserNotificationsEnabled = useDashboardSelector(
    (s) => s.browserNotificationsEnabled
  );

  const [jsonInput, setJsonInput] = useState('');
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (!open) return null;

  const handleToggleNotification = async () => {
    if (!browserNotificationsEnabled) {
      const res = await requestBrowserNotificationPermission();
      store.setBrowserNotificationsEnabled(true);
      setFeedback({
        ok: true,
        message: res.granted
          ? res.message
          : 'Pengingat fokus & tenggat agenda telah diaktifkan di aplikasi.',
      });
    } else {
      store.setBrowserNotificationsEnabled(false);
      setFeedback({
        ok: true,
        message: 'Notifikasi browser dinonaktifkan.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setJsonInput(content);
      const result = store.importDashboardJson(content);
      setFeedback(result);
    };
    reader.readAsText(file);
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    const result = store.importDashboardJson(jsonInput);
    setFeedback(result);
    if (result.ok) {
      setJsonInput('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cadangan Data JSON dan Notifikasi"
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold">
            Ekspor / Impor Data & Notifikasi
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog data dan notifikasi"
            className="ws-focusable p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {feedback && (
            <div
              role="alert"
              className={`flex items-center gap-2 p-3 rounded-xl border ${
                feedback.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 size={15} className="shrink-0" />
              ) : (
                <AlertCircle size={15} className="shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Browser Notification Setting (Bagian D.5) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/50 dark:bg-slate-900/50">
            <div className="space-y-0.5 pr-3">
              <div className="font-bold flex items-center gap-1.5">
                <Bell size={14} className="text-sky-500" />
                <span>Notifikasi Browser (Fokus & Tenggat Agenda)</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Izin hanya diminta saat Anda mengaktifkan tombol ini.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleNotification}
              className={`ws-focusable px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                browserNotificationsEnabled
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-[var(--text-secondary)]'
              }`}
            >
              {browserNotificationsEnabled ? 'Aktif' : 'Aktifkan'}
            </button>
          </div>

          {/* Export JSON */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/50 dark:bg-slate-900/50">
            <div>
              <div className="font-bold">Ekspor Seluruh Workspace (JSON)</div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Unduh salinan lengkap semua workspace, layout, dan isi widget.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                store.exportDashboardJson();
                setFeedback({
                  ok: true,
                  message: 'Berkas JSON berhasil diekspor dan diunduh.',
                });
              }}
              className="ws-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold shrink-0"
            >
              <Download size={13} />
              <span>Ekspor JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <form onSubmit={handleManualImport} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold">Impor Data JSON</span>
              <label className="ws-focusable cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white font-semibold text-[11px] transition-colors">
                <Upload size={12} />
                <span>Pilih Berkas .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Atau tempelkan isi JSON cadangan Anda di sini...'
              className="ws-focusable w-full p-2.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/60 dark:bg-slate-900/60 font-mono text-[11px]"
            />
            <button
              type="submit"
              className="ws-focusable w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold"
            >
              Validasi & Pulihkan Data JSON
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. ONBOARDING SINGKAT 3 LANGKAH DENGAN TEMPLATE AWAL (Bagian D.7)
 * ========================================================================== */
export const OnboardingModal: React.FC = () => {
  const onboardingCompleted = useDashboardSelector(
    (s) => s.onboardingCompleted
  );
  const store = useDashboardStoreApi();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkspaceTemplateId>('kerja');

  if (onboardingCompleted) return null;

  const templates: {
    id: WorkspaceTemplateId;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'belajar',
      title: 'Belajar',
      desc: 'Fokus Timer Pomodoro, Tugas Belajar, Catatan Ringkasan, dan Pintasan Referensi.',
      icon: <BookOpen size={18} className="text-sky-500" />,
    },
    {
      id: 'kerja',
      title: 'Kerja',
      desc: 'Jam & Sapaan, Fokus Timer, Tugas Hari Ini, Agenda Tenggat, Catatan Cepat, dan Pintasan.',
      icon: <Briefcase size={18} className="text-emerald-500" />,
    },
    {
      id: 'proyek',
      title: 'Proyek',
      desc: 'Status Proyek & Progress, Aktivitas Mingguan, Tugas Sprint, dan Agenda Rilis.',
      icon: <FolderKanban size={18} className="text-amber-500" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Awal Workspace"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sky-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">
              Langkah {step} dari 3
            </span>
          </div>
          <button
            type="button"
            onClick={() => store.completeOnboarding()}
            className="ws-focusable text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg"
          >
            Lewati Panduan
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">
                Selamat Datang di WebWorkstation Dashboard
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Workspace ini menggabungkan kemudahan desktop modern dengan
                <strong> Sistem Widget Produktivitas Modular</strong> yang
                tersimpan otomatis di perangkat Anda.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="font-bold text-sky-500">8 Widget Aktif</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Pomodoro, Tugas, Catatan, Agenda, Grafik & Proyek.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-500">Multi-Workspace</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Pisahkan layout Belajar, Kerja, dan Proyek dengan mudah.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="font-bold text-amber-500">Command Palette</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Tekan Ctrl+K kapan saja untuk aksi cepat dengan keyboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">
                Pilih Template Workspace Awal Anda
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Anda tetap dapat berpindah atau membuat workspace baru kapan saja.
              </p>
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`ws-focusable w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                        : 'border-[var(--border-subtle)] hover:border-sky-500/40'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 shrink-0">
                      {tpl.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{tpl.title}</div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {tpl.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">
                Kustomisasi Layout & Pintasan Cepat
              </h2>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>
                    Gunakan tombol <strong>Atur Layout</strong> untuk menggeser
                    posisi (drag & drop) dan mengubah lebar kolom widget.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>
                    Klik menu tiga titik (⋮) di pojok kanan atas kartu untuk
                    <strong> Pengaturan, Duplikasi, atau Hapus</strong> widget.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>
                    Tekan tombol <strong>?</strong> di toolbar atas untuk melihat
                    semua pintasan keyboard.
                  </span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="ws-focusable px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
              >
                Kembali
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="ws-focusable px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                onClick={() => store.applyOnboardingTemplate(selectedTemplate)}
                className="ws-focusable px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold"
              >
                Mulai Gunakan Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
