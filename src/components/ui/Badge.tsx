import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'wood' | 'red' | 'green' | 'blue' | 'gold' | 'grey';
  size?: 'sm' | 'md';
}

export function Badge({ children, color = 'wood', size = 'sm' }: BadgeProps) {
  const colors = {
    wood: 'bg-[#f0e6d3] text-[#7d5230] border border-[#d4b896]',
    red: 'bg-[#fdf0ee] text-[#c0392b] border border-[#e74c3c]/30',
    green: 'bg-green-50 text-green-700 border border-green-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    gold: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
    grey: 'bg-stone-100 text-stone-600 border border-stone-200',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span className={clsx('inline-flex items-center font-semibold rounded-full', colors[color], sizes[size])}>
      {children}
    </span>
  );
}
