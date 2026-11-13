export type WidgetType =
  | 'focus_timer'
  | 'today_tasks'
  | 'quick_note'
  | 'shortcuts'
  | 'agenda'
  | 'weekly_activity'
  | 'project_status'
  | 'clock_date';

export type WidgetSpan = 1 | 2 | 3 | 4;

export type WidgetVisualState = 'ready' | 'loading' | 'error';

export type TaskPriority = 'rendah' | 'sedang' | 'tinggi';

export interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number;
}

export type NoteColorKey = 'default' | 'sky' | 'amber' | 'emerald' | 'rose';

export interface ShortcutLinkItem {
  id: string;
  name: string;
  url: string;
}

export interface AgendaEventItem {
  id: string;
  title: string;
  time: string; // HH:mm
  isDeadline: boolean;
  notified?: boolean;
}

export type ProjectHealth = 'on_track' | 'at_risk' | 'not_started';

export interface ProjectItem {
  id: string;
  name: string;
  status: ProjectHealth;
  progress: number; // 0 - 100
}

export interface FocusTimerData {
  focusMinutes: number;
  breakMinutes: number;
  sessionsToday: number;
  lastSessionDate: string; // YYYY-MM-DD
}

export interface TodayTasksData {
  tasks: TaskItem[];
  filterPriority: 'all' | TaskPriority;
}

export interface QuickNoteData {
  content: string;
  bgColor: NoteColorKey;
  updatedAt: number;
}

export interface ShortcutsWidgetData {
  links: ShortcutLinkItem[];
}

export interface AgendaWidgetData {
  events: AgendaEventItem[];
}

export interface WeeklyActivityDay {
  dateKey: string; // YYYY-MM-DD
  label: string; // Sen, Sel, Rab...
  focusSessions: number;
  completedTasks: number;
}

export interface WeeklyActivityData {
  goalPerDay: number;
}

export interface ProjectStatusData {
  projects: ProjectItem[];
}

export interface ClockDateData {
  showSeconds: boolean;
  customGreetingName: string;
}

export type WidgetDataMap = {
  focus_timer: FocusTimerData;
  today_tasks: TodayTasksData;
  quick_note: QuickNoteData;
  shortcuts: ShortcutsWidgetData;
  agenda: AgendaWidgetData;
  weekly_activity: WeeklyActivityData;
  project_status: ProjectStatusData;
  clock_date: ClockDateData;
};

export interface WidgetInstance<T extends WidgetType = WidgetType> {
  id: string;
  type: T;
  title: string;
  colSpan: WidgetSpan;
  rowSpan: 1 | 2;
  data: WidgetDataMap[T];
   simulatedState?: WidgetVisualState;
}

export type WorkspaceTemplateId = 'belajar' | 'kerja' | 'proyek';

export interface DashboardWorkspaceItem {
  id: string;
  name: string;
  template: WorkspaceTemplateId;
  widgets: WidgetInstance[];
  createdAt: number;
}

export interface DailyActivityRecord {
  focusSessions: number;
  completedTasks: number;
}

export interface DashboardStoreState {
  schemaVersion: number;
  activeWorkspaceId: string;
  workspaces: DashboardWorkspaceItem[];
  editMode: boolean;
  showDashboardOnDesktop: boolean;
  showDesktopShortcutsBar: boolean;
  browserNotificationsEnabled: boolean;
  onboardingCompleted: boolean;
  activityLog: Record<string, DailyActivityRecord>; // key: YYYY-MM-DD
}
