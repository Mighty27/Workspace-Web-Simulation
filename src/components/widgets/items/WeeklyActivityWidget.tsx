import React from 'react';
import { BarChart3, Flame, CheckCircle2 } from 'lucide-react';
import {
  useDashboardSelector,
  useDashboardStoreApi,
  useWidgetById,
} from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';
import { getLast7DaysActivity } from '../../../utils/storageMigration';

interface WeeklyActivityWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const WeeklyActivityWidget: React.FC<WeeklyActivityWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'weekly_activity'>(widgetId);
    const activityLog = useDashboardSelector((s) => s.activityLog);
    const store = useDashboardStoreApi();

    if (!widget) return null;

    const days = getLast7DaysActivity(activityLog);
    const totalFocus = days.reduce((acc, d) => acc + d.focusSessions, 0);
    const totalTasks = days.reduce((acc, d) => acc + d.completedTasks, 0);
    const grandTotal = totalFocus + totalTasks;
    const maxDayTotal = Math.max(
      widget.data.goalPerDay || 6,
      ...days.map((d) => d.focusSessions + d.completedTasks),
      1
    );

    const settingsContent = (
      <div className="space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span>Target Aktivitas Harian</span>
          <input
            type="number"
            min={1}
            max={30}
            value={widget.data.goalPerDay}
            onChange={(e) => {
              const val = Math.max(1, Math.min(30, Number(e.target.value) || 6));
              store.updateWidgetData<'weekly_activity'>(widgetId, () => ({
                goalPerDay: val,
              }));
            }}
            className="w-16 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono"
          />
        </div>
      </div>
    );

    return (
      <WidgetCardShell
        widgetId={widgetId}
        type="weekly_activity"
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        rightInfo={`${grandTotal} total minggu ini`}
        visualState={widget.simulatedState}
        settingsContent={settingsContent}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {grandTotal === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)]">
            <BarChart3 size={22} className="text-sky-500/70" />
            <div className="text-xs font-medium text-[var(--text-secondary)]">
              Belum ada aktivitas minggu ini
            </div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-[220px]">
              Selesaikan sesi Fokus Timer atau centang Tugas Hari Ini untuk melihat grafik.
            </p>
            <button
              type="button"
              onClick={() => store.recordTaskCompletionDelta(1)}
              className="ws-focusable px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-semibold hover:bg-sky-500/25"
            >
              + Catat 1 Aktivitas Sekarang
            </button>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-3 h-full">
            {/* Summary Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <Flame size={14} className="text-sky-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Sesi Fokus
                  </div>
                  <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    {totalFocus} sesi
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Tugas Selesai
                  </div>
                  <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    {totalTasks} tugas
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Mini Bar Chart (Bagian C.6) */}
            <div
              className="grid grid-cols-7 gap-2 items-end pt-3 pb-1 px-1 h-28"
              role="img"
              aria-label="Grafik batang aktivitas 7 hari terakhir"
            >
              {days.map((day, idx) => {
                const dayTotal = day.focusSessions + day.completedTasks;
                const heightPct = Math.max(
                  8,
                  Math.min(100, Math.round((dayTotal / maxDayTotal) * 100))
                );
                const focusPct =
                  dayTotal > 0
                    ? Math.round((day.focusSessions / dayTotal) * 100)
                    : 0;
                const isToday = idx === days.length - 1;

                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-col items-center justify-end h-full gap-1 group"
                    title={`${day.label} (${day.dateKey}): ${day.focusSessions} fokus, ${day.completedTasks} tugas`}
                  >
                    <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-80 group-hover:opacity-100">
                      {dayTotal}
                    </span>
                    <div className="w-full max-w-[22px] h-16 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 flex flex-col justify-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-md overflow-hidden flex flex-col justify-end transition-all duration-150"
                      >
                        {/* Tasks portion */}
                        <div
                          style={{ height: `${100 - focusPct}%` }}
                          className="w-full bg-emerald-500"
                        />
                        {/* Focus portion */}
                        <div
                          style={{ height: `${focusPct}%` }}
                          className="w-full bg-sky-500"
                        />
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isToday
                          ? 'text-sky-500 font-bold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </WidgetCardShell>
    );
  }
);
