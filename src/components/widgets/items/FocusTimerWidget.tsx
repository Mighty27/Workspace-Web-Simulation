import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Flame } from 'lucide-react';
import {
  useDashboardSelector,
  useDashboardStoreApi,
  useWidgetById,
} from '../../../store/DashboardStore';
import { getTodayDateKey, sendBrowserNotification } from '../../../utils/storageMigration';
import { WidgetCardShell } from '../WidgetCardShell';

interface FocusTimerWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'focus_timer'>(widgetId);
    const store = useDashboardStoreApi();
    const browserNotificationsEnabled = useDashboardSelector(
      (s) => s.browserNotificationsEnabled
    );

    const focusMinutes = widget?.data.focusMinutes ?? 25;
    const breakMinutes = widget?.data.breakMinutes ?? 5;
    const todayKey = getTodayDateKey();
    const sessionsToday =
      widget?.data.lastSessionDate === todayKey ? widget.data.sessionsToday : 0;

    // Local ticking state so countdown never re-renders the entire dashboard (Bagian A.7)
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [isRunning, setIsRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);

    // Sync secondsLeft when duration settings change while paused
    useEffect(() => {
      if (!isRunning) {
        setSecondsLeft((mode === 'focus' ? focusMinutes : breakMinutes) * 60);
      }
    }, [focusMinutes, breakMinutes, mode, isRunning]);

    useEffect(() => {
      if (!isRunning) return;
      const timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'focus') {
              store.recordFocusSessionCompleted(widgetId);
              sendBrowserNotification(
                'Sesi Fokus Selesai!',
                `Kerja bagus! Anda menyelesaikan sesi fokus ${focusMinutes} menit. Waktunya istirahat ${breakMinutes} menit.`,
                browserNotificationsEnabled
              );
              setMode('break');
              return breakMinutes * 60;
            } else {
              sendBrowserNotification(
                'Waktu Istirahat Selesai!',
                'Siap memulai sesi fokus berikutnya?',
                browserNotificationsEnabled
              );
              setMode('focus');
              return focusMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [
      isRunning,
      mode,
      focusMinutes,
      breakMinutes,
      widgetId,
      store,
      browserNotificationsEnabled,
    ]);

    if (!widget) return null;

    const totalSeconds = (mode === 'focus' ? focusMinutes : breakMinutes) * 60;
    const progressPercent =
      totalSeconds > 0
        ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100))
        : 0;

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    const handleReset = () => {
      setIsRunning(false);
      setSecondsLeft((mode === 'focus' ? focusMinutes : breakMinutes) * 60);
    };

    const settingsContent = (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-[var(--text-muted)]">
            Durasi Fokus (menit)
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={focusMinutes}
            onChange={(e) => {
              const val = Math.max(1, Math.min(90, Number(e.target.value) || 25));
              store.updateWidgetData<'focus_timer'>(widgetId, (prev) => ({
                ...prev,
                focusMinutes: val,
              }));
            }}
            className="ws-focusable w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-right"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-[var(--text-muted)]">
            Durasi Istirahat (menit)
          </label>
          <input
            type="number"
            min={1}
            max={45}
            value={breakMinutes}
            onChange={(e) => {
              const val = Math.max(1, Math.min(45, Number(e.target.value) || 5));
              store.updateWidgetData<'focus_timer'>(widgetId, (prev) => ({
                ...prev,
                breakMinutes: val,
              }));
            }}
            className="ws-focusable w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-right"
          />
        </div>
      </div>
    );

    return (
      <WidgetCardShell
        widgetId={widget.id}
        type={widget.type}
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        visualState={widget.simulatedState}
        rightInfo={`${sessionsToday} Sesi`}
        settingsContent={settingsContent}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between h-full gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setMode('focus');
                setSecondsLeft(focusMinutes * 60);
              }}
              className={`ws-focusable flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg font-semibold transition-colors ${
                mode === 'focus'
                  ? 'bg-sky-500 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Flame size={12} />
              <span>Fokus ({focusMinutes}m)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setMode('break');
                setSecondsLeft(breakMinutes * 60);
              }}
              className={`ws-focusable flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg font-semibold transition-colors ${
                mode === 'break'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Coffee size={12} />
              <span>Istirahat ({breakMinutes}m)</span>
            </button>
          </div>

          {/* Digital Countdown */}
          <div className="text-center py-1">
            <div
              aria-live="off"
              className="text-3xl font-mono tabular-nums font-bold tracking-tight text-[var(--text-primary)]"
            >
              {mm}:{ss}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {mode === 'focus'
                ? 'Sesi fokus mendalam'
                : 'Istirahat sejenak & regangkan tubuh'}
            </div>
          </div>

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full transition-all duration-150 ${
                mode === 'focus' ? 'bg-sky-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          {/* Action Controls: Mulai / Jeda / Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              aria-label={isRunning ? 'Jeda timer fokus' : 'Mulai timer fokus'}
              className="ws-focusable flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-colors"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{isRunning ? 'Jeda' : 'Mulai'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset timer fokus"
              title="Reset Timer"
              className="ws-focusable p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-slate-200/60 dark:hover:bg-slate-800 text-[var(--text-secondary)] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </WidgetCardShell>
    );
  }
);
