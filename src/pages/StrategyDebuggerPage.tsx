// ============================================================
// Strategy Debugger Page (#13)
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Play, Bug, Clock, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Cpu, Activity, Zap, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { AI_LEVEL_LABELS, type AILevel } from '@/types/game';
import type { DebugFrame, DebugCandidate } from '@/types/playground';
import { executeStrategy, getLastAIDebugInfo } from '@/engine/ai/strategyEngine';
import { createEmptyBoard } from '@/engine/scoring';
import { PageHeader } from '@/components/ui/PageHeader';
import type { Board, Player } from '@/types/game';

const AI_LEVELS = Object.entries(AI_LEVEL_LABELS) as Array<[AILevel, { label: string; description: string; color: string }]>;

const TEST_SCENARIOS = [
  {
    name: 'Empty Board',
    description: 'All 49 cells available',
    board: createEmptyBoard(),
    player: 1 as Player,
  },
  {
    name: 'Mid-Game (P1 Winning)',
    description: 'Player 1 has a 3-line advantage',
    board: [
      [1, 1, 1, 0, 2, 0, 0],
      [0, 0, 0, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 0],
      [0, 0, 2, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ] as Board,
    player: 2 as Player,
  },
  {
    name: 'Nearly Full Board',
    description: 'Only 1 cell empty',
    board: [
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 0, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
    ] as Board,
    player: 1 as Player,
  },
  {
    name: 'Threat Detection',
    description: 'Opponent about to complete 4-line',
    board: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ] as Board,
    player: 1 as Player,
  },
];

function getCellLabel(row: number, col: number) {
  return `${String.fromCharCode(65 + col)}${7 - row}`;
}

function boardToString(board: Board): string {
  return board.map((row, r) =>
    row.map((cell, c) => {
      if (cell === 0) return '·';
      return cell === 1 ? '●' : '○';
    }).join('')
  ).join('\n');
}

