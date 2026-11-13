import React, { useState, useEffect } from 'react';
import { Sun, Sunset, Moon, CloudSun } from 'lucide-react';
import {
  useDashboardStoreApi,
  useWidgetById,
} from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';

interface ClockDateWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const ClockDateWidget: React.FC<ClockDateWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'clock_date'>(widgetId);
    const store = useDashboardStoreApi();

    // Isolated local clock state so ticking never re-renders the dashboard (Bagian A.7)
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
      const id = window.setInterval(() => {
        setNow(new Date());
      }, 1000);
      return () => window.clearInterval(id);
    }, []);

    if (!widget) return null;

    const hours = now.getHours();
    const getGreeting = () => {
      if (hours >= 4 && hours < 11) {
        return { text: 'Selamat Pagi', icon: <CloudSun size={18} className="text-amber-500" /> };
      }
      if (hours >= 11 && hours < 15) {
        return { text: 'Selamat Siang', icon: <Sun size={18} className="text-amber-500" /> };
      }
      if (hours >= 15 && hours < 18) {
        return { text: 'Selamat Sore', icon: <Sunset size={18} className="text-orange-500" /> };
      }
      return { text: 'Selamat Malam', icon: <Moon size={18} className="text-sky-400" /> };
    };

    const greeting = getGreeting();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: widget.data.showSeconds ? '2-digit' : undefined,
      hour12: false,
    });

    const formattedDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timezoneName =
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Waktu Lokal';

    const settingsContent = (
      <div className="space-y-2 text-[11px]">
        <label className="flex items-center justify-between cursor-pointer">
          <span>Tampilkan Detik</span>
          <input
            type="checkbox"
            checked={widget.data.showSeconds}
            onChange={(e) =>
              store.updateWidgetData<'clock_date'>(widgetId, (prev) => ({
                ...prev,
                showSeconds: e.target.checked,
              }))
            }
            className="accent-sky-500"
          />
        </label>
        <div className="space-y-1">
          <span className="block text-[var(--text-muted)]">Nama Sapaan</span>
          <input
            type="text"
            value={widget.data.customGreetingName}
            maxLength={30}
            onChange={(e) =>
              store.updateWidgetData<'clock_date'>(widgetId, (prev) => ({
                ...prev,
                customGreetingName: e.target.value,
              }))
            }
            placeholder="Contoh: Kreator"
            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>
    );

    return (
      <WidgetCardShell
        widgetId={widgetId}
        type="clock_date"
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        rightInfo={timezoneName}
        visualState={widget.simulatedState}
        settingsContent={settingsContent}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between h-full py-1 gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            {greeting.icon}
            <span>
              {greeting.text}
              {widget.data.customGreetingName
                ? `, ${widget.data.customGreetingName}`
                : ''}!
            </span>
          </div>

          <div className="my-auto">
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
              {formattedTime}
            </div>
            <div className="mt-1 text-xs font-medium text-[var(--text-muted)]">
              {formattedDate}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
            <span>Status Sistem</span>
            <span className="text-emerald-500 font-semibold">● Siap Produktif</span>
          </div>
        </div>
      </WidgetCardShell>
    );
  }
);
