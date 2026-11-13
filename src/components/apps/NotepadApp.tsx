import React, { useState, useEffect } from 'react';
import {
  FileText,
  FilePlus,
  History,
  Download,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Save,
  RotateCw,
  FolderOpen,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { playSystemSound } from '../../services/storage';

interface NotepadAppProps {
  initialFileId?: string;
}

export const NotepadApp: React.FC<NotepadAppProps> = ({ initialFileId }) => {
  const {
    files,
    createFile,
    updateFileContent,
    saveFileSnapshot,
    restoreFileSnapshot,
    openApp,
    settings,
    notify,
    t,
  } = useOS();

  const textFiles = files.filter(
    (f) =>
      !f.isFolder &&
      !f.isTrash &&
      (f.mimeType.startsWith('text/') ||
        /\.(txt|md|json|csv)$/i.test(f.name))
  );

  const [activeFileId, setActiveFileId] = useState<string>(
    initialFileId || textFiles[0]?.id || ''
  );
  const [content, setContent] = useState<string>('');
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  // Pomodoro Focus Timer (25 min default)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  const activeFile = files.find((f) => f.id === activeFileId);

  useEffect(() => {
    if (initialFileId && files.some((f) => f.id === initialFileId)) {
      setActiveFileId(initialFileId);
    }
  }, [initialFileId, files]);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || '');
    }
  }, [activeFileId, activeFile?.id]);

  // Auto-save to VFS as user types
  const handleContentChange = (nextText: string) => {
    setContent(nextText);
    if (activeFileId) {
      updateFileContent(activeFileId, nextText);
    }
  };

  // Focus timer countdown
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playSystemSound('alarm', settings.bootSound);
          notify(
            t('Sesi Fokus Selesai!', 'Focus Session Complete!'),
            timerMode === 'focus'
              ? t('Saatnya istirahat sejenak 5 menit.', 'Time for a 5-minute break.')
              : t('Siap melanjutkan sesi fokus berikutnya.', 'Ready for the next focus session.'),
            'notepad'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerMode, notify, settings.bootSound, t]);

  const handleNewNote = async () => {
    const newF = await createFile(
      `Catatan-${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}.md`,
      'folder-documents',
      t('# Catatan Baru\n\nMulai menulis di sini...', '# New Note\n\nStart writing here...'),
      'text/markdown'
    );
    setActiveFileId(newF.id);
    setContent(newF.content || '');
  };

  const handleCreateSnapshot = async () => {
    if (!activeFileId) return;
    await saveFileSnapshot(
      activeFileId,
      snapshotLabel.trim() ||
        `${t('Snapshot', 'Snapshot')} ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
    );
    setSnapshotLabel('');
    notify(
      t('Snapshot Disimpan', 'Snapshot Saved'),
      t('Versi dokumen berhasil direkam di VFS.', 'Document version recorded in VFS.'),
      'notepad'
    );
  };

  const handleExport = (ext: 'txt' | 'md' | 'doc') => {
    const baseName = (activeFile?.name || 'catatan').replace(/\.[^.]+$/, '');
    let blob: Blob;
    if (ext === 'doc') {
      const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body style="font-family: sans-serif; line-height: 1.6; max-width: 720px; margin: 2rem auto;"><pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre></body></html>`;
      blob = new Blob([htmlDoc], { type: 'application/msword' });
    } else {
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Word / Char / Line stats
  const trimmed = content.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 1;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <FileText size={15} className="text-sky-500 shrink-0" />
            <select
              value={activeFileId}
              onChange={(e) => setActiveFileId(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500 max-w-[200px]"
            >
              {textFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNewNote}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus size={13} />
            <span>{t('Berkas Baru', 'New File')}</span>
          </button>

          <button
            onClick={() => openApp('files')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            title={t('Lihat di Files', 'View in Files')}
          >
            <FolderOpen size={13} />
            <span className="hidden md:inline">Files</span>
          </button>
        </div>

        {/* Right Controls: Focus Timer, Snapshots, Export */}
        <div className="flex items-center gap-2">
          {/* Focus Pomodoro Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Timer size={13} className="text-amber-500" />
            <span className="font-mono tabular-nums font-semibold">
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setTimerRunning((r) => !r)}
              className="p-0.5 text-slate-600 dark:text-slate-300 hover:text-sky-500"
              title={timerRunning ? t('Jeda', 'Pause') : t('Mulai Fokus', 'Start Focus')}
            >
              {timerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                const nextMode = timerMode === 'focus' ? 'break' : 'focus';
                setTimerMode(nextMode);
                setTimerSeconds(nextMode === 'focus' ? 25 * 60 : 5 * 60);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title={t('Ubah 25m / 5m', 'Toggle 25m / 5m')}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <button
            onClick={() => setShowSnapshots((s) => !s)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              showSnapshots
                ? 'bg-sky-500 text-white'
                : 'bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <History size={13} />
            <span>
              {t('Snapshot', 'Snapshots')} ({activeFile?.snapshots?.length || 0})
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('txt')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Export .TXT"
            >
              <Download size={12} />
              <span>.TXT</span>
            </button>
            <button
              onClick={() => handleExport('doc')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Export .DOC"
            >
              <span>.DOC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor + Optional Snapshot Drawer */}
      <div className="flex-1 flex min-h-0 relative">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={t(
            'Ketik catatan Anda... Seluruh perubahan otomatis tersimpan ke berkas di aplikasi Files.',
            'Type your notes... All changes are automatically saved to the file in Files.'
          )}
          className="flex-1 p-3 sm:p-4 bg-transparent resize-none focus:outline-none font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 select-text"
        />

        {showSnapshots && (
          <div className="absolute sm:static inset-y-0 right-0 z-20 w-72 sm:w-64 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex flex-col justify-between shadow-xl sm:shadow-none">
            <div className="space-y-3 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('Riwayat Snapshot Versi', 'Version Snapshots')}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder={t('Label versi...', 'Version label...')}
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500 text-white hover:bg-sky-600 shrink-0"
                  title={t('Simpan Snapshot', 'Save Snapshot')}
                >
                  <Save size={13} />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {!activeFile?.snapshots || activeFile.snapshots.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t('Belum ada snapshot untuk berkas ini.', 'No snapshots yet for this file.')}
                  </p>
                ) : (
                  activeFile.snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                    >
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {snap.label}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-400">
                        {new Date(snap.timestamp).toLocaleString()}
                      </div>
                      <button
                        onClick={() => {
                          restoreFileSnapshot(activeFile.id, snap.id);
                          setContent(snap.content);
                        }}
                        className="flex items-center gap-1 text-[11px] font-medium text-sky-500 hover:underline pt-0.5"
                      >
                        <RotateCw size={11} />
                        <span>{t('Pulihkan Versi Ini', 'Restore This Version')}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
              Basis: Amit Merchant Notepad (MIT)
            </div>
          </div>
        )}
      </div>

      {/* Status Bar (Clean unboxed metadata with typographic separators) */}
      <div className="px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        <div className="flex items-center gap-2">
          <span>
            {wordCount} {t('kata', 'words')}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {charCount} {t('karakter', 'chars')}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {lineCount} {t('baris', 'lines')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span aria-hidden="true">·</span>
          <span>{t('Tersimpan di VFS (/Documents)', 'Saved in VFS (/Documents)')}</span>
        </div>
      </div>
    </div>
  );
};
