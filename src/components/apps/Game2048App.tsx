import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOS } from '../../context/OSContext';

type Grid = number[][];

const createEmptyGrid = (): Grid => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const addRandomTile = (grid: Grid): Grid => {
  const next = grid.map((r) => [...r]);
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (next[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return next;
  const [rr, cc] = empty[Math.floor(Math.random() * empty.length)];
  next[rr][cc] = Math.random() < 0.9 ? 2 : 4;
  return next;
};

const slideRow = (row: number[]): { newRow: number[]; gained: number } => {
  const nonZero = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const val = nonZero[i] * 2;
      merged.push(val);
      gained += val;
      i += 2;
    } else {
      merged.push(nonZero[i]);
      i += 1;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { newRow: merged, gained };
};

export const Game2048App: React.FC = () => {
  const { t } = useOS();
  const [grid, setGrid] = useState<Grid>(() =>
    addRandomTile(addRandomTile(createEmptyGrid()))
  );
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(512);

  const resetGame = () => {
    setGrid(addRandomTile(addRandomTile(createEmptyGrid())));
    setScore(0);
  };

  const move = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    setGrid((prev) => {
      let next = prev.map((r) => [...r]);
      let totalGained = 0;

      if (dir === 'left' || dir === 'right') {
        next = next.map((row) => {
          const working = dir === 'right' ? [...row].reverse() : [...row];
          const { newRow, gained } = slideRow(working);
          totalGained += gained;
          return dir === 'right' ? newRow.reverse() : newRow;
        });
      } else {
        for (let c = 0; c < 4; c++) {
          const col = [next[0][c], next[1][c], next[2][c], next[3][c]];
          const working = dir === 'down' ? col.reverse() : col;
          const { newRow, gained } = slideRow(working);
          totalGained += gained;
          const finalCol = dir === 'down' ? newRow.reverse() : newRow;
          for (let r = 0; r < 4; r++) {
            next[r][c] = finalCol[r];
          }
        }
      }

      const changed = JSON.stringify(prev) !== JSON.stringify(next);
      if (!changed) return prev;

      setScore((s) => {
        const ns = s + totalGained;
        setBestScore((b) => Math.max(b, ns));
        return ns;
      });
      return addRandomTile(next);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
      else if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 0:
        return 'bg-slate-200/70 dark:bg-slate-800/70 text-transparent';
      case 2:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100';
      case 4:
        return 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100';
      case 8:
        return 'bg-orange-400 text-white';
      case 16:
        return 'bg-orange-500 text-white';
      case 32:
        return 'bg-rose-500 text-white';
      case 64:
        return 'bg-rose-600 text-white';
      case 128:
        return 'bg-sky-500 text-white';
      case 256:
        return 'bg-indigo-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div className="w-full max-w-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">2048</h2>
          <p className="text-[11px] text-slate-400">
            {t('Gunakan tombol arah atau kontrol bawah', 'Use arrow keys or buttons below')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-right">
            <div className="text-[10px] text-slate-400">{t('SKOR', 'SCORE')}</div>
            <div className="text-sm font-mono tabular-nums font-bold">{score}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-right">
            <div className="text-[10px] text-slate-400">BEST</div>
            <div className="text-sm font-mono tabular-nums font-bold text-sky-500">
              {bestScore}
            </div>
          </div>
          <button
            onClick={resetGame}
            className="p-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600"
            title={t('Mulai Ulang', 'New Game')}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* 4x4 Board */}
      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-300 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 w-full max-w-xs aspect-square">
        {grid.flatMap((row, rIdx) =>
          row.map((val, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`rounded-lg flex items-center justify-center font-mono tabular-nums font-bold text-lg transition-colors ${getTileColor(
                val
              )}`}
            >
              {val > 0 ? val : ''}
            </div>
          ))
        )}
      </div>

      {/* Touch / Mouse Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => move('left')}
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => move('up')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => move('down')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowDown size={16} />
          </button>
        </div>
        <button
          onClick={() => move('right')}
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
