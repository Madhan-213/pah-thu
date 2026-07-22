import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Player } from '@/types/game';

interface TimerProps {
  seconds: number | null;        // Current per-move remaining seconds
  totalLimit?: number | null;    // Per-move limit (e.g. 15s)
  isActive: boolean;
  player: Player;
  onTimeout: () => void;
  onTick: (s: number) => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

export function Timer({
  seconds,
  totalLimit = 15,
  isActive,
  player,
  onTimeout,
  onTick,
}: TimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (seconds === null) return;

    if (isActive) {
      intervalRef.current = setInterval(() => {
        const next = Math.max(0, (seconds ?? 0) - 1);
        onTick(next);
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeout();
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, seconds]);

  if (seconds === null) {
    return (
      <div className={clsx(
        'px-4 py-2 rounded-xl text-sm font-medium border text-stone-500 bg-stone-50 border-stone-200'
      )}>
        ∞ Untimed
      </div>
    );
  }

  const currentSec = seconds ?? 0;
  const maxLimit = totalLimit || 15;
  const isLow = currentSec <= 5;
  const isVeryLow = currentSec <= 3;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, currentSec / maxLimit));

  return (
    <motion.div
      animate={isVeryLow && isActive ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.4, repeat: Infinity }}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200',
        isVeryLow && isActive
          ? 'bg-red-50 border-red-400 text-red-700 shadow-sm'
          : isLow && isActive
          ? 'bg-orange-50 border-orange-300 text-orange-700'
          : isActive
          ? player === 1
            ? 'bg-red-50/70 border-red-200'
            : 'bg-slate-100/70 border-slate-300'
          : 'bg-stone-50 border-stone-200 opacity-60'
      )}
    >
      <svg width="42" height="42" viewBox="0 0 44 44" className="shrink-0">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
        <motion.circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={isVeryLow ? '#e74c3c' : isLow ? '#e67e22' : player === 1 ? '#c0392b' : '#2c3e50'}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progressRatio)}
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>

      <div>
        <div className={clsx(
          'text-2xl font-black tabular-nums leading-none',
          isVeryLow ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-stone-800'
        )}>
          {formatTime(currentSec)}
        </div>
        <div className="text-[10px] uppercase font-bold text-stone-400 mt-0.5 tracking-wider">
          Turn Timer ({maxLimit}s)
        </div>
      </div>
    </motion.div>
  );
}
