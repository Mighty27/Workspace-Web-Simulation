import React, { useState } from 'react';
import { Plus, Trash2, FolderKanban } from 'lucide-react';
import {
  useDashboardStoreApi,
  useWidgetById,
} from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';
import { ProjectHealth, ProjectItem } from '../../../types/dashboard';

interface ProjectStatusWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

const STATUS_META: Record<
  ProjectHealth,
  { label: string; dotClass: string; badgeClass: string; next: ProjectHealth }
> = {
  on_track: {
    label: 'On Track',
    dotClass: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    next: 'at_risk',
  },
  at_risk: {
    label: 'Berisiko',
    dotClass: 'bg-amber-500',
    badgeClass:
      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    next: 'not_started',
  },
  not_started: {
    label: 'Belum Mulai',
    dotClass: 'bg-slate-400',
    badgeClass:
      'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    next: 'on_track',
  },
};

export const ProjectStatusWidget: React.FC<ProjectStatusWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'project_status'>(widgetId);
    const store = useDashboardStoreApi();

    const [newName, setNewName] = useState('');
    const [newStatus, setNewStatus] = useState<ProjectHealth>('on_track');

    if (!widget) return null;

    const { projects } = widget.data;
    const avgProgress =
      projects.length > 0
        ? Math.round(
            projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
          )
        : 0;

    const handleAddProject = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newName.trim();
      if (!trimmed) return;
      const item: ProjectItem = {
        id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        status: newStatus,
        progress: newStatus === 'not_started' ? 0 : 25,
      };
      store.updateWidgetData<'project_status'>(widgetId, (prev) => ({
        ...prev,
        projects: [...prev.projects, item],
      }));
      setNewName('');
    };

    const handleProgressChange = (projectId: string, nextVal: number) => {
      const clamped = Math.max(0, Math.min(100, nextVal));
      store.updateWidgetData<'project_status'>(widgetId, (prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                progress: clamped,
                status:
                  clamped === 0
                    ? 'not_started'
                    : p.status === 'not_started'
                    ? 'on_track'
                    : p.status,
              }
            : p
        ),
      }));
    };

    const cycleProjectStatus = (projectId: string) => {
      store.updateWidgetData<'project_status'>(widgetId, (prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, status: STATUS_META[p.status].next }
            : p
        ),
      }));
    };

    const deleteProject = (projectId: string) => {
      store.updateWidgetData<'project_status'>(widgetId, (prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
      }));
    };

    const addSampleProjects = () => {
      store.updateWidgetData<'project_status'>(widgetId, () => ({
        projects: [
          {
            id: `prj-${Date.now()}-1`,
            name: 'Redesign Sistem Widget',
            status: 'on_track',
            progress: 80,
          },
          {
            id: `prj-${Date.now()}-2`,
            name: 'Integrasi Penyimpanan Lokal',
            status: 'at_risk',
            progress: 45,
          },
        ],
      }));
    };

    return (
      <WidgetCardShell
        widgetId={widgetId}
        type="project_status"
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        rightInfo={`Rata-rata ${avgProgress}%`}
        visualState={widget.simulatedState}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between gap-3 h-full">
          {/* Add Project Form */}
          <form onSubmit={handleAddProject} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Nama proyek baru..."
              aria-label="Nama proyek baru"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              className="ws-focusable flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/70 dark:bg-slate-800/70 text-xs placeholder:text-[var(--text-muted)]"
            />
            <select
              aria-label="Status proyek baru"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ProjectHealth)}
              className="ws-focusable px-2 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/70 dark:bg-slate-800/70 text-[11px] font-medium"
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">Berisiko</option>
              <option value="not_started">Belum Mulai</option>
            </select>
            <button
              type="submit"
              aria-label="Tambah proyek"
              className="ws-focusable p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0"
            >
              <Plus size={14} />
            </button>
          </form>

          {/* Project List or Empty State */}
          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)]">
              <FolderKanban size={22} className="text-sky-500/70" />
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                Belum ada proyek yang dipantau
              </div>
              <button
                type="button"
                onClick={addSampleProjects}
                className="ws-focusable px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-semibold hover:bg-sky-500/25"
              >
                + Muat Proyek Contoh
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5 max-h-48 overflow-y-auto pr-0.5">
              {projects.map((prj) => {
                const st = STATUS_META[prj.status];
                return (
                  <li
                    key={prj.id}
                    className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {prj.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => cycleProjectStatus(prj.id)}
                          title="Klik untuk mengganti status indikator proyek"
                          className={`ws-focusable flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`}
                          />
                          <span>{st.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(prj.id)}
                          aria-label={`Hapus proyek ${prj.name}`}
                          className="ws-focusable p-1 rounded text-rose-500 opacity-75 hover:opacity-100 hover:bg-rose-500/15"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        aria-label={`Persentase kemajuan ${prj.name}`}
                        value={prj.progress}
                        onChange={(e) =>
                          handleProgressChange(prj.id, Number(e.target.value))
                        }
                        className="ws-focusable flex-1 accent-sky-500 h-1.5 rounded-lg cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-bold text-sky-500 w-9 text-right">
                        {prj.progress}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </WidgetCardShell>
    );
  }
);
