import {
  DailyActivityRecord,
  DashboardStoreState,
  DashboardWorkspaceItem,
  WeeklyActivityDay,
  WidgetDataMap,
  WidgetInstance,
  WidgetType,
  WorkspaceTemplateId,
} from '../types/dashboard';

export const DASHBOARD_STORAGE_KEY = 'webworkstation_dashboard_store';
export const DASHBOARD_SCHEMA_VERSION = 2;

export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLast7DaysMeta(): { dateKey: string; label: string }[] {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const result: { dateKey: string; label: string }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      dateKey: getTodayDateKey(d),
      label: dayNames[d.getDay()],
    });
  }
  return result;
}

export function sanitizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'https://id.wikipedia.org';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Reject javascript: or data: URIs (Bagian A.8 Security)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return 'https://id.wikipedia.org';
  }
  return `https://${trimmed}`;
}

export const WIDGET_CATALOG_META: Record<
  WidgetType,
  {
    type: WidgetType;
    title: string;
    icon: string;
    description: string;
    previewSummary: string;
    defaultColSpan: 1 | 2 | 3 | 4;
    minColSpan: 1 | 2 | 3 | 4;
    maxColSpan: 1 | 2 | 3 | 4;
    defaultRowSpan: 1 | 2;
  }
> = {
  clock_date: {
    type: 'clock_date',
    title: 'Jam & Tanggal',
    icon: 'Clock',
    description: 'Waktu lokal, tanggal Bahasa Indonesia, dan sapaan otomatis sesuai waktu.',
    previewSummary: '14:30 • Selamat Siang',
    defaultColSpan: 1,
    minColSpan: 1,
    maxColSpan: 2,
    defaultRowSpan: 1,
  },
  focus_timer: {
    type: 'focus_timer',
    title: 'Fokus Timer (Pomodoro)',
    icon: 'Timer',
    description: 'Timer fokus 25:00 dengan progress bar, pengatur durasi, dan penghitung sesi.',
    previewSummary: '25:00 • 3 Sesi Hari Ini',
    defaultColSpan: 1,
    minColSpan: 1,
    maxColSpan: 2,
    defaultRowSpan: 1,
  },
  today_tasks: {
    type: 'today_tasks',
    title: 'Tugas Hari Ini',
    icon: 'CheckSquare',
    description: 'Checklist prioritas (rendah, sedang, tinggi) dengan bar progres penyelesaian.',
    previewSummary: '4/6 Selesai • 67%',
    defaultColSpan: 2,
    minColSpan: 1,
    maxColSpan: 3,
    defaultRowSpan: 1,
  },
  quick_note: {
    type: 'quick_note',
    title: 'Catatan Cepat',
    icon: 'StickyNote',
    description: 'Catatan instan tersimpan otomatis dengan pilihan warna kartu & hitung karakter.',
    previewSummary: 'Auto-save • 5 Warna',
    defaultColSpan: 1,
    minColSpan: 1,
    maxColSpan: 2,
    defaultRowSpan: 1,
  },
  agenda: {
    type: 'agenda',
    title: 'Agenda Hari Ini',
    icon: 'Calendar',
    description: 'Jadwal acara harian terurut waktu lengkap dengan penanda khusus tenggat.',
    previewSummary: '09:00 Review • Tenggat',
    defaultColSpan: 1,
    minColSpan: 1,
    maxColSpan: 2,
    defaultRowSpan: 1,
  },
  shortcuts: {
    type: 'shortcuts',
    title: 'Pintasan Tautan',
    icon: 'Bookmark',
    description: 'Grid tautan cepat favorit yang dapat ditambah, diedit, dan dibuka di tab baru.',
    previewSummary: 'Grid Ikon Tautan Cepat',
    defaultColSpan: 1,
    minColSpan: 1,
    maxColSpan: 2,
    defaultRowSpan: 1,
  },
  weekly_activity: {
    type: 'weekly_activity',
    title: 'Aktivitas Mingguan',
    icon: 'BarChart3',
    description: 'Grafik batang mini 7 hari dari akumulasi sesi fokus dan tugas selesai.',
    previewSummary: 'Grafik 7 Hari • Total Aksi',
    defaultColSpan: 2,
    minColSpan: 1,
    maxColSpan: 3,
    defaultRowSpan: 1,
  },
  project_status: {
    type: 'project_status',
    title: 'Status Proyek',
    icon: 'FolderKanban',
    description: 'Pantau kesehatan proyek (On Track, Berisiko, Belum Mulai) & progres persentase.',
    previewSummary: '3 Proyek • On Track 80%',
    defaultColSpan: 2,
    minColSpan: 1,
    maxColSpan: 3,
    defaultRowSpan: 1,
  },
};

