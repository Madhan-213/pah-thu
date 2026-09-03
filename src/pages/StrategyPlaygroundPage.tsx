// ============================================================
// Strategy Playground Page (#12, #15, #16, #17)
// Interactive environment to develop, debug, and test AI strategies.
// ============================================================

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, SkipBack, SkipForward, Zap, ChevronRight,
  ChevronLeft, Cpu, Upload, FlaskConical, Brain, BookOpen, CheckCircle,
  XCircle, AlertCircle, Clock, Target, TrendingUp, Shield, Swords,
  Layers, Activity, Info, FastForward,
} from 'lucide-react';
import { usePlaygroundStore } from '@/store/playgroundStore';
import { Board } from '@/features/game/components/Board';
import { executeStrategy } from '@/engine/ai/strategyEngine';
import { getLastAIDebugInfo } from '@/engine/ai/strategyEngine';
import { AI_LEVEL_LABELS, type AILevel } from '@/types/game';
import type { PlaygroundMode, MoveInspection } from '@/types/playground';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { validateStrategy, saveCustomStrategy, getCustomStrategies, executeSandboxedStrategy } from '@/services/sandboxService';
import { generateCoachReport } from '@/engine/ai/coachEngine';
import { analyzeOpenings } from '@/engine/ai/openingExplorer';
import { getGameHistory } from '@/services/gameHistoryService';
import { PageHeader } from '@/components/ui/PageHeader';

type PlaygroundTab = 'playground' | 'sandbox' | 'coach' | 'openings';

const MODES: Array<{ value: PlaygroundMode; label: string; desc: string; icon: React.ReactNode }> = [
  { value: 'builtin-vs-builtin', label: 'Built-in vs Built-in', desc: 'Watch two built-in AIs compete', icon: <Cpu size={14} /> },
  { value: 'human-vs-custom', label: 'Human vs Custom AI', desc: 'Play against your uploaded strategy', icon: <Swords size={14} /> },
  { value: 'custom-vs-builtin', label: 'Custom vs Built-in', desc: 'Test custom AI against built-in', icon: <FlaskConical size={14} /> },
  { value: 'custom-vs-custom', label: 'Custom vs Custom', desc: 'Two custom AIs compete', icon: <Brain size={14} /> },
];

const AI_LEVELS = Object.entries(AI_LEVEL_LABELS) as Array<[AILevel, { label: string; description: string; color: string }]>;

const THREAT_COLORS: Record<MoveInspection['opponentThreatLevel'], string> = {
  low: '#27ae60',
  medium: '#e67e22',
  high: '#e74c3c',
  critical: '#8e44ad',
};

