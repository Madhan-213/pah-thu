import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Move } from '@/types/game';

interface MoveHistoryProps {
  moves: Move[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [moves]);

  function cellLabel(row: number, col: number) {
    return `${String.fromCharCode(65 + col)}${7 - row}`;
  }

  return (
    <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 h-full">
      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Move History</div>
      <div ref={ref} className="space-y-1.5 overflow-y-auto max-h-48 pr-1">
        <AnimatePresence initial={false}>
          {moves.map((move, idx) => (
            <motion.div
              key={move.moveNumber}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-6 text-xs text-stone-300 font-mono">{idx + 1}.</span>
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  background: move.player === 1
                    ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
                    : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
                  boxShadow: move.player === 1
                    ? '0 2px 6px rgba(192,57,43,0.4)'
                    : '0 2px 6px rgba(44,62,80,0.4)',
                }}
              />
              <span className="font-mono font-semibold text-stone-700">
                {cellLabel(move.row, move.col)}
              </span>
              <span className="text-xs text-stone-400 ml-auto">
                {move.player === 1 ? 'Red' : 'Dark'}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {moves.length === 0 && (
          <div className="text-xs text-stone-300 italic text-center py-4">No moves yet</div>
        )}
      </div>
    </div>
  );
}
