import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 cursor-pointer select-none border-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const variants = {
    primary: 'bg-gradient-to-br from-[#7d5230] to-[#9b6e42] text-white shadow-[0_4px_16px_rgba(125,82,48,0.35)] hover:shadow-[0_8px_24px_rgba(125,82,48,0.45)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#7d5230]',
    secondary: 'bg-white/80 text-[#5e3a1e] border-2 border-[#d4b896] hover:bg-[#f5ede0] hover:border-[#b8926a] hover:-translate-y-0.5 backdrop-blur-sm focus-visible:ring-[#b8926a]',
    ghost: 'bg-transparent text-[#7d5230] hover:bg-[#f5ede0] focus-visible:ring-[#7d5230]',
    danger: 'bg-gradient-to-br from-[#c0392b] to-[#e74c3c] text-white shadow-[0_4px_16px_rgba(192,57,43,0.35)] hover:shadow-[0_8px_24px_rgba(192,57,43,0.45)] hover:-translate-y-0.5 focus-visible:ring-[#e74c3c]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      className={clsx(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none', className)}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
