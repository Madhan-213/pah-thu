import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Home, Minus } from 'lucide-react';
import type { GameResult, GameConfig, Player } from '@/types/game';

interface VictoryModalProps {
  open: boolean;
  result: GameResult | null;
  config: GameConfig;
  onNewGame: () => void;
  onHome: () => void;
}

interface Confetti {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

function createConfetti(): Confetti[] {
  const colors = ['#e74c3c', '#f39c12', '#d4af37', '#27ae60', '#2980b9', '#8e44ad', '#c0392b'];
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
    duration: Math.random() * 2 + 2.5,
    delay: Math.random() * 1.5,
  }));
}

export function VictoryModal({ open, result, config, onNewGame, onHome }: VictoryModalProps) {
  const confettiRef = useRef(createConfetti());

  const isWin = result?.winner !== 'draw' && result?.winner !== null;
  const isDraw = result?.winner === 'draw';
  const winnerName = result?.winner === 1 ? config.player1Name : config.player2Name;
  const winnerPlayer = result?.winner as Player | undefined;

  const p1 = result?.scores[0];
  const p2 = result?.scores[1];

  return (
    <AnimatePresence>
      {open && result && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(30,20,10,0.55)', backdropFilter: 'blur(6px)' }}
          />

          {/* Confetti */}
          {isWin && confettiRef.current.map(c => (
            <motion.div
              key={c.id}
              className="fixed top-0 z-50 rounded-sm pointer-events-none"
              style={{
                left: `${c.x}%`,
                width: c.size,
                height: c.size * 1.5,
                background: c.color,
                transform: 'rotate(45deg)',
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', opacity: 0, rotate: 720 }}
              transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
            />
          ))}

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="w-full max-w-lg bg-white rounded-4xl overflow-hidden"
              style={{
                boxShadow: '0 30px 100px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
                borderRadius: '2rem',
              }}
            >
              {/* Header */}
              <div
                className="px-10 pt-12 pb-8 text-center"
                style={{
                  background: isWin
                    ? winnerPlayer === 1
                      ? 'linear-gradient(160deg, #fdf0ee 0%, #faf7f0 100%)'
                      : 'linear-gradient(160deg, #eef1f5 0%, #faf7f0 100%)'
                    : 'linear-gradient(160deg, #f8f7f5 0%, #faf7f0 100%)',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-7xl mb-5"
                >
                  {isWin ? '🏆' : '🤝'}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-3xl font-bold text-stone-800 mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {isDraw ? "It's a Draw!" : `${winnerName} Wins!`}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-stone-500"
                >
                  {isDraw
                    ? 'A perfectly matched game — well played by both!'
                    : `A brilliant victory on the Pah Tum board!`}
                </motion.p>
              </div>

              {/* Score comparison */}
              <div className="px-10 py-8 border-t border-stone-100">
                <div className="flex items-stretch gap-4">
                  {/* Player 1 */}
                  <ScoreBlock
                    name={config.player1Name}
                    score={p1?.total ?? 0}
                    player={1}
                    isWinner={result.winner === 1}
                  />

                  {/* VS */}
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                    <Minus size={16} className="text-stone-200" />
                    <div className="text-xs font-bold text-stone-300 uppercase tracking-wider">vs</div>
                    <Minus size={16} className="text-stone-200" />
                  </div>

                  {/* Player 2 */}
                  <ScoreBlock
                    name={config.player2Name}
                    score={p2?.total ?? 0}
                    player={2}
                    isWinner={result.winner === 2}
                  />
                </div>

                {/* Score diff */}
                {isWin && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-4 text-sm text-stone-400"
                  >
                    Won by{' '}
                    <span className="font-bold text-stone-700">
                      {Math.abs((p1?.total ?? 0) - (p2?.total ?? 0))} points
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="px-10 pb-10 flex gap-3">
                <button
                  onClick={onNewGame}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
                >
                  <RotateCcw size={18} />
                  Play Again
                </button>
                <button
                  onClick={onHome}
                  className="btn-secondary flex items-center justify-center gap-2 px-6 py-4"
                >
                  <Home size={18} />
                  Home
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ScoreBlock({ name, score, player, isWinner }: {
  name: string; score: number; player: Player; isWinner: boolean;
}) {
  const isRed = player === 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: isRed ? 0.3 : 0.4, type: 'spring' }}
      className={`flex-1 rounded-2xl p-5 text-center border-2 ${
        isWinner
          ? isRed
            ? 'bg-red-50 border-red-200'
            : 'bg-slate-50 border-slate-200'
          : 'bg-stone-50 border-stone-100'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-sm"
        style={{
          background: isRed
            ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
            : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
          boxShadow: isRed ? '0 4px 12px rgba(192,57,43,0.4)' : '0 4px 12px rgba(44,62,80,0.4)',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="text-xs text-stone-500 font-medium mb-1 truncate">{name}</div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: isRed ? 0.5 : 0.6, type: 'spring', stiffness: 400, damping: 20 }}
        className={`text-4xl font-bold ${isRed ? 'text-red-600' : 'text-slate-700'}`}
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {score}
      </motion.div>
      <div className="text-xs text-stone-400 mt-1">points</div>
      {isWinner && (
        <div className="mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 rounded-full px-2 py-0.5">
          WINNER
        </div>
      )}
    </motion.div>
  );
}