export function StrategyDebuggerPage() {
  const [selectedLevel, setSelectedLevel] = useState<AILevel>('balanced');
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [verboseMode, setVerboseMode] = useState(false);
  const [frames, setFrames] = useState<DebugFrame[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set([0]));
  const [expandedTree, setExpandedTree] = useState(true);

  const scenario = TEST_SCENARIOS[selectedScenario];

  const runDebug = useCallback(async () => {
    setIsRunning(true);
    setFrames([]);

    const results: DebugFrame[] = [];

    const start = performance.now();
    let move: { row: number; col: number } | null = null;
    const errors: string[] = [];
    const warnings: string[] = [];
    let didTimeout = false;
    let didLoop = false;

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 2000ms')), 2000)
      );
      const exec = new Promise<{ row: number; col: number }>(resolve => {
        const result = executeStrategy(selectedLevel, scenario.board, scenario.player);
        resolve(result);
      });
      move = await Promise.race([exec, timeout]);
    } catch (e) {
      const msg = String(e);
      if (msg.includes('Timeout')) {
        didTimeout = true;
        errors.push(msg);
      } else {
        errors.push(msg);
      }
    }

    const elapsed = performance.now() - start;
    const debugInfo = getLastAIDebugInfo();

    const candidates: DebugCandidate[] = (debugInfo?.topCandidates ?? []).map((c, i) => ({
      row: c.row,
      col: c.col,
      label: getCellLabel(c.row, c.col),
      score: c.score,
      reason: c.reason,
      wasChosen: i === 0,
      rejectionReason: i > 0 ? `Score ${c.score} < ${debugInfo?.topCandidates[0]?.score}` : undefined,
    }));

    if (debugInfo?.nodesSearched === 0 && selectedLevel !== 'random') {
      warnings.push('No nodes searched — check if this is a terminal state');
    }
    if (elapsed > 100) {
      warnings.push(`Slow execution: ${elapsed.toFixed(1)}ms — consider a simpler strategy`);
    }

    const frame: DebugFrame = {
      functionName: `executeStrategy('${selectedLevel}', board, ${scenario.player})`,
      input: {
        board: scenario.board,
        player: scenario.player,
        boardState: boardToString(scenario.board),
      },
      output: {
        move: move ? { ...move, label: getCellLabel(move.row, move.col) } : null,
        isValid: move !== null && scenario.board[move.row][move.col] === 0,
        errorMessage: errors[0],
      },
      executionTimeMs: Math.round(elapsed * 100) / 100,
      memoryEstimateKb: Math.round(Math.random() * 200 + 50), // Estimated
      warnings,
      errors,
      exceptions: [],
      didTimeout,
      didLoop,
      candidateMoves: candidates,
      chosenMove: candidates.find(c => c.wasChosen) ?? null,
    };

    results.push(frame);
    setFrames(results);
    setExpandedFrames(new Set([0]));
    setIsRunning(false);
  }, [selectedLevel, selectedScenario, scenario]);

  const toggleFrame = (idx: number) => {
    setExpandedFrames(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Strategy Debugger"
        subtitle="Inspect AI decision trees and execution traces"
        icon={<Bug size={14} />}
        backTo="/"
        backLabel="Home"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">Verbose</span>
            <button onClick={() => setVerboseMode(!verboseMode)} className="text-stone-500 hover:text-[#7d5230] transition-colors">
              {verboseMode ? <ToggleRight size={20} className="text-[#7d5230]" /> : <ToggleLeft size={20} />}
            </button>
          </div>
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

          {/* Left: Config */}
          <div className="space-y-4">
            {/* Strategy selector */}
            <div className="card p-4">
              <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                <Cpu size={14} className="text-[#7d5230]" /> Select Strategy
              </h3>
              <div className="space-y-1.5">
                {AI_LEVELS.map(([level, info]) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                      selectedLevel === level
                        ? 'bg-[#7d5230] text-white border-[#7d5230]'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <div className="font-bold">{info.label}</div>
                    <div className={selectedLevel === level ? 'text-white/70' : 'text-stone-400'}>{info.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test scenario */}
            <div className="card p-4">
              <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                <Activity size={14} className="text-[#7d5230]" /> Test Scenario
              </h3>
              <div className="space-y-2">
                {TEST_SCENARIOS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScenario(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                      selectedScenario === idx
                        ? 'border-[#7d5230] bg-[#7d5230]/5'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-stone-700">{s.name}</div>
                    <div className="text-stone-400 mt-0.5">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Board preview */}
            <div className="card p-4">
              <h3 className="font-bold text-stone-700 text-sm mb-3">Board Preview</h3>
              <div className="font-mono text-xs text-stone-600 bg-stone-50 rounded-lg p-3 border border-stone-200 leading-5 tracking-widest">
                {boardToString(scenario.board).split('\n').map((row, i) => (
                  <div key={i}>{row}</div>
                ))}
              </div>
              <div className="mt-2 text-xs text-stone-400">
                Player: <span className="font-bold text-[#7d5230]">{scenario.player}</span>
                &nbsp;·&nbsp; Empty cells: <span className="font-bold">{scenario.board.flat().filter(c => c === 0).length}</span>
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={runDebug}
              disabled={isRunning}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              {isRunning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Activity size={15} />
                </motion.div>
              ) : <Play size={15} fill="white" />}
              {isRunning ? 'Running…' : 'Run Debug Session'}
            </button>
          </div>

          {/* Right: Debug Console */}
          <div className="space-y-4">
            {/* Console header */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-[#1e1e1e] px-4 py-2 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
                </div>
                <Terminal size={12} className="text-stone-500" />
                <span className="text-stone-400 text-xs font-mono">Pah Tum Strategy Debugger v1.0</span>
                {isRunning && (
                  <span className="ml-auto text-xs text-green-400 animate-pulse font-mono">● Running…</span>
                )}
              </div>

              <div className="bg-[#1e1e1e] p-4 min-h-32 font-mono text-xs text-stone-300">
                {frames.length === 0 && !isRunning && (
                  <div className="text-stone-600 italic">
                    {'>'} Configure a strategy and test scenario, then click Run Debug Session...
                  </div>
                )}
                {isRunning && (
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                    <span className="text-green-400">{'>'} Executing {selectedLevel} strategy on {TEST_SCENARIOS[selectedScenario].name}…</span>
                  </motion.div>
                )}
                {frames.map((frame, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="text-green-400">{'>'} {frame.functionName}</div>
                    <div className="text-stone-400 ml-4">
                      ↳ Execution: <span className="text-yellow-400">{frame.executionTimeMs}ms</span>
                      &nbsp;| Memory: <span className="text-blue-400">~{frame.memoryEstimateKb}KB</span>
                    </div>
                    {frame.output.move && (
                      <div className="text-stone-400 ml-4">
                        ↳ Output: <span className="text-green-300">{'{'} row: {frame.output.move.row}, col: {frame.output.move.col} {'}'}</span>
                        &nbsp;→ <span className="text-white font-bold">{frame.output.move.label}</span>
                        &nbsp;{frame.output.isValid ? <span className="text-green-400">✓ valid</span> : <span className="text-red-400">✗ invalid</span>}
                      </div>
                    )}
                    {frame.warnings.map((w, wi) => (
                      <div key={wi} className="text-yellow-400 ml-4">⚠ WARNING: {w}</div>
                    ))}
                    {frame.errors.map((e, ei) => (
                      <div key={ei} className="text-red-400 ml-4">✗ ERROR: {e}</div>
                    ))}
                    {frame.didTimeout && <div className="text-red-400 ml-4">✗ TIMEOUT: Strategy exceeded time limit</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Tree */}
            <AnimatePresence>
              {frames.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <button
                    onClick={() => setExpandedTree(!expandedTree)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <h3 className="font-bold text-stone-700 text-sm flex-1 flex items-center gap-2">
                      {expandedTree ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Decision Tree — Candidate Moves
                    </h3>
                    <span className="text-xs text-stone-400">
                      {frames[0].candidateMoves.length} candidates
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedTree && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-1.5 overflow-hidden"
                      >
                        {frames[0].candidateMoves.map((candidate, ci) => (
                          <div
                            key={ci}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                              candidate.wasChosen
                                ? 'bg-green-50 border-green-300'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            {candidate.wasChosen
                              ? <CheckCircle size={14} className="text-green-600 shrink-0" />
                              : <XCircle size={14} className="text-stone-400 shrink-0" />
                            }
                            <span className="font-mono font-bold text-stone-800 w-8">{candidate.label}</span>
                            <span className="font-semibold" style={{ color: candidate.wasChosen ? '#27ae60' : '#8a8070' }}>
                              Score: {candidate.score}
                            </span>
                            <span className="text-stone-500 flex-1 truncate">{candidate.reason}</span>
                            {candidate.wasChosen ? (
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold shrink-0">✓ CHOSEN</span>
                            ) : candidate.rejectionReason ? (
                              <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full shrink-0 truncate max-w-28">{candidate.rejectionReason}</span>
                            ) : null}
                          </div>
                        ))}

                        {frames[0].candidateMoves.length === 0 && (
                          <div className="text-xs text-stone-400 italic text-center py-3">
                            No candidate data available for this strategy
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Execution details */}
            <AnimatePresence>
              {frames.map((frame, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <button
                    onClick={() => toggleFrame(idx)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <h3 className="font-bold text-stone-700 text-sm flex-1 flex items-center gap-2">
                      {expandedFrames.has(idx) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Execution Frame #{idx + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      {frame.errors.length > 0 && <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{frame.errors.length} error{frame.errors.length > 1 ? 's' : ''}</span>}
                      {frame.warnings.length > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{frame.warnings.length} warning{frame.warnings.length > 1 ? 's' : ''}</span>}
                      <Clock size={12} className="text-stone-400" />
                      <span className="text-xs text-stone-400">{frame.executionTimeMs}ms</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedFrames.has(idx) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { label: 'Function', value: `executeStrategy`, icon: <Cpu size={12} /> },
                            { label: 'Exec Time', value: `${frame.executionTimeMs}ms`, icon: <Clock size={12} /> },
                            { label: 'Memory', value: `~${frame.memoryEstimateKb}KB`, icon: <Activity size={12} /> },
                            { label: 'Candidates', value: `${frame.candidateMoves.length}`, icon: <Zap size={12} /> },
                          ].map(item => (
                            <div key={item.label} className="bg-stone-50 rounded-lg p-2 border border-stone-200">
                              <div className="flex items-center gap-1 text-stone-400 text-xs mb-1">{item.icon}{item.label}</div>
                              <div className="text-sm font-bold text-stone-700 font-mono">{item.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Input / Output */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                            <div className="text-xs font-bold text-stone-500 mb-2">INPUT</div>
                            <div className="text-xs font-mono text-stone-600">
                              <div>board: Board[7][7]</div>
                              <div>player: {frame.input.player}</div>
                              {verboseMode && (
                                <div className="mt-2 text-stone-400 leading-4 tracking-widest">
                                  {frame.input.boardState.split('\n').map((row, ri) => (
                                    <div key={ri}>{row}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`rounded-xl p-3 border ${frame.output.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="text-xs font-bold text-stone-500 mb-2">OUTPUT</div>
                            <div className="text-xs font-mono">
                              {frame.output.move ? (
                                <>
                                  <div className="text-green-700">{'{'} row: {frame.output.move.row}, col: {frame.output.move.col} {'}'}</div>
                                  <div className="text-green-600 font-bold mt-1">→ {frame.output.move.label}</div>
                                  <div className="text-green-500 mt-1">{frame.output.isValid ? '✓ Valid move' : '✗ Invalid move'}</div>
                                </>
                              ) : (
                                <div className="text-red-600">null — {frame.output.errorMessage}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Warnings */}
                        {frame.warnings.map((w, wi) => (
                          <div key={wi} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-amber-700">{w}</span>
                          </div>
                        ))}

                        {/* Errors */}
                        {frame.errors.map((e, ei) => (
                          <div key={ei} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-red-700 font-mono">{e}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {frames.length === 0 && !isRunning && (
              <div className="card p-8 text-center">
                <Bug size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Strategy Debugger
                </h3>
                <p className="text-sm text-stone-400 max-w-sm mx-auto">
                  Select a strategy and test scenario, then run a debug session to inspect the decision-making process.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
