import React, { useState, useEffect } from 'react';
import { Eye, RotateCw, XCircle, Cpu, HardDrive, Layers } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../shell/AppIcon';

export const TaskManagerApp: React.FC = () => {
  const {
    windows,
    focusWindow,
    reloadWindow,
    closeWindow,
    setActiveWorkspace,
    files,
    t,
  } = useOS();

  const [jsHeapMB, setJsHeapMB] = useState<number | null>(null);

  useEffect(() => {
    const readMemory = () => {
      const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
      };
      if (perf && perf.memory && perf.memory.usedJSHeapSize) {
        setJsHeapMB(Number((perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)));
      } else {
        setJsHeapMB(null);
      }
    };
    readMemory();
    const id = setInterval(readMemory, 2500);
    return () => clearInterval(id);
  }, []);

  const totalEstimatedMB = windows.reduce((sum, w) => sum + w.memoryEstimateMB, 24.5);
  const effectiveMemoryMB = jsHeapMB ? Math.max(jsHeapMB, totalEstimatedMB) : totalEstimatedMB;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs select-none">
      {/* Top Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>{t('Proses Jendela Aktif', 'Active Window Processes')}</span>
            <Layers size={14} className="text-sky-500" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold">
            {windows.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('Termasuk Kernel Shell', 'Including Shell Kernel')}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>{t('Pemakaian Memori', 'Memory Footprint')}</span>
            <Cpu size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold">
            {effectiveMemoryMB.toFixed(1)} MB
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {jsHeapMB
              ? 'performance.memory (Real Heap)'
              : t('Estimasi Internal Kernel', 'Internal Kernel Estimate')}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>{t('Objek Berkas VFS', 'VFS File Objects')}</span>
            <HardDrive size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold">
            {files.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            IndexedDB + OPFS
          </div>
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {windows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('Tidak ada jendela aplikasi lain yang berjalan', 'No other application windows running')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('Hanya proses inti WebWorkstation Shell (24.5 MB) yang aktif.', 'Only WebWorkstation Shell core (24.5 MB) is active.')}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[520px] text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-medium">{t('Aplikasi / Jendela', 'Application / Window')}</th>
                  <th className="py-2.5 px-3 font-medium">{t('Desktop', 'Workspace')}</th>
                  <th className="py-2.5 px-3 font-medium">{t('Status Heartbeat', 'Heartbeat Status')}</th>
                  <th className="py-2.5 px-3 font-medium text-right">{t('Memori', 'Memory')}</th>
                  <th className="py-2.5 px-3 font-medium text-right">{t('Tindakan', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {windows.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2.5">
                      <AppIcon icon={w.icon} appId={w.appId} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[180px]">
                          {w.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          PID: {w.id.slice(-6)} · {w.status}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                      Desktop {w.workspaceId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {w.responsive
                          ? t('Responsif (Nominal)', 'Responsive (Nominal)')
                          : t('Tidak Merespons', 'Not Responding')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {w.memoryEstimateMB.toFixed(1)} MB
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveWorkspace(w.workspaceId);
                            focusWindow(w.id);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                          title={t('Fokus ke Jendela', 'Focus Window')}
                        >
                          <Eye size={12} />
                          <span>{t('Fokus', 'Focus')}</span>
                        </button>
                        <button
                          onClick={() => reloadWindow(w.id)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                          title={t('Muat Ulang', 'Reload')}
                        >
                          <RotateCw size={12} />
                        </button>
                        <button
                          onClick={() => closeWindow(w.id)}
                          className="px-2 py-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 flex items-center gap-1 font-medium"
                          title={t('Tutup Paksa', 'End Task')}
                        >
                          <XCircle size={12} />
                          <span>{t('Akhiri', 'End')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
