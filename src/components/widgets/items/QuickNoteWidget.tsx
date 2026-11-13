import React from 'react';
import { StickyNote } from 'lucide-react';
import { NoteColorKey } from '../../../types/dashboard';
import { useDashboardStoreApi, useWidgetById } from '../../../store/DashboardStore';
import { WidgetCardShell } from '../WidgetCardShell';

interface QuickNoteWidgetProps {
  widgetId: string;
  editMode: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (id: string) => void;
}

const NOTE_COLORS: { key: NoteColorKey; label: string; cssVar: string; swatch: string }[] = [
  { key: 'default', label: 'Standar', cssVar: 'var(--note-bg-default)', swatch: 'bg-slate-400' },
  { key: 'sky', label: 'Biru', cssVar: 'var(--note-bg-sky)', swatch: 'bg-sky-400' },
  { key: 'amber', label: 'Kuning', cssVar: 'var(--note-bg-amber)', swatch: 'bg-amber-400' },
  { key: 'emerald', label: 'Hijau', cssVar: 'var(--note-bg-emerald)', swatch: 'bg-emerald-400' },
  { key: 'rose', label: 'Merah Muda', cssVar: 'var(--note-bg-rose)', swatch: 'bg-rose-400' },
];

export const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = React.memo(
  ({ widgetId, editMode, onDragStart, onDragOver, onDrop }) => {
    const widget = useWidgetById<'quick_note'>(widgetId);
    const store = useDashboardStoreApi();

    if (!widget) return null;

    const content = widget.data.content || '';
    const bgColor = widget.data.bgColor || 'default';
    const activeColorObj =
      NOTE_COLORS.find((c) => c.key === bgColor) || NOTE_COLORS[0];

    const handleContentChange = (val: string) => {
      store.updateWidgetData<'quick_note'>(widgetId, (prev) => ({
        ...prev,
        content: val,
        updatedAt: Date.now(),
      }));
    };

    const handleColorChange = (color: NoteColorKey) => {
      store.updateWidgetData<'quick_note'>(widgetId, (prev) => ({
        ...prev,
        bgColor: color,
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
        rightInfo={`${content.length} kar`}
        customBgStyle={{ background: activeColorObj.cssVar }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col justify-between h-full gap-2.5">
          {content.length === 0 ? (
            <div className="flex flex-col gap-2 flex-1">
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Ketik catatan cepat di sini (tersimpan otomatis)..."
                aria-label="Isi catatan cepat"
                rows={4}
                className="ws-focusable w-full flex-1 resize-none rounded-xl border border-[var(--border-subtle)] bg-transparent p-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() =>
                  handleContentChange(
                    'Daftar Poin Penting:\n- Tinjau target mingguan\n- Siapkan agenda besok'
                  )
                }
                className="ws-focusable self-start flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-semibold"
              >
                <StickyNote size={12} />
                <span>Isi Template Catatan</span>
              </button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Ketik catatan cepat di sini..."
              aria-label="Isi catatan cepat"
              rows={5}
              className="ws-focusable w-full flex-1 resize-none rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 text-xs leading-relaxed text-[var(--text-primary)]"
            />
          )}

          {/* Card Background Color Selector + Auto-save Indicator */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5" role="group" aria-label="Pilih warna latar kartu">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleColorChange(c.key)}
                  aria-label={`Warna kartu ${c.label}`}
                  title={`Warna ${c.label}`}
                  className={`ws-focusable w-4 h-4 rounded-full ${c.swatch} transition-transform ${
                    bgColor === c.key
                      ? 'ring-2 ring-sky-500 scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Tersimpan otomatis
            </span>
          </div>
        </div>
      </WidgetCardShell>
    );
  }
);