export function StrategyPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('playground');
  const {
    config, board, currentPlayer, moves, gamePhase, result, selectedMoveIndex, isAIThinking,
    configure, startGame, placeMove, selectMove, stepForward, stepBack, jumpToMove,
    pause, resume, restart, setAIThinking, getBoardAtStep,
  } = usePlaygroundStore();

  const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Sandbox state
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxName, setSandboxName] = useState('My Strategy');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<Awaited<ReturnType<typeof validateStrategy>> | null>(null);
  const [savedStrategies, setSavedStrategies] = useState(getCustomStrategies);

  // Coach state
  const [coachReport, setCoachReport] = useState<ReturnType<typeof generateCoachReport> | null>(null);
  const [coachGame, setCoachGame] = useState<ReturnType<typeof getGameHistory>[0] | null>(null);

  // Openings state
  const [openingStats, setOpeningStats] = useState<ReturnType<typeof analyzeOpenings> | null>(null);
  const [openingFilter, setOpeningFilter] = useState<AILevel | 'all'>('all');

  // Board to display (step-mode uses getBoardAtStep)
  const displayBoard = useMemo(() => {
    if (config.isStepMode && moves.length > 0) {
      return getBoardAtStep(usePlaygroundStore.getState().stepIndex);
    }
    return board;
  }, [board, moves, config.isStepMode]);

  const selectedMove = selectedMoveIndex !== null ? moves[selectedMoveIndex] : null;
  const lastMove = moves.length > 0 ? moves[moves.length - 1].move : null;

  // ─── AI auto-play logic ──────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing' || isAutoPlaying) return;
    if (config.isStepMode) return;

    const isAITurn = config.mode === 'builtin-vs-builtin' ||
      (config.mode === 'custom-vs-builtin') ||
      (config.mode === 'custom-vs-custom');

    if (!isAITurn) return;
    if (isAIThinking) return;

    let cancelled = false;
    setAIThinking(true);

    const timer = setTimeout(() => {
      if (cancelled) return;
      const { board: freshBoard, currentPlayer: cp, gamePhase: gp } = usePlaygroundStore.getState();
      if (gp !== 'playing') { setAIThinking(false); return; }

      const level = cp === 1 ? config.aiLevel1 : config.aiLevel2;
      const start = performance.now();
      let move: { row: number; col: number };
      let reason = '';
      let strategyName = AI_LEVEL_LABELS[level]?.label ?? level;

      try {
        move = executeStrategy(level, freshBoard, cp);
        const debug = getLastAIDebugInfo();
        reason = debug?.reason ?? '';
      } catch {
        // Fallback to first empty cell
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (freshBoard[r][c] === 0) { move = { row: r, col: c }; break; }
          }
          if (move!) break;
        }
        reason = 'Fallback move';
      }

      const thinkMs = performance.now() - start;
      usePlaygroundStore.getState().placeMove(move!.row, move!.col, strategyName, thinkMs, reason);
      if (!cancelled) setAIThinking(false);
    }, config.autoPlaySpeed);

    return () => { cancelled = true; clearTimeout(timer); setAIThinking(false); };
  }, [currentPlayer, gamePhase, config, isAutoPlaying]);

  // ─── Human cell click ────────────────────────────────────────
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gamePhase !== 'playing' || isAIThinking) return;
    if (config.mode === 'human-vs-custom') {
      if (currentPlayer === 1) {
        placeMove(row, col, 'Human', 0, 'Human placed piece');
      }
    }
  }, [gamePhase, isAIThinking, config.mode, currentPlayer]);

  // ─── Auto-play toggle ─────────────────────────────────────────
  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      setAutoPlayTimer(null);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
    }
  };

  // ─── Sandbox validate ─────────────────────────────────────────
  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    const report = await validateStrategy(sandboxCode, sandboxName);
    setValidationResult(report);
    setValidating(false);
    if (report.overallStatus !== 'failed') {
      const strategy = {
        id: report.strategyId,
        name: sandboxName,
        code: sandboxCode,
        isValid: report.overallStatus === 'passed',
        validationReport: report,
        createdAt: Date.now(),
      };
      saveCustomStrategy(strategy);
      setSavedStrategies(getCustomStrategies());
    }
  };

  // ─── Coach analysis ───────────────────────────────────────────
  const handleAnalyzeGame = (gameIdx: number) => {
    const games = getGameHistory();
    const game = games[gameIdx];
    if (!game) return;
    setCoachGame(game);
    const report = generateCoachReport(game.id, game.moves, game.config.player1Name, game.config.player2Name);
    setCoachReport(report);
  };

  // ─── Opening Explorer ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'openings') {
      const games = getGameHistory();
      setOpeningStats(analyzeOpenings(games));
    }
  }, [activeTab]);

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Strategy Playground"
        subtitle="Develop, debug & test AI strategies safely"
        icon="🧪"
        backTo="/"
        backLabel="Home"
      />

      {/* ─── TAB BAR ─────────────────────────────────────────── */}
      <div className="border-b border-[#e8ddd0] bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0">
            {(
              [
                { id: 'playground', label: 'Playground', icon: <Cpu size={14} /> },
                { id: 'sandbox', label: 'Sandbox & Validator', icon: <FlaskConical size={14} /> },
                { id: 'coach', label: 'AI Coach', icon: <Brain size={14} /> },
                { id: 'openings', label: 'Opening Explorer', icon: <BookOpen size={14} /> },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#7d5230] text-[#7d5230]'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <AnimatePresence mode="wait">

          {/* ═══════════════════ PLAYGROUND TAB ═══════════════ */}
          {activeTab === 'playground' && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-5"
            >
              {/* LEFT: Config Panel */}
              <div className="space-y-4">
                <div className="card p-4">
                  <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-[#7d5230]" />
                    Game Mode
                  </h3>
                  <div className="space-y-2">
                    {MODES.map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => configure({ mode: mode.value })}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-xs ${
                          config.mode === mode.value
                            ? 'bg-[#7d5230] text-white border-[#7d5230]'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">{mode.icon} {mode.label}</div>
                        <div className={`mt-0.5 ${config.mode === mode.value ? 'text-white/70' : 'text-stone-400'}`}>{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategy Selectors */}
                <div className="card p-4 space-y-3">
                  <h3 className="font-bold text-stone-700 text-sm flex items-center gap-2">
                    <Cpu size={14} className="text-[#7d5230]" /> Strategies
                  </h3>

                  {(['builtin-vs-builtin', 'custom-vs-builtin', 'human-vs-custom'].includes(config.mode) ||
                    config.mode === 'builtin-vs-builtin') && (
                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">
                        {config.mode === 'human-vs-custom' ? 'Your Custom AI (P2)' : 'Player 1 Strategy'}
                      </label>
                      {config.mode !== 'human-vs-custom' && (
                        <select
                          value={config.aiLevel1}
                          onChange={e => configure({ aiLevel1: e.target.value as AILevel })}
                          className="w-full text-xs rounded-lg border border-stone-200 px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:border-[#7d5230]"
                        >
                          {AI_LEVELS.map(([level, info]) => (
                            <option key={level} value={level}>{info.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-stone-500 block mb-1">
                      {config.mode === 'human-vs-custom' ? 'Your Custom AI (P1)' : 'Player 2 Strategy'}
                    </label>
                    <select
                      value={config.aiLevel2}
                      onChange={e => configure({ aiLevel2: e.target.value as AILevel })}
                      className="w-full text-xs rounded-lg border border-stone-200 px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:border-[#7d5230]"
                    >
                      {AI_LEVELS.map(([level, info]) => (
                        <option key={level} value={level}>{info.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step Mode + Speed */}
                <div className="card p-4 space-y-3">
                  <h3 className="font-bold text-stone-700 text-sm flex items-center gap-2">
                    <Activity size={14} className="text-[#7d5230]" /> Playback
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isStepMode}
                      onChange={e => configure({ isStepMode: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs font-semibold text-stone-600">Step-by-Step Mode</span>
                  </label>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 block mb-1">Auto-Play Speed</label>
                    <div className="flex gap-1.5">
                      {[
                        { speed: 150, label: '⚡ Fast' },
                        { speed: 600, label: '▶ Normal' },
                        { speed: 1200, label: '🐌 Slow' },
                      ].map(s => (
                        <button
                          key={s.speed}
                          onClick={() => configure({ autoPlaySpeed: s.speed })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            config.autoPlaySpeed === s.speed
                              ? 'bg-[#7d5230] text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Start / Controls */}
                <div className="space-y-2">
                  {gamePhase === 'idle' ? (
                    <button onClick={startGame} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                      <Play size={15} fill="white" /> Start Game
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={restart} className="btn-secondary flex items-center justify-center gap-1.5 py-2.5 text-sm">
                        <RotateCcw size={14} /> Restart
                      </button>
                      {gamePhase === 'playing' ? (
                        <button onClick={pause} className="btn-secondary flex items-center justify-center gap-1.5 py-2.5 text-sm">
                          <Pause size={14} /> Pause
                        </button>
                      ) : gamePhase === 'paused' ? (
                        <button onClick={resume} className="btn-primary flex items-center justify-center gap-1.5 py-2.5 text-sm">
                          <Play size={14} fill="white" /> Resume
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER: Board + Controls */}
              <div className="flex flex-col items-center gap-4">
                {/* Status indicator */}
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-[#e8ddd0] shadow-sm">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{
                      background: currentPlayer === 1
                        ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
                        : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
                    }}
                  />
                  <span className="text-sm font-semibold text-stone-700">
                    {gamePhase === 'idle' ? 'Configure & Start'
                      : gamePhase === 'finished' ? (result?.winner === 'draw' ? "Draw!" : `Player ${result?.winner} Wins!`)
                      : gamePhase === 'paused' ? 'Paused'
                      : isAIThinking ? `Player ${currentPlayer} thinking…`
                      : `Player ${currentPlayer}'s turn`}
                  </span>
                  <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded-full">
                    {moves.length}/49
                  </span>
                </div>

                {/* Board */}
                <Board
                  board={displayBoard}
                  currentPlayer={currentPlayer}
                  onCellClick={handleCellClick}
                  winningLines={result?.winningLines ?? []}
                  lastMove={lastMove}
                  disabled={gamePhase !== 'playing' || isAIThinking}
                  isAIThinking={isAIThinking}
                />

                {/* Playback Controls */}
                <div className="flex items-center gap-2 bg-white/90 border border-[#e8ddd0] px-4 py-2.5 rounded-2xl shadow-sm">
                  <button
                    onClick={() => jumpToMove(0)}
                    disabled={moves.length === 0}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30 transition-colors"
                    title="Jump to start"
                  >
                    <SkipBack size={16} />
                  </button>
                  <button
                    onClick={stepBack}
                    disabled={moves.length === 0}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30 transition-colors"
                    title="Previous move"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Auto-play / Pause */}
                  {gamePhase !== 'finished' ? (
                    config.isStepMode ? (
                      <button
                        onClick={stepForward}
                        disabled={gamePhase !== 'playing'}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7d5230] text-white text-sm font-semibold disabled:opacity-40"
                      >
                        <ChevronRight size={14} /> Step
                      </button>
                    ) : (
                      <button
                        onClick={gamePhase === 'playing' ? pause : resume}
                        disabled={gamePhase === 'idle' || gamePhase === 'finished'}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
                          gamePhase === 'playing' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}
                      >
                        {gamePhase === 'playing' ? <Pause size={14} /> : <Play size={14} fill="white" />}
                        {gamePhase === 'playing' ? 'Pause' : 'Resume'}
                      </button>
                    )
                  ) : (
                    <button onClick={restart} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7d5230] text-white text-sm font-semibold">
                      <RotateCcw size={14} /> Restart
                    </button>
                  )}

                  <button
                    onClick={stepForward}
                    disabled={moves.length === 0}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30 transition-colors"
                    title="Next move"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => jumpToMove(moves.length)}
                    disabled={moves.length === 0}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30 transition-colors"
                    title="Jump to latest"
                  >
                    <FastForward size={16} />
                  </button>
                </div>

                {/* Move Timeline */}
                {moves.length > 0 && (
                  <div className="w-full max-w-lg">
                    <div className="text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wider">Move Timeline</div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {moves.map((record, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectMove(selectedMoveIndex === idx ? null : idx)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                            selectedMoveIndex === idx
                              ? 'bg-[#7d5230] text-white border-[#7d5230]'
                              : record.move.player === 1
                              ? 'bg-red-50 text-red-700 border-red-200 hover:border-red-400'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {idx + 1}. {record.inspection.chosenCell}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Move Inspector */}
              <div className="space-y-4">
                {selectedMove ? (
                  <MoveInspectorPanel inspection={selectedMove.inspection} />
                ) : (
                  <div className="card p-5 text-center">
                    <Target size={32} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm font-semibold text-stone-500">Move Inspector</p>
                    <p className="text-xs text-stone-400 mt-1">Click a move in the timeline to inspect it</p>
                  </div>
                )}

                {/* Score panel */}
                {moves.length > 0 && (
                  <div className="card p-4">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Live Scores</h4>
                    {[1, 2].map(p => {
                      const score = moves.filter(m => m.move.player === p)
                        .reduce((sum, m) => sum + (m.inspection.expectedGain || 0), 0);
                      return (
                        <div key={p} className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: p === 1 ? '#c0392b' : '#2c3e50' }}
                          />
                          <span className="text-xs text-stone-600 flex-1">Player {p}</span>
                          <span className="text-xs font-bold text-stone-800">{score}pts</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ SANDBOX TAB ═══════════════════ */}
          {activeTab === 'sandbox' && (
            <motion.div
              key="sandbox"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6"
            >
              {/* Left: Code Editor */}
              <div className="space-y-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                      <FlaskConical size={16} className="text-[#7d5230]" />
                      Strategy Code Editor
                    </h3>
                    <input
                      type="text"
                      value={sandboxName}
                      onChange={e => setSandboxName(e.target.value)}
                      placeholder="Strategy name…"
                      className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 focus:outline-none focus:border-[#7d5230] w-44"
                    />
                  </div>
                  <CodeEditor
                    value={sandboxCode}
                    onChange={setSandboxCode}
                    height={340}
                    error={validationResult?.overallStatus === 'failed' ? validationResult.errorLog[0] : undefined}
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleValidate}
                      disabled={validating || !sandboxCode.trim()}
                      className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
                    >
                      {validating ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Activity size={14} />
                        </motion.div>
                      ) : <CheckCircle size={14} />}
                      {validating ? 'Validating…' : 'Validate & Save'}
                    </button>
                    {validationResult?.overallStatus === 'passed' && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <CheckCircle size={14} /> Strategy Saved!
                      </div>
                    )}
                  </div>
                </div>

                {/* Saved Strategies */}
                {savedStrategies.length > 0 && (
                  <div className="card p-4">
                    <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                      <Upload size={14} className="text-[#7d5230]" /> Saved Strategies ({savedStrategies.length})
                    </h4>
                    <div className="space-y-2">
                      {savedStrategies.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                          <div className={`w-2 h-2 rounded-full ${s.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-semibold text-stone-700 flex-1">{s.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            s.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {s.isValid ? 'Valid' : 'Invalid'}
                          </span>
                          <button
                            onClick={() => setSandboxCode(s.code)}
                            className="text-xs text-[#7d5230] hover:underline"
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Validation Report */}
              <div>
                {validating && (
                  <div className="card p-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="w-12 h-12 rounded-full border-4 border-[#7d5230] border-t-transparent mx-auto mb-4"
                    />
                    <p className="text-sm font-semibold text-stone-600">Running validation tests…</p>
                    <p className="text-xs text-stone-400 mt-1">Testing 3 board positions</p>
                  </div>
                )}
                {validationResult && !validating && (
                  <ValidationReportPanel report={validationResult} />
                )}
                {!validationResult && !validating && (
                  <div className="card p-6 text-center">
                    <FlaskConical size={36} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm font-semibold text-stone-500">Sandbox Validator</p>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      Write your strategy code and click Validate to test it in a safe sandbox environment.
                    </p>
                    <div className="mt-4 text-left bg-stone-50 rounded-xl p-3 text-xs text-stone-600 space-y-1 border border-stone-200">
                      <div className="font-bold text-stone-700 mb-1">Safety Guarantees:</div>
                      <div>✓ No file system access</div>
                      <div>✓ No network access</div>
                      <div>✓ No system commands</div>
                      <div>✓ 500ms timeout enforced</div>
                      <div>✓ Infinite loop protection</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ COACH TAB ══════════════════════ */}
          {activeTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6"
            >
              {/* Game selector */}
              <div className="card p-4">
                <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <Brain size={14} className="text-[#7d5230]" /> Select Game to Analyze
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getGameHistory().slice(0, 20).map((game, idx) => (
                    <button
                      key={game.id}
                      onClick={() => handleAnalyzeGame(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                        coachGame?.id === game.id
                          ? 'border-[#7d5230] bg-[#7d5230]/5'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-semibold text-stone-700">
                        {game.config.player1Name} vs {game.config.player2Name}
                      </div>
                      <div className="text-stone-400 mt-0.5">{game.date} · {game.totalMoves} moves</div>
                      <div className={`mt-1 font-bold ${
                        game.result.winner === 1 ? 'text-red-600' : game.result.winner === 2 ? 'text-slate-600' : 'text-amber-600'
                      }`}>
                        {game.result.winner === 'draw' ? 'Draw' : `Winner: ${game.result.winner === 1 ? game.config.player1Name : game.config.player2Name}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coach Report */}
              {coachReport ? (
                <CoachReportPanel report={coachReport} />
              ) : (
                <div className="card p-8 text-center flex flex-col items-center justify-center">
                  <Brain size={48} className="text-stone-300 mb-4" />
                  <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>AI Coach</h3>
                  <p className="text-sm text-stone-400 max-w-sm">
                    Select a completed game from the list to receive detailed coaching analysis and improvement suggestions.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ OPENINGS TAB ═══════════════════ */}
          {activeTab === 'openings' && (
            <motion.div
              key="openings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <OpeningExplorerPanel stats={openingStats} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Move Inspector Panel ─────────────────────────────────────

function MoveInspectorPanel({ inspection }: { inspection: MoveInspection }) {
  const threatColor = THREAT_COLORS[inspection.opponentThreatLevel];

  return (
    <div className="card p-4 space-y-3">
      <h4 className="font-bold text-stone-700 text-sm flex items-center gap-2">
        <Info size={14} className="text-[#7d5230]" /> Move Inspector
      </h4>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Player', value: `Player ${inspection.currentPlayer}`, color: inspection.currentPlayer === 1 ? '#c0392b' : '#2c3e50' },
          { label: 'Move #', value: `#${inspection.moveNumber}` },
          { label: 'Cell', value: inspection.chosenCell, mono: true },
          { label: 'Score', value: `+${inspection.moveScore}pts` },
          { label: 'Think Time', value: `${inspection.thinkingTimeMs.toFixed(1)}ms` },
          { label: 'Expected Gain', value: `+${inspection.expectedGain}pts` },
        ].map(item => (
          <div key={item.label} className="bg-stone-50 rounded-lg p-2 border border-stone-200">
            <div className="text-xs text-stone-400 font-medium">{item.label}</div>
            <div
              className={`text-sm font-bold mt-0.5 ${item.mono ? 'font-mono' : ''}`}
              style={{ color: item.color ?? '#3e2510' }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Strategy name */}
      <div className="bg-[#7d5230]/5 border border-[#d4b896] rounded-lg px-3 py-2">
        <div className="text-xs text-stone-400">Strategy</div>
        <div className="text-sm font-bold text-[#7d5230]">{inspection.strategyName}</div>
      </div>

      {/* Reason */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
        <div className="text-xs text-stone-400 mb-1">Reason for Move</div>
        <div className="text-xs text-stone-700 leading-relaxed">{inspection.reason || 'No reason provided'}</div>
      </div>

      {/* Board evaluation */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 space-y-1.5">
        <div className="text-xs font-semibold text-stone-500">Board Evaluation</div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-600 font-bold">P1: {inspection.boardEvaluation.player1Score}pts</span>
          <span className="text-stone-400">{inspection.boardEvaluation.boardFillPercent}% filled</span>
          <span className="text-slate-600 font-bold">P2: {inspection.boardEvaluation.player2Score}pts</span>
        </div>
        {/* Score bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full"
            style={{ width: `${Math.min(100, inspection.boardEvaluation.player1Score / Math.max(1, inspection.boardEvaluation.player1Score + inspection.boardEvaluation.player2Score) * 100)}%` }}
          />
        </div>
      </div>

      {/* Threat level */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500 font-semibold">Opponent Threat</span>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
          style={{ background: `${threatColor}20`, color: threatColor }}
        >
          {inspection.opponentThreatLevel}
        </span>
      </div>

      {/* Connections */}
      {inspection.createdConnections.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold text-green-700">✓ Created {inspection.createdConnections.length} connection{inspection.createdConnections.length > 1 ? 's' : ''}</span>
        </div>
      )}
      {inspection.blockedConnections.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold text-blue-700">⊘ Blocked {inspection.blockedConnections.length} opponent connection{inspection.blockedConnections.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Top future moves */}
      {inspection.potentialFutureMoves.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
          <div className="text-xs font-semibold text-stone-500 mb-1.5">Opponent's Top Threats</div>
          <div className="flex flex-wrap gap-1">
            {inspection.potentialFutureMoves.slice(0, 5).map((m, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded-md text-xs font-mono font-bold"
                style={{ background: `rgba(231,76,60,${0.15 - i * 0.02})`, color: '#c0392b' }}
              >
                {String.fromCharCode(65 + m.col)}{7 - m.row}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Validation Report Panel ──────────────────────────────────

function ValidationReportPanel({ report }: { report: Awaited<ReturnType<typeof validateStrategy>> }) {
  const statusIcon = {
    passed: <CheckCircle size={16} className="text-green-600" />,
    failed: <XCircle size={16} className="text-red-600" />,
    warning: <AlertCircle size={16} className="text-amber-600" />,
  };
  const statusColor = { passed: '#27ae60', failed: '#e74c3c', warning: '#e67e22' };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-3">
        {statusIcon[report.overallStatus]}
        <div>
          <h4 className="font-bold text-stone-800 text-sm">Validation Report</h4>
          <p className="text-xs text-stone-400">{report.strategyName} · {report.executionTimeMs}ms</p>
        </div>
        <span
          className="ml-auto px-3 py-1 rounded-full text-xs font-bold capitalize"
          style={{ background: `${statusColor[report.overallStatus]}20`, color: statusColor[report.overallStatus] }}
        >
          {report.overallStatus.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
        {report.checks.map(check => (
          <div key={check.id} className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
            <div className="mt-0.5">
              {check.status === 'passed' ? <CheckCircle size={12} className="text-green-600" />
                : check.status === 'failed' ? <XCircle size={12} className="text-red-600" />
                : check.status === 'warning' ? <AlertCircle size={12} className="text-amber-600" />
                : <Clock size={12} className="text-stone-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-700">{check.name}</div>
              <div className="text-xs text-stone-500 mt-0.5">{check.message}</div>
              {check.detail && (
                <div className="text-xs text-red-600 mt-0.5 font-mono">{check.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {report.sampleMoveOutput && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-700">Sample Move Output</div>
          <div className="text-xs text-green-600 font-mono mt-1">
            {'{'} row: {report.sampleMoveOutput.row}, col: {report.sampleMoveOutput.col} {'}'}
            {' → '}{String.fromCharCode(65 + report.sampleMoveOutput.col)}{7 - report.sampleMoveOutput.row}
          </div>
        </div>
      )}

      {report.errorLog.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-red-700 mb-1">Error Log</div>
          {report.errorLog.map((err, i) => (
            <div key={i} className="text-xs text-red-600 font-mono">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Coach Report Panel ───────────────────────────────────────

function CoachReportPanel({ report }: { report: ReturnType<typeof generateCoachReport> }) {
  const SKILL_COLORS = {
    beginner: '#95a5a6',
    intermediate: '#27ae60',
    advanced: '#2980b9',
    expert: '#d4af37',
  };

  const RATING_COLORS: Record<string, string> = {
    excellent: '#27ae60',
    good: '#2980b9',
    neutral: '#95a5a6',
    mistake: '#e67e22',
    critical_mistake: '#e74c3c',
    missed_opportunity: '#8e44ad',
  };

  const RATING_LABELS: Record<string, string> = {
    excellent: '⭐ Excellent',
    good: '👍 Good',
    neutral: '➖ Neutral',
    mistake: '⚠ Mistake',
    critical_mistake: '❌ Critical',
    missed_opportunity: '💭 Missed',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-stone-800 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
              AI Coach Report
            </h3>
            <p className="text-sm text-stone-400">{report.player1Name} vs {report.player2Name}</p>
          </div>
          <span
            className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
            style={{ background: `${SKILL_COLORS[report.estimatedSkillLevel]}20`, color: SKILL_COLORS[report.estimatedSkillLevel] }}
          >
            {report.estimatedSkillLevel}
          </span>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Offensive', value: report.offensiveRating, color: '#e74c3c', icon: <Swords size={14} /> },
            { label: 'Defensive', value: report.defensiveRating, color: '#2980b9', icon: <Shield size={14} /> },
            { label: 'Efficiency', value: report.efficiencyRating, color: '#27ae60', icon: <TrendingUp size={14} /> },
          ].map(r => (
            <div key={r.label} className="text-center bg-stone-50 rounded-xl p-3 border border-stone-200">
              <div className="flex items-center justify-center gap-1 text-stone-500 mb-1" style={{ color: r.color }}>
                {r.icon}
                <span className="text-xs font-semibold">{r.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: r.color }}>{r.value}</div>
              <div className="text-xs text-stone-400">/100</div>
            </div>
          ))}
        </div>
      </div>

      {/* Move summaries */}
      <div className="grid grid-cols-2 gap-3">
        {report.excellentMoves.length > 0 && (
          <div className="card p-3 border-l-4 border-green-500">
            <div className="text-xs font-bold text-green-700 mb-1">✨ Excellent Moves ({report.excellentMoves.length})</div>
            {report.excellentMoves.slice(0, 2).map(m => (
              <div key={m.moveNumber} className="text-xs text-stone-600">#{m.moveNumber}: {m.description}</div>
            ))}
          </div>
        )}
        {report.criticalMistakes.length > 0 && (
          <div className="card p-3 border-l-4 border-red-500">
            <div className="text-xs font-bold text-red-700 mb-1">❌ Critical Mistakes ({report.criticalMistakes.length})</div>
            {report.criticalMistakes.slice(0, 2).map(m => (
              <div key={m.moveNumber} className="text-xs text-stone-600">#{m.moveNumber}: {m.description}</div>
            ))}
          </div>
        )}
        {report.missedOpportunities.length > 0 && (
          <div className="card p-3 border-l-4 border-purple-500">
            <div className="text-xs font-bold text-purple-700 mb-1">💭 Missed Opportunities ({report.missedOpportunities.length})</div>
            {report.missedOpportunities.slice(0, 2).map(m => (
              <div key={m.moveNumber} className="text-xs text-stone-600">#{m.moveNumber}: {m.description}</div>
            ))}
          </div>
        )}
        {report.mistakes.length > 0 && (
          <div className="card p-3 border-l-4 border-amber-500">
            <div className="text-xs font-bold text-amber-700 mb-1">⚠ Mistakes ({report.mistakes.length})</div>
            {report.mistakes.slice(0, 2).map(m => (
              <div key={m.moveNumber} className="text-xs text-stone-600">#{m.moveNumber}: {m.description}</div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="card p-4">
        <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
          <Target size={14} className="text-[#7d5230]" /> Suggestions
        </h4>
        <ul className="space-y-2">
          {report.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
              <ChevronRight size={14} className="text-[#7d5230] shrink-0 mt-0.5" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="card p-4">
        <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
          <Zap size={14} className="text-amber-500" /> Improvement Tips
        </h4>
        <ul className="space-y-2">
          {report.improvementTips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
              <Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Opening Explorer Panel ───────────────────────────────────

function OpeningExplorerPanel({ stats }: { stats: ReturnType<typeof analyzeOpenings> | null }) {
  if (!stats) {
    return (
      <div className="card p-8 text-center">
        <BookOpen size={48} className="mx-auto text-stone-300 mb-4" />
        <p className="text-stone-500">Loading opening data…</p>
      </div>
    );
  }

  if (stats.topOpenings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <BookOpen size={48} className="mx-auto text-stone-300 mb-4" />
        <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Opening Explorer
        </h3>
        <p className="text-sm text-stone-400">
          Play more games to build an opening database. The explorer analyzes your first 6 moves.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.bestOpening && (
          <div className="card p-4 border-l-4 border-green-500">
            <div className="text-xs font-bold text-green-700 mb-1">🏆 Best Opening</div>
            <div className="font-bold text-stone-800">{stats.bestOpening.name}</div>
            <div className="text-sm text-green-600 font-semibold">{stats.bestOpening.winRate}% win rate</div>
            <div className="text-xs text-stone-400">{stats.bestOpening.frequency} games</div>
          </div>
        )}
        {stats.worstOpening && (
          <div className="card p-4 border-l-4 border-red-500">
            <div className="text-xs font-bold text-red-700 mb-1">⚠ Weakest Opening</div>
            <div className="font-bold text-stone-800">{stats.worstOpening.name}</div>
            <div className="text-sm text-red-600 font-semibold">{stats.worstOpening.winRate}% win rate</div>
            <div className="text-xs text-stone-400">{stats.worstOpening.frequency} games</div>
          </div>
        )}
        {stats.recommendedOpenings[0] && (
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="text-xs font-bold text-blue-700 mb-1">💡 Recommended</div>
            <div className="font-bold text-stone-800">{stats.recommendedOpenings[0].name}</div>
            <div className="text-sm text-blue-600 font-semibold">{stats.recommendedOpenings[0].winRate}% win rate</div>
            <div className="text-xs text-stone-400">Avg {stats.recommendedOpenings[0].avgScore}pts</div>
          </div>
        )}
      </div>

      {/* Opening table */}
      <div className="card p-5">
        <h3 className="font-bold text-stone-800 text-sm mb-4 flex items-center gap-2">
          <BookOpen size={14} className="text-[#7d5230]" /> Most Common Openings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 px-2 text-stone-400 font-semibold">Opening</th>
                <th className="text-center py-2 px-2 text-stone-400 font-semibold">Frequency</th>
                <th className="text-center py-2 px-2 text-stone-400 font-semibold">Win Rate</th>
                <th className="text-center py-2 px-2 text-stone-400 font-semibold">Avg Score</th>
                <th className="text-left py-2 px-2 text-stone-400 font-semibold">First Moves</th>
              </tr>
            </thead>
            <tbody>
              {stats.topOpenings.map((opening, idx) => (
                <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="py-2.5 px-2 font-semibold text-stone-700">{opening.name}</td>
                  <td className="py-2.5 px-2 text-center text-stone-500">{opening.frequency}x</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-bold ${opening.winRate >= 60 ? 'text-green-600' : opening.winRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {opening.winRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-stone-600">{opening.avgScore}pts</td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {opening.moves.slice(0, 4).map((m, mi) => (
                        <span key={mi} className="px-1.5 py-0.5 bg-stone-100 rounded font-mono text-stone-600">{m.label}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
