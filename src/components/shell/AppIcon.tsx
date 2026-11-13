import React from 'react';
import {
  FolderOpen,
  FileText,
  Calculator,
  Clock,
  Palette,
  Globe,
  ShoppingBag,
  Activity,
  Settings,
  Gamepad2,
  PenTool,
  BookOpen,
  Terminal,
  Flame,
  Code2,
  AppWindow,
  ExternalLink,
} from 'lucide-react';

interface AppIconProps {
  icon: string;
  appId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const APP_COLOR_MAP: Record<string, string> = {
  files: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  notepad: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  calculator: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  clock: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  paint: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  browser: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  store: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'task-manager': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  settings: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
  'game-2048': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'excalidraw-web': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'wikipedia- encyclopedia': 'bg-stone-400/15 text-stone-300 border-stone-400/30',
  'cyberchef-tool': 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  'a-dark-room': 'bg-red-500/15 text-red-400 border-red-500/30',
  'github-web': 'bg-zinc-400/15 text-zinc-200 border-zinc-400/30',
};

export const AppIcon: React.FC<AppIconProps> = ({
  icon,
  appId = '',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-md',
    md: 'w-9 h-9 rounded-lg',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  }[size];

  const iconPixelSize = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
  }[size];

  const colorStyle =
    APP_COLOR_MAP[appId] || 'bg-sky-500/15 text-sky-400 border-sky-500/30';

  const renderGlyph = () => {
    switch (icon) {
      case 'FolderOpen':
        return <FolderOpen size={iconPixelSize} />;
      case 'FileText':
        return <FileText size={iconPixelSize} />;
      case 'Calculator':
        return <Calculator size={iconPixelSize} />;
      case 'Clock':
        return <Clock size={iconPixelSize} />;
      case 'Palette':
        return <Palette size={iconPixelSize} />;
      case 'Globe':
        return <Globe size={iconPixelSize} />;
      case 'ShoppingBag':
        return <ShoppingBag size={iconPixelSize} />;
      case 'Activity':
        return <Activity size={iconPixelSize} />;
      case 'Settings':
        return <Settings size={iconPixelSize} />;
      case 'Gamepad2':
        return <Gamepad2 size={iconPixelSize} />;
      case 'PenTool':
        return <PenTool size={iconPixelSize} />;
      case 'BookOpen':
        return <BookOpen size={iconPixelSize} />;
      case 'Terminal':
        return <Terminal size={iconPixelSize} />;
      case 'Flame':
        return <Flame size={iconPixelSize} />;
      case 'Code2':
        return <Code2 size={iconPixelSize} />;
      case 'ExternalLink':
        return <ExternalLink size={iconPixelSize} />;
      default:
        return <AppWindow size={iconPixelSize} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center border shrink-0 transition-transform duration-150 ${sizeClasses} ${colorStyle} ${className}`}
    >
      {renderGlyph()}
    </div>
  );
};
