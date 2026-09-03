// ============================================================
// PageHeader — Reusable page header with back navigation
// ============================================================

import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  backTo = '/',
  backLabel = 'Home',
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-20 border-b border-[#e8ddd0]/60"
      style={{ background: 'rgba(253,252,248,0.95)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
          <div className="w-px h-4 bg-stone-200 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="w-7 h-7 rounded-lg wood-border flex items-center justify-center shrink-0 text-white text-xs">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="font-bold text-stone-800 text-sm leading-tight truncate"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-stone-400 leading-tight truncate hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
