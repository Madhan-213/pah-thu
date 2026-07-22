import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RotateCcw, Undo2, Trophy, Pause, Play,
  Flag, ChevronRight, Zap, FastForward, PlayCircle, Gauge,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Board } from '@/features/game/components/Board';
import { Timer } from '@/features/game/components/Timer';
import { ScoreCard } from '@/features/game/components/ScoreCard';
import { MoveHistory } from '@/features/game/components/MoveHistory';
import { VictoryModal } from '@/features/game/components/VictoryModal';
import { getStrategy } from '@/engine/strategies';
import { calculatePlayerScore } from '@/engine/scoring';

export function GamePage() {
  const navigate = useNavigate();
  const {
    board, currentPlayer, gamePhase, result, config,
    moves, turnTimeLeft, timeControlLimit, isAIThinking, isPaused, lastMove,
    placepiece, setTurnTimeLeft, handleTurnTimeout, onTimeout, setAIThinking,
    togglePause, resetGame, undoMove,
  } = useGameStore();

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [aiSpeed, setAiSpeed] = useState<number>(150); // Default fast AI speed (150ms) for snappy play

  // ─── Redirect if no active game ──────────────────────────────
  useEffect(() => {
    if (gamePhase === 'setup') navigate('/game');
  }, [gamePhase, navigate]);

  // ─── AI Move Logic ────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing' || isPaused) return;

    const isAITurn =
      (currentPlayer === 1 && config.mode === 'ai-vs-ai') ||
      (currentPlayer === 2 && (config.mode === 'human-vs-ai' || config.mode === 'ai-vs-ai'));

    if (!isAITurn) return;

    let cancelled = false;
    setAIThinking(true);

    // Calculate smart delay so AI moves promptly within shot clock
    let delay = config.mode === 'ai-vs-ai' ? aiSpeed : 450;
    if (turnTimeLeft !== null && turnTimeLeft <= 5) {
      delay = 40; // Fast move under low turn clock
    }

    const timer = setTimeout(() => {
      if (cancelled) return;

      const fresh = useGameStore.getState();

      if (fresh.gamePhase !== 'playing' || fresh.isPaused) {
        setAIThinking(false);
        return;
      }

      const activePlayer = fresh.currentPlayer;
      const level = activePlayer === 1
        ? fresh.config.aiLevel1
        : fresh.config.aiLevel2;

      const strategy = getStrategy(level);

      try {
        const move = strategy.makeMove(fresh.board, activePlayer);
        useGameStore.getState().placepiece(move.row, move.col, true);
      } catch (err) {
        console.error('[Pah Tum] AI strategy error:', err);
      }

      if (!cancelled) setAIThinking(false);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      useGameStore.getState().setAIThinking(false);
    };
  }, [currentPlayer, gamePhase, isPaused, config.mode, config.aiLevel1, config.aiLevel2, aiSpeed, turnTimeLeft]);

  // ─── Human Cell Click ─────────────────────────────────────────
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gamePhase !== 'playing' || isAIThinking || isPaused) return;

    const isHumanTurn =
      config.mode === 'human-vs-human' ||
      config.mode === 'practice' ||
      (config.mode === 'human-vs-ai' && currentPlayer === 1);

    if (!isHumanTurn) return;
    placepiece(row, col, false);
  }, [gamePhase, isAIThinking, isPaused, config.mode, currentPlayer, placepiece]);

  // ─── Restart (with confirmation) ──────────────────────────────
  const handleRestartConfirm = () => {
    setShowRestartConfirm(false);
    setShowResignConfirm(false);
    useGameStore.getState().initGame(useGameStore.getState().config);
  };

  // ─── Resign ───────────────────────────────────────────────────
  const handleResignConfirm = () => {
    setShowResignConfirm(false);
    if (config.mode === 'human-vs-human') {
      useGameStore.getState().onTimeout(currentPlayer);
    } else if (config.mode === 'human-vs-ai' || config.mode === 'practice') {
      useGameStore.getState().onTimeout(1);
    }
  };

  // ─── Undo ─────────────────────────────────────────────────────
  const handleUndo = () => {
    if (config.mode !== 'practice') return;
    undoMove();
  };

  const p1Score = calculatePlayerScore(board, 1);
  const p2Score = calculatePlayerScore(board, 2);
  const winningLines = result?.winningLines ?? [];
  const isFinished = gamePhase === 'finished';
  const canUndo = config.mode === 'practice' && moves.length > 0 && !isFinished;
  const isHumanMode = config.mode === 'human-vs-human' || config.mode === 'human-vs-ai';
  const canResign = isHumanMode && !isFinished;
  const isAIvAI = config.mode === 'ai-vs-ai';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)' }}
    >
      {/* ─── TOP BAR ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b border-[#e8ddd0]/60"
        style={{ background: 'rgba(253,252,248,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Left: back + brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { resetGame(); navigate('/game'); }}
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium shrink-0"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">New Game</span>
            </button>
            <div className="w-px h-4 bg-stone-200 shrink-0" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md wood-border flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">PT</span>
              </div>
              <span className="font-bold text-stone-700 text-sm hidden md:inline" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pah Tum
              </span>
            </div>
          </div>

          {/* Center: mode + move counter */}
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-stone-500 bg-[#f0e6d3] px-3 py-1.5 rounded-full border border-[#d4b896] hidden sm:block">
              {config.mode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-xs font-mono text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
              {moves.length}/49
            </div>
            {isPaused && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full animate-pulse">
                PAUSED
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Pause / Resume */}
            {!isFinished && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePause}
                title={isPaused ? 'Resume game' : 'Pause game'}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                  transition-all duration-200 border
                  ${isPaused
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }
                `}
              >
                {isPaused
                  ? <><Play size={13} fill="currentColor" />Resume</>
                  : <><Pause size={13} /><span className="hidden sm:inline">Pause</span></>
                }
              </motion.button>
            )}

            {/* Undo — practice only */}
            {canUndo && (
              <button
                onClick={handleUndo}
                title="Undo last move"
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors border border-stone-200"
              >
                <Undo2 size={15} />
              </button>
            )}

            {/* Restart */}
            {!isFinished && (
              <button
                onClick={() => setShowRestartConfirm(true)}
                title="Restart game"
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors border border-stone-200"
              >
                <RotateCcw size={15} />
              </button>
            )}

            {/* Resign — human modes only */}
            {canResign && (
              <button
                onClick={() => setShowResignConfirm(true)}
                title="Resign / Forfeit"
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors border border-red-100"
              >
                <Flag size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN GAME ────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="flex flex-col xl:flex-row gap-5 items-start justify-center">

          {/* Left — Player 1 */}
          <div className="w-full xl:w-72 space-y-3">
            <ScoreCard
              score={p1Score}
              name={config.player1Name}
              isActive={currentPlayer === 1 && gamePhase === 'playing' && !isPaused}
              isWinner={result?.winner === 1}
            />
            {turnTimeLeft !== null && (
              <Timer
                seconds={turnTimeLeft}
                totalLimit={timeControlLimit}
                isActive={currentPlayer === 1 && gamePhase === 'playing' && !isPaused}
                player={1}
                onTimeout={handleTurnTimeout}
                onTick={s => setTurnTimeLeft(s)}
              />
            )}
            <MoveHistory moves={moves.filter(m => m.player === 1)} />
          </div>

          {/* Center — Board & Controls */}
          <div className="flex flex-col items-center gap-4">

            {/* AI Speed Controls for AI vs AI mode */}
            {isAIvAI && !isFinished && (
              <div className="flex items-center gap-2 bg-white/90 border border-[#e8ddd0] px-4 py-2 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mr-1">
                  <Gauge size={14} />
                  <span>AI Speed:</span>
                </div>
                {[
                  { speed: 40, label: '⚡ Ultra', icon: <Zap size={12} /> },
                  { speed: 150, label: '🚀 Fast', icon: <FastForward size={12} /> },
                  { speed: 450, label: '▶ Normal', icon: <PlayCircle size={12} /> },
                ].map(item => (
                  <button
                    key={item.speed}
                    onClick={() => setAiSpeed(item.speed)}
                    className={`
                      px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all
                      ${aiSpeed === item.speed
                        ? 'bg-[#7d5230] text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Turn / Status indicator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentPlayer}-${isPaused ? 'paused' : isAIThinking ? 'thinking' : 'idle'}-${gamePhase}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={`
                  flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm
                  ${isPaused
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white/80 border-[#e8ddd0]'
                  }
                `}
              >
                {isFinished ? (
                  <>
                    <Trophy size={17} className="text-yellow-500" />
                    <span className="text-sm font-bold text-stone-800">
                      {result?.winner === 'draw'
                        ? "It's a Draw!"
                        : `${result?.winner === 1 ? config.player1Name : config.player2Name} Wins!`}
                    </span>
                  </>
                ) : isPaused ? (
                  <>
                    <Pause size={16} className="text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">Game Paused</span>
                    <button
                      onClick={togglePause}
                      className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full ml-1 hover:bg-green-100 transition-colors"
                    >
                      Resume →
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{
                        background: currentPlayer === 1
                          ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
                          : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
                      }}
                    />
                    <span className="text-sm font-semibold text-stone-700">
                      {isAIThinking
                        ? `${currentPlayer === 1 ? config.player1Name : config.player2Name} thinking…`
                        : `${currentPlayer === 1 ? config.player1Name : config.player2Name}'s turn`}
                    </span>
                    {isAIThinking && (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-stone-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Board */}
            <Board
              board={board}
              currentPlayer={currentPlayer}
              onCellClick={handleCellClick}
              winningLines={winningLines}
              lastMove={lastMove}
              disabled={isFinished || isPaused}
              isAIThinking={isAIThinking && !isPaused}
            />

            {/* Progress bar */}
            <div className="w-full max-w-sm space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>{moves.length} placed</span>
                <span>{49 - moves.length} empty</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7d5230, #c8924a)' }}
                  animate={{ width: `${(moves.length / 49) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Post-game buttons */}
            <AnimatePresence>
              {isFinished && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 flex-wrap justify-center"
                >
                  <button
                    onClick={handleRestartConfirm}
                    className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
                  >
                    <RotateCcw size={15} />
                    Play Again
                  </button>
                  <button
                    onClick={() => { resetGame(); navigate('/game'); }}
                    className="btn-secondary flex items-center gap-2 text-sm px-5 py-3"
                  >
                    <ChevronRight size={15} />
                    New Setup
                  </button>
                  <button
                    onClick={() => { resetGame(); navigate('/'); }}
                    className="btn-secondary flex items-center gap-2 text-sm px-5 py-3"
                  >
                    <ArrowLeft size={15} />
                    Home
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Player 2 */}
          <div className="w-full xl:w-72 space-y-3">
            <ScoreCard
              score={p2Score}
              name={config.player2Name}
              isActive={currentPlayer === 2 && gamePhase === 'playing' && !isPaused}
              isWinner={result?.winner === 2}
            />
            {turnTimeLeft !== null && (
              <Timer
                seconds={turnTimeLeft}
                totalLimit={timeControlLimit}
                isActive={currentPlayer === 2 && gamePhase === 'playing' && !isPaused}
                player={2}
                onTimeout={handleTurnTimeout}
                onTick={s => setTurnTimeLeft(s)}
              />
            )}
            <MoveHistory moves={moves.filter(m => m.player === 2)} />

            {/* Combined move log */}
            <div className="card p-4 hidden xl:block">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  All Moves
                </div>
                <span className="text-xs text-stone-400 font-mono bg-stone-50 px-2 py-0.5 rounded-full">
                  {moves.length}/49
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {moves.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-stone-300 font-mono text-right shrink-0">{idx + 1}.</span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: m.player === 1
                          ? 'radial-gradient(circle, #e74c3c, #c0392b)'
                          : 'radial-gradient(circle, #5d6d7e, #2c3e50)',
                      }}
                    />
                    <span className="font-mono font-semibold text-stone-700">
                      {String.fromCharCode(65 + m.col)}{7 - m.row}
                    </span>
                    <span className="text-stone-400 ml-auto">{m.player === 1 ? 'Red' : 'Dark'}</span>
                  </div>
                ))}
                {moves.length === 0 && (
                  <div className="text-stone-300 text-xs italic text-center py-3">No moves yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── PAUSE OVERLAY ────────────────────────────── */}
      <AnimatePresence>
        {isPaused && !isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(30,20,10,0.45)', backdropFilter: 'blur(8px)' }}
            onClick={togglePause}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-10 shadow-2xl border border-stone-100 text-center max-w-sm w-full mx-4"
            >
              <div className="text-5xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Game Paused
              </h2>
              <p className="text-stone-500 mb-8 text-sm">
                Timers and AI moves are frozen. Resume when ready.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={togglePause}
                  className="btn-primary flex items-center justify-center gap-2 py-4 text-base"
                >
                  <Play size={18} fill="white" />
                  Resume Game
                </button>
                <button
                  onClick={() => { setShowRestartConfirm(true); }}
                  className="btn-secondary flex items-center justify-center gap-2 py-3"
                >
                  <RotateCcw size={16} />
                  Restart Game
                </button>
                <button
                  onClick={() => { resetGame(); navigate('/game'); }}
                  className="btn-secondary flex items-center justify-center gap-2 py-3 text-stone-500"
                >
                  <ArrowLeft size={16} />
                  New Game Setup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── RESTART CONFIRM DIALOG ───────────────────── */}
      <AnimatePresence>
        {showRestartConfirm && (
          <ConfirmDialog
            icon="🔄"
            title="Restart Game?"
            message="This will reset the board and start the game again from scratch."
            confirmLabel="Yes, Restart"
            confirmColor="primary"
            onConfirm={handleRestartConfirm}
            onCancel={() => setShowRestartConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── RESIGN CONFIRM DIALOG ────────────────────── */}
      <AnimatePresence>
        {showResignConfirm && (
          <ConfirmDialog
            icon="🏳️"
            title="Resign?"
            message={`You will forfeit this game and ${config.player2Name} will be declared the winner.`}
            confirmLabel="Yes, Resign"
            confirmColor="danger"
            onConfirm={handleResignConfirm}
            onCancel={() => setShowResignConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── VICTORY MODAL ────────────────────────────── */}
      <VictoryModal
        open={isFinished}
        result={result}
        config={config}
        onNewGame={handleRestartConfirm}
        onHome={() => { resetGame(); navigate('/'); }}
      />
    </div>
  );
}

// ─── Reusable Confirm Dialog ──────────────────────────────────
function ConfirmDialog({
  icon, title, message, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  icon: string;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-stone-100 max-w-sm w-full text-center"
        >
          <div className="text-4xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {title}
          </h3>
          <p className="text-stone-500 text-sm mb-7 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-2xl font-semibold text-white transition-all ${
                confirmColor === 'danger'
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_16px_rgba(220,38,38,0.35)] hover:shadow-[0_8px_24px_rgba(220,38,38,0.45)]'
                  : 'btn-primary'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
