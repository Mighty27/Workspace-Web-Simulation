import React, { useRef, useState, useEffect } from 'react';
import {
  Brush,
  Eraser,
  Square,
  Circle,
  Minus,
  Undo2,
  Trash2,
  Save,
  Download,
  Wallpaper,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

type ToolType = 'brush' | 'eraser' | 'line' | 'rect' | 'circle';

const PALETTE = [
  '#0ea5e9',
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#a855f7',
  '#f8fafc',
  '#94a3b8',
  '#1e293b',
  '#090d16',
];

export const PaintApp: React.FC = () => {
  const { createFile, updateSettings, notify, t } = useOS();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState('#0ea5e9');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [fileName, setFileName] = useState('Ilustrasi-Kanvas.png');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize dark studio canvas with subtle welcome sketch
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([snap]);
  }, []);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoords(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoords(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore last snapshot before previewing geometric shape
      const lastSnap = history[history.length - 1];
      if (lastSnap) {
        ctx.putImageData(lastSnap, 0, 0);
      }
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
      } else if (tool === 'rect') {
        ctx.rect(
          startPos.x,
          startPos.y,
          pos.x - startPos.x,
          pos.y - startPos.y
        );
      } else if (tool === 'circle') {
        const radius = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-19), snap]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const nextHist = history.slice(0, -1);
    ctx.putImageData(nextHist[nextHist.length - 1], 0, 0);
    setHistory(nextHist);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, snap]);
  };

  const handleSaveToVFS = async (setAsWallpaper = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const finalName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    const saved = await createFile(
      finalName,
      'folder-pictures',
      dataUrl,
      'image/png'
    );
    if (setAsWallpaper) {
      updateSettings({ customWallpaperFileId: saved.id });
      notify(
        t('Wallpaper Kustom Diterapkan', 'Custom Wallpaper Applied'),
        `${finalName} ${t('disimpan di /Pictures dan dijadikan wallpaper.', 'saved to /Pictures and set as wallpaper.')}`,
        'paint'
      );
    } else {
      notify(
        t('Gambar Disimpan ke Files', 'Image Saved to Files'),
        `${finalName} ${t('tersimpan di folder /Pictures.', 'saved in /Pictures folder.')}`,
        'paint'
      );
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs select-none">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {[
            { id: 'brush', icon: <Brush size={14} />, label: t('Kuas', 'Brush') },
            { id: 'eraser', icon: <Eraser size={14} />, label: t('Hapus', 'Eraser') },
            { id: 'line', icon: <Minus size={14} />, label: t('Garis', 'Line') },
            { id: 'rect', icon: <Square size={14} />, label: t('Kotak', 'Rect') },
            { id: 'circle', icon: <Circle size={14} />, label: t('Lingkaran', 'Circle') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTool(item.id as ToolType)}
              title={item.label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                tool === item.id
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Stroke Width */}
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-slate-400 font-mono tabular-nums">{strokeWidth}px</span>
            <input
              type="range"
              min={1}
              max={24}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-sky-500"
            />
          </div>

          {/* Palette */}
          <div className="flex items-center gap-1">
            {PALETTE.map((hex) => (
              <button
                key={hex}
                onClick={() => {
                  setColor(hex);
                  if (tool === 'eraser') setTool('brush');
                }}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  color === hex && tool !== 'eraser'
                    ? 'scale-110 border-white ring-2 ring-sky-500'
                    : 'border-slate-400/40'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>

        {/* File Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-300 dark:hover:bg-slate-700"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:text-rose-500"
            title={t('Bersihkan Kanvas', 'Clear Canvas')}
          >
            <Trash2 size={14} />
          </button>

          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-36 font-mono text-[11px]"
          />

          <button
            onClick={() => handleSaveToVFS(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Save size={13} />
            <span>{t('Simpan ke Files', 'Save to Files')}</span>
          </button>
          <button
            onClick={() => handleSaveToVFS(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            title={t('Jadikan Wallpaper Desktop', 'Set as Desktop Wallpaper')}
          >
            <Wallpaper size={13} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
            title={t('Unduh PNG', 'Download PNG')}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full max-w-[960px] max-h-[540px] rounded-lg border border-slate-300 dark:border-slate-800 shadow-inner cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
};
