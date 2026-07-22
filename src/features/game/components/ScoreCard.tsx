import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PlayerScore, Player } from '@/types/game';
import { SCORE_TABLE } from '@/types/game';

interface ScoreCardProps {
  score: PlayerScore;
  name: string;
  isActive: boolean;
  isWinner: boolean;
}

export function ScoreCard({ score, name, isActive, isWinner }: ScoreCardProps) {
  const isRed = score.player === 1;

  return (
    <motion.div
      animate={isWinner ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 1, repeat: isWinner ? Infinity : 0 }}
      className={clsx(
        'rounded-3xl p-5 border-2 transition-all duration-300',
        isActive
          ? isRed
            ? 'bg-red-50 border-red-200 shadow-[0_0_0_3px_rgba(192,57,43,0.15)]'
            : 'bg-slate-50 border-slate-300 shadow-[0_0_0_3px_rgba(44,62,80,0.15)]'
          : 'bg-white border-stone-100',
        isWinner && 'ring-2 ring-yellow-400 ring-offset-2'
      )}
    >
      {/* Player info */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{
            background: isRed
              ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
              : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
            boxShadow: isRed ? '0 3px 10px rgba(192,57,43,0.4)' : '0 3px 10px rgba(44,62,80,0.4)',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-stone-800 truncate text-sm">{name}</div>
          <div className={clsx('text-xs font-medium', isRed ? 'text-red-500' : 'text-slate-500')}>
            {isRed ? 'Red Pieces' : 'Dark Pieces'}
          </div>
        </div>
        {isWinner && (
          <span className="text-lg">🏆</span>
        )}
        {isActive && !isWinner && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={clsx(
              'w-2.5 h-2.5 rounded-full',
              isRed ? 'bg-red-500' : 'bg-slate-700'
            )}
          />
        )}
      </div>

      {/* Total score */}
      <div className="mb-4">
        <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Score</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={score.total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              'text-4xl font-bold tabular-nums',
              isRed ? 'text-red-600' : 'text-slate-800'
            )}
          >
            {score.total}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Line breakdown */}
      {Object.keys(SCORE_TABLE).length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">Lines</div>
          {Object.entries(SCORE_TABLE).map(([len, pts]) => {
            const count = score.breakdown[Number(len)] ?? 0;
            return (
              <div key={len} className="flex items-center justify-between text-xs">
                <span className="text-stone-500">{len}-in-a-row</span>
                <div className="flex items-center gap-2">
                  <span className={clsx('font-semibold', count > 0 ? (isRed ? 'text-red-600' : 'text-slate-700') : 'text-stone-300')}>
                    ×{count}
                  </span>
                  <span className="text-stone-300">= {pts * count} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
