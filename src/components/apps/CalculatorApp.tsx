import React, { useState } from 'react';
import { History, Delete, Trash2 } from 'lucide-react';
import { useOS } from '../../context/OSContext';

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
}

export const CalculatorApp: React.FC = () => {
  const { t } = useOS();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<'standard' | 'scientific'>('scientific');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([
    { id: 'h-1', expression: '1440 / 16', result: '90' },
    { id: 'h-2', expression: 'sin(30 deg)', result: '0.5' },
  ]);

  const appendToken = (token: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? token : prev + token));
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handleScientificOp = (op: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    let res = 0;
    let exprLabel = `${op}(${display})`;
    switch (op) {
      case 'sin':
        res = Math.sin((val * Math.PI) / 180);
        break;
      case 'cos':
        res = Math.cos((val * Math.PI) / 180);
        break;
      case 'tan':
        res = Math.tan((val * Math.PI) / 180);
        break;
      case 'sqrt':
        res = Math.sqrt(val);
        exprLabel = `√(${display})`;
        break;
      case 'log':
        res = Math.log10(val);
        break;
      case 'ln':
        res = Math.log(val);
        break;
      case 'sq':
        res = val * val;
        exprLabel = `(${display})²`;
        break;
      case 'inv':
        res = 1 / val;
        exprLabel = `1/(${display})`;
        break;
      default:
        return;
    }
    const formatted = Number.isFinite(res)
      ? String(Number(res.toFixed(8)))
      : 'Error';
    setExpression(exprLabel);
    setDisplay(formatted);
    setHistory((prev) => [
      { id: `h-${Date.now()}`, expression: exprLabel, result: formatted },
      ...prev.slice(0, 29),
    ]);
  };

  const evaluateExpression = () => {
    try {
      const sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/e/g, String(Math.E))
        .replace(/\^/g, '**');

      if (!/^[0-9+\-*/().\s*]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      const computed = Function(`"use strict"; return (${sanitized})`)();
      const formatted =
        typeof computed === 'number' && Number.isFinite(computed)
          ? String(Number(computed.toFixed(8)))
          : 'Error';

      setExpression(`${display} =`);
      setDisplay(formatted);
      if (formatted !== 'Error') {
        setHistory((prev) => [
          { id: `h-${Date.now()}`, expression: display, result: formatted },
          ...prev.slice(0, 29),
        ]);
      }
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 select-none">
      {/* Top Mode & History Switcher */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setMode('standard')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'standard'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('Standar', 'Standard')}
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'scientific'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('Ilmiah', 'Scientific')}
          </button>
        </div>

        <button
          onClick={() => setShowHistory((s) => !s)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            showHistory
              ? 'bg-sky-500 text-white'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <History size={13} />
          <span>{t('Riwayat', 'History')}</span>
        </button>
      </div>

      {/* Numeric Readout */}
      <div className="px-4 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-right flex flex-col justify-end min-h-[96px]">
        <div className="text-xs font-mono tabular-nums text-slate-400 h-5 truncate">
          {expression}
        </div>
        <div className="text-3xl font-mono tabular-nums font-bold tracking-tight truncate select-text">
          {display}
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>{t('Klik item untuk memakai ulang hasil', 'Click an entry to reuse result')}</span>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="flex items-center gap-1 text-rose-500 hover:underline"
              >
                <Trash2 size={12} />
                <span>{t('Bersihkan', 'Clear')}</span>
              </button>
            )}
          </div>
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setDisplay(item.result);
                setShowHistory(false);
              }}
              className="w-full text-right p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 bg-slate-50/60 dark:bg-slate-800/40 transition-colors"
            >
              <div className="text-xs font-mono tabular-nums text-slate-400">
                {item.expression} =
              </div>
              <div className="text-base font-mono tabular-nums font-semibold text-sky-500">
                {item.result}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 p-3 flex flex-col gap-2">
          {mode === 'scientific' && (
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'sin', fn: () => handleScientificOp('sin') },
                { label: 'cos', fn: () => handleScientificOp('cos') },
                { label: 'tan', fn: () => handleScientificOp('tan') },
                { label: '√x', fn: () => handleScientificOp('sqrt') },
                { label: 'log', fn: () => handleScientificOp('log') },
                { label: 'ln', fn: () => handleScientificOp('ln') },
                { label: 'x²', fn: () => handleScientificOp('sq') },
                { label: 'x^y', fn: () => appendToken('^') },
                { label: '(', fn: () => appendToken('(') },
                { label: ')', fn: () => appendToken(')') },
                { label: 'π', fn: () => appendToken('3.14159265') },
                { label: '1/x', fn: () => handleScientificOp('inv') },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={b.fn}
                  className="py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}

          {/* Standard Keypad */}
          <div className="flex-1 grid grid-cols-4 gap-1.5 font-mono text-sm">
            <button
              onClick={handleClear}
              className="rounded-lg font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors"
            >
              AC
            </button>
            <button
              onClick={() => appendToken('(')}
              className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              ( )
            </button>
            <button
              onClick={handleBackspace}
              className="rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Delete size={16} />
            </button>
            <button
              onClick={() => appendToken('÷')}
              className="rounded-lg font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 transition-colors"
            >
              ÷
            </button>

            {['7', '8', '9'].map((n) => (
              <button
                key={n}
                onClick={() => appendToken(n)}
                className="rounded-lg font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => appendToken('×')}
              className="rounded-lg font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 transition-colors"
            >
              ×
            </button>

            {['4', '5', '6'].map((n) => (
              <button
                key={n}
                onClick={() => appendToken(n)}
                className="rounded-lg font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => appendToken('-')}
              className="rounded-lg font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 transition-colors"
            >
              −
            </button>

            {['1', '2', '3'].map((n) => (
              <button
                key={n}
                onClick={() => appendToken(n)}
                className="rounded-lg font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => appendToken('+')}
              className="rounded-lg font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 transition-colors"
            >
              +
            </button>

            <button
              onClick={() => appendToken('0')}
              className="col-span-2 rounded-lg font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              0
            </button>
            <button
              onClick={() => appendToken('.')}
              className="rounded-lg font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              .
            </button>
            <button
              onClick={evaluateExpression}
              className="rounded-lg font-bold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
