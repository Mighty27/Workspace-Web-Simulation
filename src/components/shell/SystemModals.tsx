import React from 'react';
import { Unlock, Sparkles, X, CheckCircle2, LayoutGrid } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_VERSION, WHATS_NEW_CHANGELOG } from '../../data/catalog';

export const SystemModals: React.FC = () => {
  const {
    isBooting,
    isLocked,
    setIsLocked,
    whatsNewOpen,
    setWhatsNewOpen,
    account,
    settings,
    t,
  } = useOS();

  if (isBooting) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 text-white flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <LayoutGrid size={24} />
        </div>
        <div className="text-center space-y-1">
          <div className="text-lg font-bold tracking-tight">WebWorkstation</div>
          <div className="text-xs text-slate-400 font-mono">
            {t('Memuat Kernel & Virtual File System...', 'Loading Kernel & Virtual File System...')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Session Lock Screen */}
      {isLocked && (
        <div className="fixed inset-0 z-[995] bg-slate-950/90 backdrop-blur-2xl text-white flex flex-col items-center justify-center p-6 select-none">
          <div className="text-center space-y-6 max-w-sm w-full">
            <div className="space-y-1">
              <div className="text-5xl font-mono tabular-nums font-bold tracking-tight">
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs text-slate-400">
                {new Date().toLocaleDateString(
                  settings.language === 'id' ? 'id-ID' : 'en-US',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
              <div>
                <div className="text-sm font-bold">
                  {account ? account.name : t('Sesi Ruang Kerja Terkunci', 'Workstation Session Locked')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t(
                    'Seluruh jendela dan berkas VFS Anda tetap aman di latar belakang.',
                    'All your open windows and VFS files remain safe in the background.'
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsLocked(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
              >
                <Unlock size={15} />
                <span>{t('Buka Kunci Ruang Kerja', 'Unlock Workstation')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What's New Modal (PRD Section 8.11) */}
      {whatsNewOpen && (
        <div
          onClick={() => setWhatsNewOpen(false)}
          className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {t("Apa yang Baru di WebWorkstation", "What's New in WebWorkstation")} v
                    {APP_VERSION}
                  </h3>
                  <p className="text-slate-400">
                    {WHATS_NEW_CHANGELOG[0].date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsNewOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {WHATS_NEW_CHANGELOG[0].highlights[settings.language].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800"
                >
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-slate-700 dark:text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWhatsNewOpen(false)}
                className="px-4 py-2 rounded-xl font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                {t('Mengerti, Lanjutkan Bekerja', 'Got It, Continue Working')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
