import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export function Card({ children, className, hover = false, onClick, padding = 'lg' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={clsx(
        'bg-white/85 rounded-3xl border border-[#d4b896]/35 shadow-[0_4px_32px_rgba(0,0,0,0.08)]',
        'backdrop-blur-sm',
        paddings[padding],
        hover && 'cursor-pointer hover:border-[#b8926a]/50 hover:shadow-[0_8px_48px_rgba(0,0,0,0.12)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
