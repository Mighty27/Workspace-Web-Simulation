import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flag, Plus, Trash2, Bell } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { playSystemSound } from '../../services/storage';

interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

export const ClockApp: React.FC = () => {
  const { settings, notify, t } = useOS();
  const [tab, setTab] = useState<'clock' | 'timer' | 'stopwatch' | 'alarm'>('clock');
  const [now, setNow] = useState(new Date());

  // Timer state
  const [timerDuration, setTimerDuration] = useState(300); // 5 mins
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);

  // Stopwatch state
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Alarms state
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    { id: 'al-1', time: '08:00', label: 'Daily Standup & Fokus Pagi', enabled: true },
    { id: 'al-2', time: '17:00', label: 'Backup & Ekspor Workspace', enabled: false },
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState('09:30');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playSystemSound('alarm', settings.bootSound);
          notify(
            t('Waktu Habis!', 'Timer Finished!'),
            t('Pewaktu hitung mundur Anda telah selesai.', 'Your countdown timer has finished.'),
            'clock'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, notify, settings.bootSound, t]);

  // Stopwatch effect
  useEffect(() => {
    if (!swRunning) return;
    const start = performance.now() - swElapsedMs;
    const id = setInterval(() => {
      setSwElapsedMs(performance.now() - start);
    }, 30);
    return () => clearInterval(id);
  }, [swRunning]);

  const formatSw = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    const centi = Math.floor((ms % 1000) / 10)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}.${centi}`;
  };

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const worldZones = [
    { city: 'Jakarta (WIB)', tz: 'Asia/Jakarta', offset: 'UTC+7' },
    { city: 'Makassar / Bali (WITA)', tz: 'Asia/Makassar', offset: 'UTC+8' },
    { city: 'Tokyo (JST)', tz: 'Asia/Tokyo', offset: 'UTC+9' },
    { city: 'London (GMT/BST)', tz: 'Europe/London', offset: 'UTC+0' },
    { city: 'New York (EST)', tz: 'America/New_York', offset: 'UTC-5' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm select-none">
      {/* Segmented Navigation */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          {[
            { id: 'clock', label: t('Jam Dunia', 'World Clock') },
            { id: 'timer', label: t('Timer', 'Timer') },
            { id: 'stopwatch', label: t('Stopwatch', 'Stopwatch') },
            { id: 'alarm', label: t('Alarm', 'Alarms') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                tab === item.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'clock' && (
          <div className="space-y-6">
            <div className="text-center py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
              <div className="text-4xl font-mono tabular-nums font-bold tracking-tight">
                {now.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {now.toLocaleDateString(settings.language === 'id' ? 'id-ID' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {worldZones.map((z) => {
                let timeStr = '';
                try {
                  timeStr = now.toLocaleTimeString([], {
                    timeZone: z.tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                } catch {
                  timeStr = now.toLocaleTimeString();
                }
                return (
                  <div
                    key={z.city}
                    className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900"
                  >
                    <div>
                      <div className="text-xs font-semibold">{z.city}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{z.offset}</div>
                    </div>
                    <div className="text-base font-mono tabular-nums font-semibold">
                      {timeStr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'timer' && (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="text-5xl font-mono tabular-nums font-bold tracking-tight">
              {formatCountdown(timerRemaining)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: '1m', sec: 60 },
                { label: '5m', sec: 300 },
                { label: '10m', sec: 600 },
                { label: '25m (Fokus)', sec: 1500 },
                { label: '45m', sec: 2700 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerDuration(p.sec);
                    setTimerRemaining(p.sec);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    timerDuration === p.sec
                      ? 'border-sky-500 bg-sky-500/15 text-sky-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTimerRunning((r) => !r)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                {timerRunning ? <Pause size={15} /> : <Play size={15} />}
                <span>{timerRunning ? t('Jeda', 'Pause') : t('Mulai', 'Start')}</span>
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerRemaining(timerDuration);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="flex flex-col items-center space-y-5">
            <div className="text-5xl font-mono tabular-nums font-bold tracking-tight pt-2">
              {formatSw(swElapsedMs)}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSwRunning((r) => !r)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                {swRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{swRunning ? t('Berhenti', 'Stop') : t('Mulai', 'Start')}</span>
              </button>
              <button
                onClick={() => {
                  if (swElapsedMs > 0) {
                    setLaps((prev) => [swElapsedMs, ...prev]);
                  }
                }}
                disabled={!swRunning}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Flag size={14} />
                <span>{t('Putaran', 'Lap')}</span>
              </button>
              <button
                onClick={() => {
                  setSwRunning(false);
                  setSwElapsedMs(0);
                  setLaps([]);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            {laps.length > 0 && (
              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs font-mono tabular-nums">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-left">{t('Putaran', 'Lap')}</th>
                      <th className="py-2 px-3 text-right">{t('Selisih', 'Split')}</th>
                      <th className="py-2 px-3 text-right">{t('Total', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {laps.map((lapTime, idx) => {
                      const prevLap = laps[idx + 1] || 0;
                      const delta = lapTime - prevLap;
                      return (
                        <tr key={idx}>
                          <td className="py-2 px-3">#{laps.length - idx}</td>
                          <td className="py-2 px-3 text-right text-sky-500">
                            +{formatSw(delta)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {formatSw(lapTime)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'alarm' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
              />
              <input
                type="text"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                placeholder={t('Label alarm...', 'Alarm label...')}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
              <button
                onClick={() => {
                  setAlarms((prev) => [
                    ...prev,
                    {
                      id: `al-${Date.now()}`,
                      time: newAlarmTime,
                      label: newAlarmLabel.trim() || t('Pengingat Kerja', 'Work Reminder'),
                      enabled: true,
                    },
                  ]);
                  setNewAlarmLabel('');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 shrink-0"
              >
                <Plus size={14} />
                <span>{t('Tambah', 'Add')}</span>
              </button>
            </div>

            <div className="space-y-2">
              {alarms.map((al) => (
                <div
                  key={al.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <Bell
                      size={16}
                      className={al.enabled ? 'text-sky-500' : 'text-slate-400'}
                    />
                    <div>
                      <div className="text-lg font-mono tabular-nums font-bold">
                        {al.time}
                      </div>
                      <div className="text-xs text-slate-400">{al.label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setAlarms((prev) =>
                          prev.map((a) =>
                            a.id === al.id ? { ...a, enabled: !a.enabled } : a
                          )
                        )
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        al.enabled
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {al.enabled ? t('Aktif', 'On') : t('Nonaktif', 'Off')}
                    </button>
                    <button
                      onClick={() =>
                        setAlarms((prev) => prev.filter((a) => a.id !== al.id))
                      }
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
