import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Trash2,
  Upload,
  FolderPlus,
  FilePlus,
  Download,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  HardDrive,
  Eye,
  Edit3,
  ChevronRight,
  Check,
  X,
  Wallpaper,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { VFSFile } from '../../types/os';
import { getStorageQuotaInfo, requestPersistentStorage, StorageQuotaInfo } from '../../services/storage';

export const FilesApp: React.FC = () => {
  const {
    files,
    createFolder,
    createFile,
    renameFile,
    moveFile,
    trashFile,
    restoreFile,
    deleteFilePermanently,
    emptyTrash,
    openApp,
    updateSettings,
    notify,
    t,
  } = useOS();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>('folder-documents');
  const [viewingTrash, setViewingTrash] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<VFSFile | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [quota, setQuota] = useState<StorageQuotaInfo>({
    usageBytes: 0,
    quotaBytes: 1024 * 1024 * 1024,
    persisted: false,
    opfsSupported: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStorageQuotaInfo().then(setQuota);
  }, [files]);

  const rootFolders = files.filter((f) => f.parentId === null && f.isFolder && !f.isTrash);

  const displayedFiles = files
    .filter((f) => {
      if (viewingTrash) return f.isTrash;
      if (f.isTrash) return false;
      if (searchQuery.trim()) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return f.parentId === currentFolderId;
    })
    .sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  const getBreadcrumbs = (): VFSFile[] => {
    const trail: VFSFile[] = [];
    let ptr = files.find((f) => f.id === currentFolderId);
    while (ptr) {
      trail.unshift(ptr);
      ptr = files.find((f) => f.id === ptr?.parentId);
    }
    return trail;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleOpenItem = (item: VFSFile) => {
    if (item.isTrash) {
      setPreviewFile(item);
      return;
    }
    if (item.isFolder) {
      setCurrentFolderId(item.id);
      setSelectedFileId(null);
      setSearchQuery('');
      return;
    }
    if (
      item.mimeType.startsWith('text/') ||
      item.name.endsWith('.md') ||
      item.name.endsWith('.txt') ||
      item.name.endsWith('.json') ||
      item.name.endsWith('.csv')
    ) {
      openApp('notepad', {
        fileId: item.id,
        customTitle: `Notepad — ${item.name}`,
      });
    } else {
      setPreviewFile(item);
    }
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const targetParent = viewingTrash ? 'folder-documents' : currentFolderId;

    for (const rawFile of Array.from(fileList)) {
      const isText =
        rawFile.type.startsWith('text/') ||
        /\.(txt|md|json|csv|js|ts|html|css|xml)$/i.test(rawFile.name);

      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        if (isText) {
          reader.readAsText(rawFile);
        } else {
          reader.readAsDataURL(rawFile);
        }
      });

      await createFile(
        rawFile.name,
        targetParent,
        content,
        rawFile.type || (isText ? 'text/plain' : 'application/octet-stream')
      );
    }

    notify(
      t('Berkas Diunggah', 'Files Uploaded'),
      `${fileList.length} ${t('berkas disimpan ke Virtual File System.', 'file(s) saved to Virtual File System.')}`,
      'files'
    );
  };

  const handleDownloadFile = (file: VFSFile) => {
    if (file.isFolder) return;
    const content = file.content || '';
    const a = document.createElement('a');
    if (content.startsWith('data:')) {
      a.href = content;
    } else {
      const blob = new Blob([content], { type: file.mimeType || 'text/plain' });
      a.href = URL.createObjectURL(blob);
    }
    a.download = file.name;
    a.click();
  };

  const handleSetAsWallpaper = (file: VFSFile) => {
    if (!file.content) return;
    updateSettings({
      customWallpaperFileId: file.id,
    });
    notify(
      t('Wallpaper Diperbarui', 'Wallpaper Updated'),
      `${file.name} ${t('diterapkan sebagai latar belakang desktop.', 'applied as desktop background.')}`,
      'files'
    );
  };

  const handleNewFolder = async () => {
    const f = await createFolder(
      t('Folder Baru', 'New Folder'),
      viewingTrash ? 'folder-documents' : currentFolderId
    );
    setSelectedFileId(f.id);
    setRenamingId(f.id);
    setRenameValue(f.name);
  };

  const handleNewTextFile = async () => {
    const f = await createFile(
      t('Catatan-Baru.txt', 'New-Note.txt'),
      viewingTrash ? 'folder-documents' : currentFolderId,
      t('# Catatan Baru\nTulis ide Anda di sini...', '# New Note\nWrite your thoughts here...'),
      'text/plain'
    );
    setSelectedFileId(f.id);
    setRenamingId(f.id);
    setRenameValue(f.name);
  };

  const commitRename = async () => {
    if (renamingId && renameValue.trim()) {
      await renameFile(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const renderFileIcon = (file: VFSFile, size = 24) => {
    if (file.isFolder) {
      return <Folder size={size} className="text-amber-400 fill-amber-400/20" />;
    }
    if (file.mimeType.startsWith('image/') || file.name.endsWith('.svg')) {
      return <ImageIcon size={size} className="text-rose-400" />;
    }
    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      return <FileText size={size} className="text-sky-400" />;
    }
    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      return <FileCode size={size} className="text-emerald-400" />;
    }
    return <File size={size} className="text-slate-400" />;
  };

  const vfsTotalUsed = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const effectiveUsed = Math.max(vfsTotalUsed, quota.usageBytes);
  const usagePercent = Math.min(100, Math.max(1, (effectiveUsed / quota.quotaBytes) * 100));

  return (
    <div
      className="flex flex-col md:flex-row h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleUploadFiles(e.dataTransfer.files);
      }}
    >
      {/* Mobile / Narrow Top Horizontal Location Strip */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 overflow-x-auto shrink-0">
        <button
          onClick={() => {
            setViewingTrash(false);
            setCurrentFolderId(null);
            setSelectedFileId(null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
            !viewingTrash && currentFolderId === null
              ? 'bg-sky-500 text-white'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <HardDrive size={13} />
          <span>Root</span>
        </button>
        {rootFolders.map((folder) => {
          const active = !viewingTrash && currentFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => {
                setViewingTrash(false);
                setCurrentFolderId(folder.id);
                setSelectedFileId(null);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Folder size={13} className={active ? 'text-white' : 'text-amber-400'} />
              <span>{folder.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => {
            setViewingTrash(true);
            setSelectedFileId(null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
            viewingTrash
              ? 'bg-rose-500 text-white'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Trash2 size={13} />
          <span>{t('Sampah', 'Trash')}</span>
        </button>
      </div>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex-col justify-between p-3">
        <div className="space-y-4">
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t('Lokasi Utama', 'Locations')}
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setViewingTrash(false);
                  setCurrentFolderId(null);
                  setSelectedFileId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !viewingTrash && currentFolderId === null
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <HardDrive size={15} />
                <span>{t('Root VFS (Semua)', 'VFS Root (All)')}</span>
              </button>

              {rootFolders.map((folder) => {
                const active = !viewingTrash && currentFolderId === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setViewingTrash(false);
                      setCurrentFolderId(folder.id);
                      setSelectedFileId(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {active ? (
                      <FolderOpen size={15} className="text-amber-400" />
                    ) : (
                      <Folder size={15} className="text-amber-400" />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setViewingTrash(true);
                  setSelectedFileId(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewingTrash
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Trash2 size={15} />
                  <span>{t('Tempat Sampah', 'Trash')}</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {files.filter((f) => f.isTrash).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Storage Quota Card */}
        <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {quota.opfsSupported ? 'OPFS + IndexedDB' : 'IndexedDB'}
            </span>
            <span className="font-mono tabular-nums text-slate-500">
              {formatBytes(effectiveUsed)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>
              {quota.persisted
                ? t('Penyimpanan Persisten', 'Persistent Storage')
                : t('Penyimpanan Lokal', 'Local Storage')}
            </span>
            {!quota.persisted && (
              <button
                onClick={async () => {
                  const ok = await requestPersistentStorage();
                  setQuota((prev) => ({ ...prev, persisted: ok }));
                }}
                className="text-sky-500 hover:underline font-medium"
              >
                {t('Kunci', 'Persist')}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto whitespace-nowrap">
            {viewingTrash ? (
              <span className="font-semibold text-rose-500 flex items-center gap-1.5">
                <Trash2 size={14} />
                {t('Tempat Sampah', 'Trash')}
              </span>
            ) : (
              <>
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  VFS
                </button>
                {getBreadcrumbs().map((crumb) => (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                    <button
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className="font-medium text-slate-700 dark:text-slate-200 hover:text-sky-500"
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Cari berkas...', 'Search files...')}
                className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:border-sky-500 w-40"
              />
            </div>

            {!viewingTrash ? (
              <>
                <button
                  onClick={handleNewFolder}
                  title={t('Folder Baru', 'New Folder')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <FolderPlus size={14} />
                  <span className="hidden sm:inline">{t('Folder', 'Folder')}</span>
                </button>
                <button
                  onClick={handleNewTextFile}
                  title={t('Berkas Teks Baru', 'New Text File')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <FilePlus size={14} />
                  <span className="hidden sm:inline">{t('Catatan', 'Note')}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload size={14} />
                  <span>{t('Unggah', 'Upload')}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadFiles(e.target.files)}
                />
              </>
            ) : (
              files.some((f) => f.isTrash) && (
                <button
                  onClick={emptyTrash}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 size={13} />
                  <span>{t('Kosongkan Sampah', 'Empty Trash')}</span>
                </button>
              )
            )}

            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="Grid"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="List"
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* File Canvas */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {isDraggingOver && (
            <div className="absolute inset-3 rounded-xl border-2 border-dashed border-sky-500 bg-sky-500/10 z-20 flex flex-col items-center justify-center pointer-events-none">
              <Upload size={32} className="text-sky-400 mb-2" />
              <p className="text-sm font-semibold text-sky-400">
                {t('Lepaskan berkas untuk menyimpan ke VFS', 'Drop files here to save into VFS')}
              </p>
            </div>
          )}

          {displayedFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <FolderOpen size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {viewingTrash
                  ? t('Tempat sampah kosong', 'Trash is empty')
                  : t('Folder ini masih kosong', 'This folder is empty')}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {viewingTrash
                  ? t('Berkas yang dihapus akan muncul di sini.', 'Deleted files will appear here.')
                  : t(
                      'Seret berkas dari komputer Anda ke jendela ini atau buat catatan baru.',
                      'Drag files from your computer into this window or create a new note.'
                    )}
              </p>
              {!viewingTrash && (
                <button
                  onClick={handleNewTextFile}
                  className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  {t('Buat Berkas Teks Pertama', 'Create First Text File')}
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedFiles.map((item) => {
                const isSelected = selectedFileId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFileId(item.id)}
                    onDoubleClick={() => handleOpenItem(item)}
                    className={`group flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                        {renderFileIcon(item, 24)}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {item.isFolder ? t('Folder', 'Folder') : formatBytes(item.size)}
                      </span>
                    </div>

                    {renamingId === item.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                          autoFocus
                          className="w-full px-1.5 py-0.5 text-xs rounded border border-sky-500 bg-white dark:bg-slate-900"
                        />
                        <button onClick={commitRename} className="text-emerald-500 p-0.5">
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-medium truncate text-slate-800 dark:text-slate-100">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                  <th className="py-2 px-2 font-medium">{t('Nama Berkas', 'Name')}</th>
                  <th className="py-2 px-2 font-medium">{t('Tipe', 'Type')}</th>
                  <th className="py-2 px-2 font-medium text-right">{t('Ukuran', 'Size')}</th>
                  <th className="py-2 px-2 font-medium text-right">{t('Diubah', 'Modified')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
                {displayedFiles.map((item) => {
                  const isSelected = selectedFileId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedFileId(item.id)}
                      onDoubleClick={() => handleOpenItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-500/15'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2 px-2 flex items-center gap-2.5">
                        {renderFileIcon(item, 16)}
                        <span className="font-medium truncate max-w-[220px]">{item.name}</span>
                      </td>
                      <td className="py-2 px-2 text-slate-400 font-mono text-[11px]">
                        {item.isFolder ? 'directory' : item.mimeType}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-400">
                        {item.isFolder ? '—' : formatBytes(item.size)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-400">
                        {new Date(item.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Action Bar when an item is selected */}
        {selectedFile && (
          <div className="px-3 sm:px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-xs">
              {renderFileIcon(selectedFile, 16)}
              <span className="font-semibold truncate max-w-[160px] sm:max-w-xs">{selectedFile.name}</span>
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <span className="text-slate-400 font-mono tabular-nums">
                {selectedFile.isFolder
                  ? t('Folder', 'Folder')
                  : formatBytes(selectedFile.size)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {!selectedFile.isTrash ? (
                <>
                  <button
                    onClick={() => handleOpenItem(selectedFile)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                  >
                    <Eye size={13} />
                    <span>{selectedFile.isFolder ? t('Buka', 'Open') : t('Buka / Edit', 'Open / Edit')}</span>
                  </button>
                  {!selectedFile.isFolder && (
                    <button
                      onClick={() => setPreviewFile(selectedFile)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span>{t('Pratinjau', 'Preview')}</span>
                    </button>
                  )}
                  {(selectedFile.mimeType.startsWith('image/') ||
                    selectedFile.name.endsWith('.svg')) && (
                    <button
                      onClick={() => handleSetAsWallpaper(selectedFile)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Wallpaper size={13} />
                      <span>{t('Jadikan Wallpaper', 'Set Wallpaper')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRenamingId(selectedFile.id);
                      setRenameValue(selectedFile.name);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    title={t('Ubah Nama', 'Rename')}
                  >
                    <Edit3 size={13} />
                  </button>
                  {!selectedFile.isFolder && (
                    <>
                      <select
                        value={selectedFile.parentId || ''}
                        onChange={(e) => moveFile(selectedFile.id, e.target.value || null)}
                        className="px-2 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-800 border-none focus:outline-none"
                        title={t('Pindahkan ke Folder', 'Move to Folder')}
                      >
                        {rootFolders.map((rf) => (
                          <option key={rf.id} value={rf.id}>
                            → {rf.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDownloadFile(selectedFile)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        title={t('Unduh ke Komputer', 'Download to PC')}
                      >
                        <Download size={13} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      trashFile(selectedFile.id);
                      setSelectedFileId(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title={t('Pindahkan ke Sampah', 'Move to Trash')}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      restoreFile(selectedFile.id);
                      setSelectedFileId(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>{t('Pulihkan', 'Restore')}</span>
                  </button>
                  <button
                    onClick={() => {
                      deleteFilePermanently(selectedFile.id);
                      setSelectedFileId(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>{t('Hapus Permanen', 'Delete Permanently')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold">
                {renderFileIcon(previewFile, 16)}
                <span>{previewFile.name}</span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="font-mono text-slate-400">{formatBytes(previewFile.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                {!previewFile.isFolder && (
                  <button
                    onClick={() => {
                      openApp('notepad', {
                        fileId: previewFile.id,
                        customTitle: `Notepad — ${previewFile.name}`,
                      });
                      setPreviewFile(null);
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500 text-white hover:bg-sky-600"
                  >
                    {t('Buka di Notepad', 'Open in Notepad')}
                  </button>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              {previewFile.mimeType.startsWith('image/') || previewFile.name.endsWith('.svg') ? (
                <img
                  src={previewFile.content}
                  alt={previewFile.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full rounded-lg object-contain"
                />
              ) : previewFile.mimeType.startsWith('audio/') ? (
                <audio controls src={previewFile.content} className="w-full" />
              ) : previewFile.mimeType.startsWith('video/') ? (
                <video controls src={previewFile.content} className="max-h-[60vh] rounded-lg" />
              ) : (
                <pre className="w-full text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-200 p-2 select-text">
                  {previewFile.content || t('(Berkas kosong)', '(Empty file)')}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
