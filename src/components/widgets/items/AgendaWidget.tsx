import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CalendarClock, Flag, BellRing } from 'lucide-react';
import {
  useDashboardSelector,
  useDashboardStoreApi,
  useWidgetById,
} from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';
import { AgendaEventItem } from '../../../types/dashboard';
import { sendSafeBrowserNotification } from '../../../utils/storageMigration';

interface AgendaWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const AgendaWidget: React.FC<AgendaWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'agenda'>(widgetId);
    const store = useDashboardStoreApi();
    const browserNotificationsEnabled = useDashboardSelector(
      (s) => s.browserNotificationsEnabled
    );

    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('09:00');
    const [isDeadline, setIsDeadline] = useState(false);

    // Check deadline notifications every 30s if enabled (Bagian D.5)
    useEffect(() => {
      if (!widget || !browserNotificationsEnabled) return;
      const checkDeadlines = () => {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`;
        widget.data.events.forEach((ev) => {
          if (ev.isDeadline && !ev.notified && ev.time === currentHHMM) {
            sendSafeBrowserNotification(
              'Pengingat Tenggat Agenda',
              `Waktu tenggat untuk "${ev.title}" (${ev.time}) telah tiba.`,
              true
            );
            store.updateWidgetData<'agenda'>(widgetId, (prev) => ({
              ...prev,
              events: prev.events.map((item) =>
                item.id === ev.id ? { ...item, notified: true } : item
              ),
            }));
          }
        });
      };

      const interval = window.setInterval(checkDeadlines, 30000);
      return () => window.clearInterval(interval);
    }, [widget, browserNotificationsEnabled, store, widgetId]);

    if (!widget) return null;

    // Always sort events chronologically by time (Bagian C.5)
    const sortedEvents = [...widget.data.events].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    const deadlineCount = sortedEvents.filter((e) => e.isDeadline).length;

    const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newTitle.trim();
      if (!trimmed) return;
      const item: AgendaEventItem = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: trimmed,
        time: newTime || '09:00',
        isDeadline,
        notified: false,
      };
      store.updateWidgetData<'agenda'>(widgetId, (prev) => ({
        ...prev,
        events: [...prev.events, item],
      }));
      setNewTitle('');
      setIsDeadline(false);
    };

    const handleDeleteEvent = (eventId: string) => {
      store.updateWidgetData<'agenda'>(widgetId, (prev) => ({
        ...prev,
        events: prev.events.filter((ev) => ev.id !== eventId),
      }));
    };

    const toggleDeadlineFlag = (eventId: string) => {
      store.updateWidgetData<'agenda'>(widgetId, (prev) => ({
        ...prev,
        events: prev.events.map((ev) =>
          ev.id === eventId ? { ...ev, isDeadline: !ev.isDeadline } : ev
        ),
      }));
    };

    const addSampleAgenda = () => {
      store.updateWidgetData<'agenda'>(widgetId, () => ({
        events: [
          {
            id: `ev-${Date.now()}-1`,
            title: 'Sinkronisasi Tim Pagi',
            time: '09:00',
            isDeadline: false,
          },
          {
            id: `ev-${Date.now()}-2`,
            title: 'Batas Pengumpulan Laporan',
            time: '16:00',
            isDeadline: true,
          },
        ],
      }));
    };

    const settingsContent = (
      <div className="space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span>Notifikasi Tenggat</span>
          <span className="font-semibold text-sky-500 flex items-center gap-1">
            <BellRing size={11} />
            {browserNotificationsEnabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        {sortedEvents.length > 0 && (
          <button
            type="button"
            onClick={() =>
              store.updateWidgetData<'agenda'>(widgetId, () => ({ events: [] }))
            }
            className="w-full py-1 rounded-lg bg-rose-500/10 text-rose-500 font-semibold hover:bg-rose-500/20"
          >
            Kosongkan Semua Agenda
          </button>
        )}
      </div>
    );

    return (
      <WidgetCardShell
        widgetId={widgetId}
        type="agenda"
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        rightInfo={`${sortedEvents.length} acara${
          deadlineCount > 0 ? ` • ${deadlineCount} tenggat` : ''
        }`}
        visualState={widget.simulatedState}
        settingsContent={settingsContent}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between gap-3 h-full">
          {/* Add Agenda Form */}
          <form onSubmit={handleAddEvent} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                aria-label="Jam acara"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="ws-focusable px-2 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/70 dark:bg-slate-800/70 text-xs font-mono"
              />
              <input
                type="text"
                placeholder="Tambah agenda hari ini..."
                aria-label="Judul acara agenda"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={80}
                className="ws-focusable flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/70 dark:bg-slate-800/70 text-xs placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                aria-label="Tandai sebagai tenggat"
                title="Tandai sebagai tenggat waktu penting"
                onClick={() => setIsDeadline((d) => !d)}
                className={`ws-focusable p-1.5 rounded-xl border transition-colors ${
                  isDeadline
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-rose-500'
                }`}
              >
                <Flag size={13} />
              </button>
              <button
                type="submit"
                aria-label="Tambah acara ke agenda"
                className="ws-focusable p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
          </form>

          {/* Events List or Empty State (Bagian A.5) */}
          {sortedEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)]">
              <CalendarClock size={22} className="text-sky-500/70" />
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                Belum ada agenda terjadwal hari ini
              </div>
              <button
                type="button"
                onClick={addSampleAgenda}
                className="ws-focusable px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-semibold hover:bg-sky-500/25"
              >
                + Muat Contoh Jadwal
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {sortedEvents.map((ev) => (
                <li
                  key={ev.id}
                  className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border transition-colors ${
                    ev.isDeadline
                      ? 'border-rose-500/35 bg-rose-500/10'
                      : 'border-[var(--border-subtle)] bg-slate-100/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold shrink-0">
                      {ev.time}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {ev.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleDeadlineFlag(ev.id)}
                      aria-label={
                        ev.isDeadline
                          ? 'Hapus penanda tenggat'
                          : 'Jadikan tenggat'
                      }
                      title="Klik untuk mengubah status tenggat"
                      className={`ws-focusable px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                        ev.isDeadline
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-700/70 text-[var(--text-muted)] opacity-60 group-hover:opacity-100'
                      }`}
                    >
                      <Flag size={9} />
                      <span>{ev.isDeadline ? 'Tenggat' : 'Acara'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      aria-label={`Hapus acara ${ev.title}`}
                      className="ws-focusable p-1 rounded text-rose-500 opacity-70 hover:opacity-100 hover:bg-rose-500/15"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WidgetCardShell>
    );
  }
);
