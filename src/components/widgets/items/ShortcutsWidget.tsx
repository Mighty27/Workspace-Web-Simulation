import React, { useState } from 'react';
import { ExternalLink, Plus, Trash2, Edit3, Globe, Check, X } from 'lucide-react';
import { useDashboardStoreApi, useWidgetById } from '../../../store/DashboardStore';
import { sanitizeExternalUrl } from '../../../utils/storageMigration';
import { WidgetCardShell } from '../WidgetCardShell';

interface ShortcutsWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'shortcuts'>(widgetId);
    const store = useDashboardStoreApi();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [urlInput, setUrlInput] = useState('');

    if (!widget) return null;

    const links = widget.data.links || [];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanName = nameInput.trim();
      if (!cleanName || !urlInput.trim()) return;
      const safeUrl = sanitizeExternalUrl(urlInput);

      if (editingId) {
        store.updateWidgetData<'shortcuts'>(widgetId, (prev) => ({
          ...prev,
          links: prev.links.map((l) =>
            l.id === editingId ? { ...l, name: cleanName, url: safeUrl } : l
          ),
        }));
      } else {
        store.updateWidgetData<'shortcuts'>(widgetId, (prev) => ({
          ...prev,
          links: [
            ...prev.links,
            {
              id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              name: cleanName,
              url: safeUrl,
            },
          ],
        }));
      }

      setNameInput('');
      setUrlInput('');
      setEditingId(null);
      setShowForm(false);
    };

    const handleDelete = (id: string) => {
      store.updateWidgetData<'shortcuts'>(widgetId, (prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== id),
      }));
    };

    return (
      <WidgetCardShell
        widgetId={widget.id}
        type={widget.type}
        title={widget.title}
        colSpan={widget.colSpan}
        editMode={editMode}
        visualState={widget.simulatedState}
        rightInfo={`${links.length} Tautan`}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between h-full gap-2.5">
          {links.length === 0 && !showForm ? (
            <div className="flex-1 flex flex-col items-center justify-center py-5 text-center gap-1.5 border border-dashed border-[var(--border-subtle)] rounded-xl">
              <Globe size={20} className="text-sky-500 opacity-80" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Belum ada pintasan tautan
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="ws-focusable mt-1 px-3 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-semibold"
              >
                + Tambah Pintasan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5">
              {links.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-center justify-between gap-1.5 p-2 rounded-xl border border-[var(--border-subtle)] bg-slate-100/60 dark:bg-slate-800/50 hover:border-sky-500/50 transition-colors"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ws-focusable flex items-center gap-2 min-w-0 flex-1 text-xs font-semibold text-[var(--text-primary)] hover:text-sky-500"
                  >
                    <Globe size={13} className="text-sky-500 shrink-0" />
                    <span className="truncate">{item.name}</span>
                    <ExternalLink size={10} className="opacity-50 shrink-0" />
                  </a>

                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit pintasan ${item.name}`}
                      onClick={() => {
                        setEditingId(item.id);
                        setNameInput(item.name);
                        setUrlInput(item.url);
                        setShowForm(true);
                      }}
                      className="ws-focusable p-0.5 rounded text-[var(--text-muted)] hover:text-sky-500"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus pintasan ${item.name}`}
                      onClick={() => handleDelete(item.id)}
                      className="ws-focusable p-0.5 rounded text-[var(--text-muted)] hover:text-rose-500"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form
              onSubmit={handleSubmit}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-[var(--border-subtle)] space-y-2 text-xs"
            >
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nama situs (mis. Dokumentasi)"
                aria-label="Nama pintasan"
                className="ws-focusable w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                aria-label="URL pintasan"
                className="ws-focusable w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setNameInput('');
                    setUrlInput('');
                  }}
                  className="ws-focusable px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px] flex items-center gap-1"
                >
                  <X size={11} />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  className="ws-focusable px-2.5 py-1 rounded-lg bg-sky-500 text-white font-semibold text-[11px] flex items-center gap-1"
                >
                  <Check size={11} />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNameInput('');
                setUrlInput('');
                setShowForm(true);
              }}
              className="ws-focusable w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-[var(--border-strong)] text-[11px] font-semibold text-[var(--text-secondary)] hover:border-sky-500 hover:text-sky-500 transition-colors"
            >
              <Plus size={13} />
              <span>Tambah Pintasan Baru</span>
            </button>
          )}
        </div>
      </WidgetCardShell>
    );
  }
);