export function createDefaultWidgetData<T extends WidgetType>(type: T): WidgetDataMap[T] {
  const todayKey = getTodayDateKey();
  switch (type) {
    case 'clock_date':
      return {
        showSeconds: true,
        customGreetingName: 'Rekan Kerja',
      } as WidgetDataMap[T];

    case 'focus_timer':
      return {
        focusMinutes: 25,
        breakMinutes: 5,
        sessionsToday: 2,
        lastSessionDate: todayKey,
      } as WidgetDataMap[T];

    case 'today_tasks':
      return {
        filterPriority: 'all',
        tasks: [
          {
            id: 'task-1',
            title: 'Merapikan arsitektur komponen & design token',
            priority: 'tinggi',
            completed: true,
            createdAt: Date.now() - 7200_000,
          },
          {
            id: 'task-2',
            title: 'Menyelesaikan tinjauan kode modul widget produktivitas',
            priority: 'tinggi',
            completed: false,
            createdAt: Date.now() - 3600_000,
          },
          {
            id: 'task-3',
            title: 'Menulis dokumentasi rilis v1.0 di Notepad',
            priority: 'sedang',
            completed: false,
            createdAt: Date.now() - 1800_000,
          },
        ],
      } as WidgetDataMap[T];

    case 'quick_note':
      return {
        content:
          'Ide Utama Hari Ini:\n- Gunakan Ctrl+K untuk membuka Command Palette.\n- Tekan ? untuk melihat daftar pintasan keyboard.\n- Semua catatan tersimpan otomatis di penyimpanan lokal.',
        bgColor: 'amber',
        updatedAt: Date.now(),
      } as WidgetDataMap[T];

    case 'shortcuts':
      return {
        links: [
          { id: 'sc-1', name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
          { id: 'sc-2', name: 'Wikipedia ID', url: 'https://id.wikipedia.org' },
          { id: 'sc-3', name: 'GitHub', url: 'https://github.com' },
          { id: 'sc-4', name: 'Web.dev', url: 'https://web.dev' },
        ],
      } as WidgetDataMap[T];

    case 'agenda':
      return {
        events: [
          {
            id: 'ag-1',
            title: 'Sinkronisasi Pagi & Perencanaan Sprint',
            time: '09:00',
            isDeadline: false,
          },
          {
            id: 'ag-2',
            title: 'Batas Akhir Pengumpulan Desain UI/UX',
            time: '15:00',
            isDeadline: true,
          },
          {
            id: 'ag-3',
            title: 'Evaluasi Progres Harian & Backup Data',
            time: '17:00',
            isDeadline: false,
          },
        ],
      } as WidgetDataMap[T];

    case 'weekly_activity':
      return {
        goalPerDay: 6,
      } as WidgetDataMap[T];

    case 'project_status':
      return {
        projects: [
          {
            id: 'proj-1',
            name: 'Redesain Dashboard WebWorkstation',
            status: 'on_track',
            progress: 85,
          },
          {
            id: 'proj-2',
            name: 'Integrasi Penyimpanan Offline & VFS',
            status: 'on_track',
            progress: 95,
          },
          {
            id: 'proj-3',
            name: 'Audit Aksesibilitas WCAG AA',
            status: 'at_risk',
            progress: 60,
          },
        ],
      } as WidgetDataMap[T];
  }
}

export function createWidgetInstance<T extends WidgetType>(
  type: T,
  customId?: string
): WidgetInstance<T> {
  const meta = WIDGET_CATALOG_META[type];
  return {
    id: customId || `w-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title: meta.title,
    colSpan: meta.defaultColSpan,
    rowSpan: meta.defaultRowSpan,
    data: createDefaultWidgetData(type),
    simulatedState: 'ready',
  };
}

export function createWorkspaceFromTemplate(
  template: WorkspaceTemplateId,
  customName?: string,
  customId?: string
): DashboardWorkspaceItem {
  const id = customId || `ws-${template}-${Date.now().toString(36)}`;
  if (template === 'belajar') {
    const note = createWidgetInstance('quick_note', `${id}-note`);
    note.title = 'Catatan Materi Belajar';
    note.data.content =
      'Ringkasan Materi:\n1. Arsitektur State Terpusat & Memoization\n2. Standar Kontras WCAG AA & Navigasi Keyboard\n3. Latihan Soal pukul 19:00';
    note.data.bgColor = 'sky';

    return {
      id,
      name: customName || 'Ruang Belajar',
      template: 'belajar',
      createdAt: Date.now(),
      widgets: [
        createWidgetInstance('clock_date', `${id}-clock`),
        createWidgetInstance('focus_timer', `${id}-timer`),
        createWidgetInstance('today_tasks', `${id}-tasks`),
        note,
        createWidgetInstance('agenda', `${id}-agenda`),
        createWidgetInstance('shortcuts', `${id}-shortcuts`),
        createWidgetInstance('weekly_activity', `${id}-weekly`),
      ],
    };
  }

  if (template === 'proyek') {
    return {
      id,
      name: customName || 'Manajemen Proyek',
      template: 'proyek',
      createdAt: Date.now(),
      widgets: [
        createWidgetInstance('project_status', `${id}-projects`),
        createWidgetInstance('today_tasks', `${id}-tasks`),
        createWidgetInstance('agenda', `${id}-agenda`),
        createWidgetInstance('focus_timer', `${id}-timer`),
        createWidgetInstance('weekly_activity', `${id}-weekly`),
        createWidgetInstance('quick_note', `${id}-note`),
        createWidgetInstance('shortcuts', `${id}-shortcuts`),
      ],
    };
  }

  // Default: 'kerja'
  return {
    id,
    name: customName || 'Ruang Kerja Utama',
    template: 'kerja',
    createdAt: Date.now(),
    widgets: [
      createWidgetInstance('clock_date', `${id}-clock`),
      createWidgetInstance('focus_timer', `${id}-timer`),
      createWidgetInstance('today_tasks', `${id}-tasks`),
      createWidgetInstance('quick_note', `${id}-note`),
      createWidgetInstance('agenda', `${id}-agenda`),
      createWidgetInstance('shortcuts', `${id}-shortcuts`),
      createWidgetInstance('weekly_activity', `${id}-weekly`),
      createWidgetInstance('project_status', `${id}-projects`),
    ],
  };
}

export function createSeedActivityLog(): Record<
  string,
  { focusSessions: number; completedTasks: number }
> {
  const days = getLast7DaysMeta();
  const sampleFocus = [2, 3, 1, 4, 3, 2, 2];
  const sampleTasks = [3, 4, 2, 5, 4, 3, 1];
  const log: Record<string, { focusSessions: number; completedTasks: number }> = {};

  days.forEach((d, idx) => {
    log[d.dateKey] = {
      focusSessions: sampleFocus[idx] ?? 2,
      completedTasks: sampleTasks[idx] ?? 2,
    };
  });
  return log;
}

export function createInitialDashboardState(): DashboardStoreState {
  const wsKerja = createWorkspaceFromTemplate('kerja', 'Kerja', 'ws-default-kerja');
  const wsBelajar = createWorkspaceFromTemplate('belajar', 'Belajar', 'ws-default-belajar');
  const wsProyek = createWorkspaceFromTemplate('proyek', 'Proyek', 'ws-default-proyek');

  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    activeWorkspaceId: wsKerja.id,
    workspaces: [wsKerja, wsBelajar, wsProyek],
    editMode: false,
    showDashboardOnDesktop: true,
    showDesktopShortcutsBar: true,
    browserNotificationsEnabled: false,
    onboardingCompleted: false,
    activityLog: createSeedActivityLog(),
  };
}

/**
 * Simple schema migration & defensive sanitization for corrupted localStorage data (Bagian A.1 & E.3)
 */
export function migrateDashboardState(raw: unknown): DashboardStoreState {
  const fallback = createInitialDashboardState();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const candidate = raw as Partial<DashboardStoreState>;

  // Validate workspaces array
  const rawWorkspaces = Array.isArray(candidate.workspaces) ? candidate.workspaces : [];
  const validWorkspaces: DashboardWorkspaceItem[] = rawWorkspaces
    .filter((ws): ws is DashboardWorkspaceItem =>
      Boolean(ws && typeof ws === 'object' && typeof ws.id === 'string' && typeof ws.name === 'string')
    )
    .map((ws) => {
      const rawWidgets = Array.isArray(ws.widgets) ? ws.widgets : [];
      const sanitizedWidgets: WidgetInstance[] = rawWidgets
        .filter(
          (w): w is WidgetInstance =>
            Boolean(
              w &&
                typeof w === 'object' &&
                typeof w.id === 'string' &&
                typeof w.type === 'string' &&
                w.type in WIDGET_CATALOG_META
            )
        )
        .map((w) => {
          const meta = WIDGET_CATALOG_META[w.type];
          const colSpan = Math.max(
            meta.minColSpan,
            Math.min(meta.maxColSpan, Number(w.colSpan) || meta.defaultColSpan)
          ) as 1 | 2 | 3 | 4;

          return {
            id: w.id,
            type: w.type,
            title: typeof w.title === 'string' && w.title.trim() ? w.title : meta.title,
            colSpan,
            rowSpan: w.rowSpan === 2 ? 2 : 1,
            data: {
              ...createDefaultWidgetData(w.type),
              ...(w.data && typeof w.data === 'object' ? w.data : {}),
            },
            simulatedState: 'ready',
          };
        });

      return {
        id: ws.id,
        name: ws.name.trim() || 'Workspace',
        template:
          ws.template === 'belajar' || ws.template === 'proyek' ? ws.template : 'kerja',
        widgets:
          sanitizedWidgets.length > 0
            ? sanitizedWidgets
            : createWorkspaceFromTemplate('kerja', ws.name, ws.id).widgets,
        createdAt: Number(ws.createdAt) || Date.now(),
      };
    });

  const finalWorkspaces =
    validWorkspaces.length > 0 ? validWorkspaces : fallback.workspaces;

  const activeExists = finalWorkspaces.some(
    (w) => w.id === candidate.activeWorkspaceId
  );

  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    activeWorkspaceId: activeExists
      ? String(candidate.activeWorkspaceId)
      : finalWorkspaces[0].id,
    workspaces: finalWorkspaces,
    editMode: Boolean(candidate.editMode),
    showDashboardOnDesktop:
      typeof candidate.showDashboardOnDesktop === 'boolean'
        ? candidate.showDashboardOnDesktop
        : true,
    showDesktopShortcutsBar:
      typeof candidate.showDesktopShortcutsBar === 'boolean'
        ? candidate.showDesktopShortcutsBar
        : true,
    browserNotificationsEnabled: Boolean(candidate.browserNotificationsEnabled),
    onboardingCompleted: Boolean(candidate.onboardingCompleted),
    activityLog:
      candidate.activityLog && typeof candidate.activityLog === 'object'
        ? { ...createSeedActivityLog(), ...candidate.activityLog }
        : createSeedActivityLog(),
  };
}

export function loadDashboardStateFromStorage(): DashboardStoreState {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDashboardState();
      saveDashboardStateToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const migrated = migrateDashboardState(parsed);
    if (parsed.schemaVersion !== DASHBOARD_SCHEMA_VERSION) {
      saveDashboardStateToStorage(migrated);
    }
    return migrated;
  } catch {
    // Corrupted localStorage fallback (Bagian E.3)
    const recovered = createInitialDashboardState();
    saveDashboardStateToStorage(recovered);
    return recovered;
  }
}

export function saveDashboardStateToStorage(state: DashboardStoreState): boolean {
  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function validateAndParseDashboardImport(rawText: string): {
  ok: boolean;
  message: string;
  state?: DashboardStoreState;
} {
  try {
    if (!rawText || !rawText.trim()) {
      return {
        ok: false,
        message: 'Berkas JSON kosong. Pilih berkas ekspor WebWorkstation yang valid.',
      };
    }
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        message: 'Format JSON tidak dikenali sebagai objek konfigurasi.',
      };
    }

    // Support both direct DashboardStoreState and combined archive
    const target = parsed.dashboardState ? parsed.dashboardState : parsed;
    if (!Array.isArray(target.workspaces) || target.workspaces.length === 0) {
      return {
        ok: false,
        message:
          'Berkas JSON tidak memiliki daftar workspace atau widget yang valid.',
      };
    }

    const migrated = migrateDashboardState({
      ...target,
      onboardingCompleted: true,
    });

    return {
      ok: true,
      message: `Berhasil mengimpor ${migrated.workspaces.length} workspace beserta seluruh data widget.`,
      state: migrated,
    };
  } catch {
    return {
      ok: false,
      message:
        'Gagal membaca berkas JSON: struktur berkas rusak atau bukan format JSON yang sah.',
    };
  }
}

export async function requestBrowserNotificationPermission(): Promise<{
  granted: boolean;
  message: string;
}> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        granted: false,
        message: 'Browser Anda tidak mendukung fitur Web Notifications API.',
      };
    }
    if (Notification.permission === 'granted') {
      return {
        granted: true,
        message: 'Izin notifikasi browser sudah aktif.',
      };
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      return {
        granted: true,
        message: 'Izin notifikasi browser berhasil diaktifkan.',
      };
    }
    return {
      granted: false,
      message: 'Izin notifikasi ditolak atau diblokir oleh pengaturan browser.',
    };
  } catch {
    return {
      granted: false,
      message: 'Tidak dapat meminta izin notifikasi di lingkungan pratinjau ini.',
    };
  }
}

export function sendBrowserNotification(
  title: string,
  body: string,
  enabledInStore: boolean
): void {
  if (!enabledInStore) return;
  try {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(title, { body });
    }
  } catch {
    // Ignore errors in restricted iframe environments
  }
}

export const sendSafeBrowserNotification = sendBrowserNotification;

export function getLast7DaysActivity(
  activityLog: Record<string, DailyActivityRecord>
): WeeklyActivityDay[] {
  return getLast7DaysMeta().map((meta) => {
    const rec = activityLog[meta.dateKey] || {
      focusSessions: 0,
      completedTasks: 0,
    };
    return {
      dateKey: meta.dateKey,
      label: meta.label,
      focusSessions: rec.focusSessions,
      completedTasks: rec.completedTasks,
    };
  });
}


