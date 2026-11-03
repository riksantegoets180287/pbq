import React from 'react';
import { ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import { ShiftInfo } from '../types';

interface ShiftBadgeProps {
  shift: ShiftInfo;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({
  shift,
  size = 'md',
  showDetails = true,
}) => {
  const { type, label, places } = shift;

  let badgeStyles = '';
  let Icon = Minus;

  switch (type) {
    case 'rise':
      badgeStyles = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      Icon = ArrowUp;
      break;
    case 'fall':
      badgeStyles = 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      Icon = ArrowDown;
      break;
    case 'equal':
      badgeStyles = 'bg-slate-700/50 text-slate-400 border border-slate-600/40';
      Icon = Minus;
      break;
    case 'new':
      badgeStyles = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      Icon = Sparkles;
      break;
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm md:text-base px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg ${textSizes[size]} ${badgeStyles} transition-all`}
      title={label}
    >
      <Icon className={`${iconSizes[size]} shrink-0`} />
      <span>{showDetails ? label : (type === 'new' ? 'Nieuw' : type === 'equal' ? 'Gelijk' : `${places} pl.`)}</span>
    </span>
  );
};
