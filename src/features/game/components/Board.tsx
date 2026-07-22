import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { Board as BoardType, Player, ScoredLine, Move } from '@/types/game';
import { BOARD_SIZE } from '@/types/game';
import { findLines } from '@/engine/scoring';

interface BoardProps {
  board: BoardType;
  currentPlayer: Player;
  onCellClick: (row: number, col: number) => void;
  winningLines?: ScoredLine[];
  lastMove: Move | null;
  disabled?: boolean;
  isAIThinking?: boolean;
}

interface CellLineInfo {
  line: ScoredLine;
  isCenter: boolean;
}

export function Board({
  board,
  currentPlayer,
  onCellClick,
  winningLines = [],
  lastMove,
  disabled = false,
  isAIThinking = false,
}: BoardProps) {
  const isEmpty = (row: number, col: number) => board[row][col] === 0;
  const canPlace = (row: number, col: number) => isEmpty(row, col) && !disabled && !isAIThinking;

  // ─── Calculate all live mapped/joined lines ─────────────────
  const allActiveLines = useMemo(() => {
    const p1Lines = findLines(board, 1);
    const p2Lines = findLines(board, 2);
    // Combine with winningLines (avoiding duplicates)
    const set = new Map<string, ScoredLine>();
    [...p1Lines, ...p2Lines, ...winningLines].forEach(l => {
      const key = l.cells.map(c => `${c.row},${c.col}`).join('|');
      set.set(key, l);
    });
    return Array.from(set.values());
  }, [board, winningLines]);

  // Helper to check if cell is part of any line & if it's the center cell
  const getCellLineInfo = (row: number, col: number): CellLineInfo | null => {
    for (const line of allActiveLines) {
      const idx = line.cells.findIndex(c => c.row === row && c.col === col);
      if (idx !== -1) {
        const midIdx = Math.floor(line.cells.length / 2);
        return {
          line,
          isCenter: idx === midIdx,
        };
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Board outer wood container */}
      <div
        className="relative p-4 rounded-3xl shadow-[0_16px_64px_rgba(126,82,48,0.3),_0_4px_16px_rgba(126,82,48,0.15)]"
        style={{
          background: 'linear-gradient(135deg, #a0693a 0%, #c8924a 30%, #b07840 60%, #8a5828 100%)',
        }}
      >
        {/* Inner wood border */}
        <div
          className="p-3 rounded-2xl"
          style={{
            background: 'linear-gradient(160deg, #b8894a 0%, #d4a460 50%, #a07038 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Grid */}
          <div
            className="grid gap-1.5 p-2 rounded-xl relative"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              background: 'rgba(0,0,0,0.08)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            {Array.from({ length: BOARD_SIZE }, (_, row) =>
              Array.from({ length: BOARD_SIZE }, (_, col) => {
                const val = board[row][col];
                const lineInfo = getCellLineInfo(row, col);
                const isLineCell = lineInfo !== null;
                const linePlayer = lineInfo?.line.player;
                const isLast = lastMove?.row === row && lastMove?.col === col;
                const canClick = canPlace(row, col);

                return (
                  <motion.div
                    key={`${row}-${col}`}
                    onClick={() => canClick && onCellClick(row, col)}
                    whileHover={canClick ? { scale: 1.08, brightness: 1.1 } : undefined}
                    whileTap={canClick ? { scale: 0.95 } : undefined}
                    className={clsx(
                      'relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center',
                      'transition-all duration-150',
                      canClick && 'cursor-pointer',
                      !canClick && val === 0 && 'cursor-not-allowed',
                    )}
                    style={{
                      background: isLineCell
                        ? linePlayer === 1
                          ? 'rgba(231,76,60,0.28)'
                          : 'rgba(44,62,80,0.35)'
                        : 'rgba(200,146,74,0.6)',
                      boxShadow: isLineCell
                        ? linePlayer === 1
                          ? '0 0 12px rgba(231,76,60,0.5), inset 0 0 6px rgba(231,76,60,0.4)'
                          : '0 0 12px rgba(44,62,80,0.6), inset 0 0 6px rgba(44,62,80,0.4)'
                        : canClick
                        ? `inset 0 1px 3px rgba(255,255,255,0.25), inset 0 -1px 3px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.12)`
                        : 'inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Hover preview */}
                    {canClick && (
                      <div
                        className="absolute inset-2 rounded-full opacity-0 hover:opacity-30 transition-opacity duration-150"
                        style={{
                          background: currentPlayer === 1
                            ? 'radial-gradient(circle, #e74c3c, #c0392b)'
                            : 'radial-gradient(circle, #5d6d7e, #2c3e50)',
                        }}
                      />
                    )}

                    {/* Piece */}
                    <AnimatePresence>
                      {val !== 0 && (
                        <motion.div
                          initial={{ scale: 0, rotate: -15 }}
                          animate={{
                            scale: isLineCell ? [1, 1.1, 1] : 1,
                            rotate: 0,
                          }}
                          transition={{
                            scale: { duration: 0.35, type: 'spring', stiffness: 400, damping: 20 },
                            rotate: { duration: 0.35, type: 'spring' },
                          }}
                          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full relative"
                          style={{
                            background: val === 1
                              ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b 60%, #922b21 100%)'
                              : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50 60%, #1a252f 100%)',
                            boxShadow: val === 1
                              ? '0 4px 12px rgba(192,57,43,0.5), inset 0 1px 2px rgba(255,255,255,0.35)'
                              : '0 4px 12px rgba(44,62,80,0.5), inset 0 1px 2px rgba(255,255,255,0.2)',
                          }}
                        >
                          {/* Shine spot */}
                          <div
                            className="absolute top-1 left-1.5 w-2.5 h-2.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.35)', filter: 'blur(1px)' }}
                          />

                          {/* Last move ring */}
                          {isLast && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -inset-1 rounded-full border-2 border-yellow-400"
                              style={{ boxShadow: '0 0 8px rgba(212,175,55,0.6)' }}
                            />
                          )}

                          {/* Mapped Line Ring Highlight on piece */}
                          {isLineCell && (
                            <motion.div
                              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="absolute -inset-1 rounded-full border-2"
                              style={{
                                borderColor: linePlayer === 1 ? '#f39c12' : '#00b4d8',
                                boxShadow: linePlayer === 1
                                  ? '0 0 10px rgba(243,156,18,0.8)'
                                  : '0 0 10px rgba(0,180,216,0.8)',
                              }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Score Badge overlay on line center */}
                    {lineInfo?.isCenter && (
                      <motion.div
                        initial={{ scale: 0, y: -5 }}
                        animate={{ scale: 1, y: 0 }}
                        className="absolute -top-2.5 z-10 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-md border"
                        style={{
                          background: linePlayer === 1
                            ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
                            : 'linear-gradient(135deg, #34495e, #1a252f)',
                          color: '#ffffff',
                          borderColor: linePlayer === 1 ? '#f39c12' : '#00b4d8',
                        }}
                      >
                        +{lineInfo.line.score}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row/Col labels */}
      <div className="mt-3 flex gap-1">
        {Array.from({ length: BOARD_SIZE }, (_, col) => (
          <div key={col} className="w-10 sm:w-11 md:w-12 text-center text-xs font-medium text-stone-400">
            {String.fromCharCode(65 + col)}
          </div>
        ))}
      </div>
    </div>
  );
}
