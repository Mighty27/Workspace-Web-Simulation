import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, CheckCircle2 } from 'lucide-react';
import { TaskItem, TaskPriority } from '../../../types/dashboard';
import { useDashboardStoreApi, useWidgetById } from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';

interface TodayTasksWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const TodayTasksWidget: React.FC<TodayTasksWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'today_tasks'>(widgetId);
    const store = useDashboardStoreApi();

    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('sedang');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    if (!widget) return null;

    const tasks = widget.data.tasks || [];
    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const progressPercent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = newTitle.trim();
      if (!cleaned) return;
      const item: TaskItem = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: cleaned,
        priority: newPriority,
        completed: false,
        createdAt: Date.now(),
      };
      store.updateWidgetData<'today_tasks'>(widgetId, (prev) => ({
        ...prev,
        tasks: [item, ...(prev.tasks || [])],
      }));
      setNewTitle('');
    };

    const handleToggleTask = (taskId: string) => {
      let delta: 1 | -1 = 1;
      store.updateWidgetData<'today_tasks'>(widgetId, (prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          delta = !t.completed ? 1 : -1;
          return { ...t, completed: !t.completed };
        }),
      }));
      store.recordTaskCompletionDelta(delta);
    };

    const handleDeleteTask = (taskId: string) => {
      store.updateWidgetData<'today_tasks'>(widgetId, (prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
    };

    const handleSaveEdit = (taskId: string) => {
      const cleaned = editingText.trim();
      if (cleaned) {
        store.updateWidgetData<'today_tasks'>(widgetId, (prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, title: cleaned } : t
          ),
        }));
      }
      setEditingId(null);
    };

    const renderPriorityBadge = (priority: TaskPriority) => {
      const styles: Record<TaskPriority, string> = {
        tinggi: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        sedang: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        rendah: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border shrink-0 ${styles[priority]}`}
        >
          {priority}
        </span>
      );
    };

    return (
      <WidgetCardShell
        widgetId={widget.id}
        type={widget.type}
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        visualState={widget.simulatedState}
        rightInfo={`${completedCount}/${totalCount} (${progressPercent}%)`}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between h-full gap-3">
          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-sky-500 transition-all duration-150"
            />
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex items-center gap-1.5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tambah tugas hari ini..."
              aria-label="Judul tugas baru"
              className="ws-focusable flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/80 dark:bg-slate-800/80 text-xs"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              aria-label="Prioritas tugas"
              className="ws-focusable px-2 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-medium"
            >
              <option value="rendah">Rendah</option>
              <option value="sedang">Sedang</option>
              <option value="tinggi">Tinggi</option>
            </select>
            <button
              type="submit"
              aria-label="Tambah tugas"
              className="ws-focusable p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0"
            >
              <Plus size={15} />
            </button>
          </form>

          {/* Tasks List or Empty State (Bagian A.5) */}
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-5 text-center gap-1.5 border border-dashed border-[var(--border-subtle)] rounded-xl">
              <CheckCircle2 size={20} className="text-emerald-500 opacity-80" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Belum ada tugas hari ini
              </p>
              <button
                type="button"
                onClick={() => {
                  store.updateWidgetData<'today_tasks'>(widgetId, (prev) => ({
                    ...prev,
                    tasks: [
                      {
                        id: `t-${Date.now()}`,
                        title: 'Rencanakan 3 prioritas utama hari ini',
                        priority: 'tinggi',
                        completed: false,
                        createdAt: Date.now(),
                      },
                    ],
                  }));
                }}
                className="ws-focusable mt-1 px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-semibold hover:bg-sky-500/25"
              >
                + Buat Tugas Contoh
              </button>
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-[var(--border-subtle)] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      aria-label={`Tandai selesai: ${task.title}`}
                      className="ws-focusable w-4 h-4 accent-sky-500 rounded shrink-0 cursor-pointer"
                    />
                    {editingId === task.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleSaveEdit(task.id)
                          }
                          autoFocus
                          className="ws-focusable flex-1 px-2 py-0.5 rounded border border-sky-500 bg-white dark:bg-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          aria-label="Simpan perubahan tugas"
                          onClick={() => handleSaveEdit(task.id)}
                          className="text-emerald-500 p-0.5"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label="Batalkan edit tugas"
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 p-0.5"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`truncate ${
                          task.completed
                            ? 'line-through text-[var(--text-muted)]'
                            : 'font-medium text-[var(--text-primary)]'
                        }`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {renderPriorityBadge(task.priority)}
                    <button
                      type="button"
                      aria-label={`Edit tugas ${task.title}`}
                      onClick={() => {
                        setEditingId(task.id);
                        setEditingText(task.title);
                      }}
                      className="ws-focusable p-1 rounded text-[var(--text-muted)] hover:text-sky-500"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus tugas ${task.title}`}
                      onClick={() => handleDeleteTask(task.id)}
                      className="ws-focusable p-1 rounded text-[var(--text-muted)] hover:text-rose-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </WidgetCardShell>
    );
  }
);
