import {
  AppManifest,
  DesktopShortcut,
  OSSettings,
  UserAccount,
  VFSFile,
  WindowState,
} from '../types/os';
import { DEFAULT_INSTALLED_APP_IDS, DEFAULT_SETTINGS } from '../data/catalog';

const DB_NAME = 'WebWorkstationDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('parentId', 'parentId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore fallback error
  }
}

export async function idbGetAllFiles(): Promise<VFSFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as VFSFile[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function idbPutFile(file: VFSFile): Promise<void> {
  try {
    // Also mirror binary/large content to OPFS when available
    if (!file.isFolder && file.content && file.size > 64 * 1024 && 'storage' in navigator && 'getDirectory' in navigator.storage) {
      try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(`vfs_${file.id}`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file.content);
        await writable.close();
        file.opfsPath = `opfs://vfs_${file.id}`;
      } catch {
        // Fallback to standard IndexedDB storage
      }
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put(file);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function idbDeleteFile(id: string): Promise<void> {
  try {
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      try {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(`vfs_${id}`);
      } catch {
        // Ignore if not in OPFS
      }
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function idbClearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['kv', 'files'], 'readwrite');
    tx.objectStore('kv').clear();
    tx.objectStore('files').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface StorageQuotaInfo {
  usageBytes: number;
  quotaBytes: number;
  persisted: boolean;
  opfsSupported: boolean;
}

export async function getStorageQuotaInfo(): Promise<StorageQuotaInfo> {
  let usageBytes = 0;
  let quotaBytes = 1024 * 1024 * 1024; // 1 GB fallback
  let persisted = false;
  const opfsSupported =
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.getDirectory === 'function';

  if (typeof navigator !== 'undefined' && 'storage' in navigator) {
    try {
      if (navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        usageBytes = est.usage || 0;
        quotaBytes = est.quota || quotaBytes;
      }
      if (navigator.storage.persisted) {
        persisted = await navigator.storage.persisted();
      }
    } catch {
      // Ignore
    }
  }
  return { usageBytes, quotaBytes, persisted, opfsSupported };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

export function createSeedFiles(): VFSFile[] {
  const now = Date.now();
  const architectureSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0f172a"/>
    <rect x="40" y="40" width="720" height="90" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="400" y="80" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">WebWorkstation Shell (Desktop, Taskbar, Start Menu, Window Manager)</text>
    <text x="400" y="108" fill="#94a3b8" font-family="monospace" font-size="13" text-anchor="middle">8-Way Resize · Edge Snap · Multi-Desktop (1-3) · Pointer &amp; Touch</text>
    <rect x="40" y="160" width="345" height="120" rx="10" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
    <text x="212" y="205" fill="#f8fafc" font-family="sans-serif" font-size="17" font-weight="bold" text-anchor="middle">Kernel Layanan &amp; Isolasi</text>
    <text x="212" y="235" fill="#cbd5e1" font-family="monospace" font-size="12" text-anchor="middle">App Registry · Permissions · Sandbox Iframe</text>
    <text x="212" y="258" fill="#94a3b8" font-family="monospace" font-size="12" text-anchor="middle">X-Frame-Options Fallback · Task Manager</text>
    <rect x="415" y="160" width="345" height="120" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
    <text x="587" y="205" fill="#f8fafc" font-family="sans-serif" font-size="17" font-weight="bold" text-anchor="middle">Virtual File System (VFS)</text>
    <text x="587" y="235" fill="#cbd5e1" font-family="monospace" font-size="12" text-anchor="middle">IndexedDB + Origin Private File System (OPFS)</text>
    <text x="587" y="258" fill="#94a3b8" font-family="monospace" font-size="12" text-anchor="middle">Drag &amp; Drop · Pratinjau · Ekspor Arsip JSON</text>
    <rect x="40" y="310" width="720" height="100" rx="10" fill="#090d16" stroke="#475569" stroke-width="1.5"/>
    <text x="400" y="352" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aplikasi Bawaan &amp; Ekosistem BrowStore</text>
    <text x="400" y="382" fill="#94a3b8" font-family="monospace" font-size="13" text-anchor="middle">Files · Notepad · Calculator · Clock · Paint · Browser · BrowStore · Settings</text>
  </svg>`;

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(architectureSvg)}`;

  const prdContent = `# PRD – WebWorkstation (v1.0)

Selamat datang di **WebWorkstation**! Berkas ini disimpan langsung di dalam **Virtual File System (VFS)** berbasis IndexedDB & OPFS. Anda dapat menyunting berkas ini di **Notepad**, membuat snapshot versi, atau mengunduhnya ke komputer Anda melalui aplikasi **Files**.

## Ringkasan Fitur Utama yang Telah Aktif
1. **Window Manager (F1):** Geser jendela, ubah ukuran dari 8 arah, snap ke setengah/seperempat layar, gaya kontrol Windows atau Mac, dan navigasi \`Alt+Tab\` / \`Ctrl+K\`.
2. **Taskbar & Start Menu (F2):** Pin aplikasi, pencarian instan aplikasi & berkas VFS, dan Multi-Desktop (Workspace 1, 2, 3).
3. **Desktop Interaktif (F3):** Ikon grid yang dapat diseret, seleksi kotak multi-ikon, ubah nama, urutkan, dan tambah shortcut situs kustom.
4. **Files & Penyimpanan OPFS/IndexedDB (F4, F6):** Pohon folder lengkap, seret & lepas berkas dari komputer Anda, pratinjau gambar/teks/audio/video, tempat sampah, dan indikator kuota penyimpanan nyata.
5. **Notepad Terintegrasi VFS (F5):** Menyimpan catatan langsung sebagai berkas nyata di \`/Documents\`, dilengkapi snapshot versi, penghitung kata, dan pewaktu fokus Pomodoro.
6. **BrowStore & Manifest SDK (F8, F15):** Katalog aplikasi dengan label *Sponsored* transparan, daftar izin manifest, serta fitur instalasi aplikasi kustom via JSON Manifest.
7. **Ekspor & Impor Workspace (F11, F12):** Cadangkan seluruh pengaturan, tata letak shortcut, dan berkas VFS menjadi satu arsip \`.json\` dan pulihkan di perangkat mana pun.
`;

  const lectureNotes = `Catatan Riset & Produktivitas Mingguan
======================================
Tanggal: 13 November 2026
Lokasi: Ruang Kerja WebWorkstation (Desktop 1)

Agenda Hari Ini:
- [x] Menguji penyimpanan berkas nyata di aplikasi Files (IndexedDB + OPFS)
- [x] Menjalankan sesi fokus Pomodoro 25 menit di Notepad
- [x] Menghitung estimasi kapasitas memori di Scientific Calculator
- [ ] Mengekspor konfigurasi workspace (.json) untuk dibawa ke tablet

Tips Pintasan Keyboard:
- Tekan Ctrl + K (atau Alt + Space) untuk membuka Command Palette & pencari global.
- Tekan Alt + Tab untuk berpindah antar jendela yang sedang terbuka.
- Seret jendela ke tepi kiri, kanan, atau atas layar untuk melakukan Window Snap.`;

  const budgetCsv = `Komponen,Kategori,Kuota_MB,Status,Lisensi
Shell & Window Manager,Inti Sistem,12,Aktif,MIT
Virtual File System (OPFS),Penyimpanan,250,Aktif,MIT
Notepad (Amit Merchant),Produktivitas,4,Aktif,MIT
NEO-CALC Pro Calculator,Utilitas,3,Aktif,MIT
Paint Studio (miniPaint),Kreatif,18,Aktif,MIT
BrowStore Catalog,Ekosistem,8,Aktif,MIT`;

  return [
    {
      id: 'folder-desktop',
      parentId: null,
      name: 'Desktop',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 3600000,
      isFolder: true,
      isTrash: false,
    },
    {
      id: 'folder-documents',
      parentId: null,
      name: 'Documents',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 1800000,
      isFolder: true,
      isTrash: false,
    },
    {
      id: 'folder-pictures',
      parentId: null,
      name: 'Pictures',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 3600000,
      isFolder: true,
      isTrash: false,
    },
    {
      id: 'folder-downloads',
      parentId: null,
      name: 'Downloads',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 7200000,
      isFolder: true,
      isTrash: false,
    },
    {
      id: 'file-prd-md',
      parentId: 'folder-documents',
      name: 'PRD-WebWorkstation.md',
      mimeType: 'text/markdown',
      size: new Blob([prdContent]).size,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 600000,
      isFolder: false,
      isTrash: false,
      content: prdContent,
      snapshots: [
        {
          id: 'snap-initial',
          timestamp: now - 86400000 * 2,
          label: 'Draf Awal v0.1',
          content: '# PRD – WebWorkstation (Draf Awal v0.1)\n\nDokumen draf awal analisis BrowOS v1.0.1.',
        },
      ],
    },
    {
      id: 'file-notes-txt',
      parentId: 'folder-documents',
      name: 'Catatan-Kuliah-dan-Kerja.txt',
      mimeType: 'text/plain',
      size: new Blob([lectureNotes]).size,
      createdAt: now - 86400000,
      updatedAt: now - 300000,
      isFolder: false,
      isTrash: false,
      content: lectureNotes,
      snapshots: [
        {
          id: 'snap-1',
          timestamp: now - 3600000,
          label: 'Sebelum rapat pagi',
          content: lectureNotes,
        },
      ],
    },
    {
      id: 'file-budget-csv',
      parentId: 'folder-documents',
      name: 'Anggaran-Proyek-2026.csv',
      mimeType: 'text/csv',
      size: new Blob([budgetCsv]).size,
      createdAt: now - 7200000,
      updatedAt: now - 7200000,
      isFolder: false,
      isTrash: false,
      content: budgetCsv,
    },
    {
      id: 'file-arch-svg',
      parentId: 'folder-pictures',
      name: 'Diagram-Arsitektur-OS.svg',
      mimeType: 'image/svg+xml',
      size: new Blob([architectureSvg]).size,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
      isFolder: false,
      isTrash: false,
      content: svgDataUrl,
    },
  ];
}

export function createDefaultShortcuts(): DesktopShortcut[] {
  return [
    { id: 'sc-files', appId: 'files', gridX: 0, gridY: 0, location: 'desktop' },
    { id: 'sc-notepad', appId: 'notepad', gridX: 0, gridY: 1, location: 'desktop' },
    { id: 'sc-calculator', appId: 'calculator', gridX: 0, gridY: 2, location: 'desktop' },
    { id: 'sc-clock', appId: 'clock', gridX: 0, gridY: 3, location: 'desktop' },
    { id: 'sc-paint', appId: 'paint', gridX: 0, gridY: 4, location: 'desktop' },
    { id: 'sc-browser', appId: 'browser', gridX: 1, gridY: 0, location: 'desktop' },
    { id: 'sc-store', appId: 'store', gridX: 1, gridY: 1, location: 'desktop' },
    { id: 'sc-taskmgr', appId: 'task-manager', gridX: 1, gridY: 2, location: 'desktop' },
    { id: 'sc-settings', appId: 'settings', gridX: 1, gridY: 3, location: 'desktop' },
    { id: 'sc-2048', appId: 'game-2048', gridX: 1, gridY: 4, location: 'desktop' },
    // Pinned taskbar apps
    { id: 'tb-files', appId: 'files', gridX: 0, gridY: 0, location: 'taskbar' },
    { id: 'tb-notepad', appId: 'notepad', gridX: 1, gridY: 0, location: 'taskbar' },
    { id: 'tb-browser', appId: 'browser', gridX: 2, gridY: 0, location: 'taskbar' },
    { id: 'tb-calculator', appId: 'calculator', gridX: 3, gridY: 0, location: 'taskbar' },
    { id: 'tb-paint', appId: 'paint', gridX: 4, gridY: 0, location: 'taskbar' },
    { id: 'tb-store', appId: 'store', gridX: 5, gridY: 0, location: 'taskbar' },
    { id: 'tb-settings', appId: 'settings', gridX: 6, gridY: 0, location: 'taskbar' },
  ];
}

export async function loadInitialOSData(): Promise<{
  settings: OSSettings;
  files: VFSFile[];
  shortcuts: DesktopShortcut[];
  installedAppIds: string[];
  customApps: AppManifest[];
  windows: WindowState[];
  account: UserAccount | null;
}> {
  const [
    savedSettings,
    savedFiles,
    savedShortcuts,
    savedInstalled,
    savedCustomApps,
    savedWindows,
    savedAccount,
  ] = await Promise.all([
    idbGet<OSSettings>('settings'),
    idbGetAllFiles(),
    idbGet<DesktopShortcut[]>('shortcuts'),
    idbGet<string[]>('installedAppIds'),
    idbGet<AppManifest[]>('customApps'),
    idbGet<WindowState[]>('windows'),
    idbGet<UserAccount | null>('account'),
  ]);

  const settings: OSSettings = savedSettings
    ? {
        ...DEFAULT_SETTINGS,
        ...savedSettings,
        taskbarButtons: {
          ...DEFAULT_SETTINGS.taskbarButtons,
          ...(savedSettings.taskbarButtons || {}),
        },
      }
    : DEFAULT_SETTINGS;

  let files = savedFiles;
  if (!files || files.length === 0) {
    files = createSeedFiles();
    for (const f of files) {
      await idbPutFile(f);
    }
  }

  let shortcuts = savedShortcuts;
  if (!shortcuts || shortcuts.length === 0) {
    shortcuts = createDefaultShortcuts();
    await idbSet('shortcuts', shortcuts);
  }

  let installedAppIds = savedInstalled;
  if (!installedAppIds || installedAppIds.length === 0) {
    installedAppIds = DEFAULT_INSTALLED_APP_IDS;
    await idbSet('installedAppIds', installedAppIds);
  }

  const customApps = savedCustomApps || [];
  const windows = savedWindows || [];
  const account = savedAccount || null;

  return {
    settings,
    files,
    shortcuts,
    installedAppIds,
    customApps,
    windows,
    account,
  };
}

// Synthesized WebAudio sounds so there are no external audio file dependencies
export function playSystemSound(type: 'boot' | 'alarm' | 'snap' | 'notification', enabled = true) {
  if (!enabled) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'boot') {
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 warm chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.09 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.15);
      });
    } else if (type === 'alarm') {
      [587.33, 880, 587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        gain.gain.setValueAtTime(0.08, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.16);
      });
    } else if (type === 'notification') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Ignore audio context blocked before user interaction
  }
}
