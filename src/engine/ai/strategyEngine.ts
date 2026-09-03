// ============================================================
// Strategy Engine — Single Responsibility Pipeline
// Implements 7 distinct AI algorithms, Minimax Alpha-Beta, MCTS & Debug tracking
// ============================================================

import type { Board, Player, AILevel } from '@/types/game';
import type { BoardAnalysis, EvaluatedMove, AIDebugInfo } from './types';
import { analyzeBoard } from './boardAnalyzer';
import { generateLegalMoves, simulateMove } from './moveGenerator';
import { evaluateCandidateMove } from './evaluator';
import { calculatePlayerScore, scoreGainFromMove } from '../scoring';

// Global store for the last AI decision info (inspected by AI Debug Panel)
let lastAIDebugInfo: AIDebugInfo | null = null;

export function getLastAIDebugInfo(): AIDebugInfo | null {
  return lastAIDebugInfo;
}

// ─── MINIMAX ENGINE WITH ALPHA-BETA PRUNING & MEMOIZATION ───

const evalCache = new Map<string, number>();

function getBoardCacheKey(board: Board, player: Player, depth: number): string {
  let key = `${player}-${depth}:`;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      key += board[r][c];
    }
  }
  return key;
}

interface MinimaxResult {
  score: number;
  nodesSearched: number;
}

function minimaxAlphaBeta(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  alpha: number,
  beta: number,
  nodesRef: { count: number }
): number {
  nodesRef.count++;
  const cacheKey = getBoardCacheKey(board, player, depth);
  if (evalCache.has(cacheKey)) {
    return evalCache.get(cacheKey)!;
  }

  const opponent: Player = player === 1 ? 2 : 1;
  const empty = generateLegalMoves(board);

  if (depth === 0 || empty.length === 0) {
    const myScore = calculatePlayerScore(board, player).total;
    const oppScore = calculatePlayerScore(board, opponent).total;
    const score = myScore - oppScore;
    evalCache.set(cacheKey, score);
    return score;
  }

  // Move ordering: sort top candidates by immediate score gain
  const orderedCandidates = empty
    .map(c => ({
      ...c,
      gain: scoreGainFromMove(board, c.row, c.col, isMaximizing ? player : opponent),
    }))
    .sort((a, b) => b.gain - a.gain)
    .slice(0, Math.min(14, empty.length));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const cell of orderedCandidates) {
      const sim = simulateMove(board, cell.row, cell.col, player);
      const evalScore = minimaxAlphaBeta(sim, depth - 1, false, player, alpha, beta, nodesRef);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    evalCache.set(cacheKey, maxEval);
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const cell of orderedCandidates) {
      const sim = simulateMove(board, cell.row, cell.col, opponent);
      const evalScore = minimaxAlphaBeta(sim, depth - 1, true, player, alpha, beta, nodesRef);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    evalCache.set(cacheKey, minEval);
    return minEval;
  }
}

// ─── MONTE CARLO SIMULATOR ────────────────────────────────────

function runMCTSRollout(simBoard: Board, activePlayer: Player, startPlayer: Player): number {
  let current: Player = activePlayer;
  const empty = generateLegalMoves(simBoard);

  // Fisher-Yates shuffle
  for (let i = empty.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empty[i], empty[j]] = [empty[j], empty[i]];
  }

  for (const cell of empty) {
    simBoard[cell.row][cell.col] = current;
    current = current === 1 ? 2 : 1;
  }

  const p1 = calculatePlayerScore(simBoard, startPlayer).total;
  const p2 = calculatePlayerScore(simBoard, startPlayer === 1 ? 2 : 1).total;
  return p1 > p2 ? 1 : p1 < p2 ? 0 : 0.5;
}

// ─── STRATEGY ENGINE MAIN EXECUTION ───────────────────────────

export function executeStrategy(
  level: AILevel,
  board: Board,
  player: Player
): { row: number; col: number } {
  const startTime = performance.now();
  const analysis = analyzeBoard(board, player);
  const legalMoves = analysis.emptyCells;

  if (legalMoves.length === 0) {
    return { row: 0, col: 0 };
  }

  let evaluatedCandidates: EvaluatedMove[] = [];
  let chosenMove: EvaluatedMove;
  let nodesSearched = 0;
  let rationale = '';

  // Clear memoization cache periodically to keep memory lightweight
  if (evalCache.size > 2000) evalCache.clear();

  switch (level) {

    // ─── 1. RANDOM ───────────────────────────────────────────
    case 'random': {
      const pick = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      chosenMove = {
        row: pick.row,
        col: pick.col,
        score: 0,
        immediateGain: 0,
        threatBlock: 0,
        chainPotential: 0,
        centerScore: 0,
        reason: 'Selected completely at random',
      };
      evaluatedCandidates = [chosenMove];
      rationale = 'Random strategy selected an available empty cell without evaluation.';
      break;
    }

    // ─── 2. GREEDY ───────────────────────────────────────────
    case 'greedy': {
      evaluatedCandidates = legalMoves.map(cell => {
        const gain = scoreGainFromMove(board, cell.row, cell.col, player);
        return {
          row: cell.row,
          col: cell.col,
          score: gain,
          immediateGain: gain,
          threatBlock: 0,
          chainPotential: 0,
          centerScore: 0,
          reason: gain > 0 ? `Immediate gain +${gain}pts` : 'No immediate gain',
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      rationale = chosenMove.immediateGain > 0
        ? `Greedy AI chose cell with max immediate points (+${chosenMove.immediateGain}pts).`
        : 'No immediate points available; selected positional cell.';
      break;
    }

    // ─── 3. DEFENSIVE ────────────────────────────────────────
    case 'defensive': {
      evaluatedCandidates = legalMoves.map(cell => {
        const ev = evaluateCandidateMove(board, cell.row, cell.col, player, analysis);
        // Defensive weighting: 70% threat block + 30% immediate gain
        const defScore = ev.threatBlock * 12 + ev.immediateGain * 3;
        return {
          ...ev,
          score: Math.round(defScore * 100) / 100,
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      rationale = chosenMove.threatBlock > 0
        ? `Defensive AI blocked opponent threat of +${chosenMove.threatBlock}pts!`
        : 'No immediate opponent threat; advancing defense position.';
      break;
    }

    // ─── 4. AGGRESSIVE ───────────────────────────────────────
    case 'aggressive': {
      evaluatedCandidates = legalMoves.map(cell => {
        const ev = evaluateCandidateMove(board, cell.row, cell.col, player, analysis);
        // Aggressive weighting: 75% chain building & attack + 25% immediate gain
        const aggScore = ev.chainPotential * 4 + ev.immediateGain * 8;
        return {
          ...ev,
          score: Math.round(aggScore * 100) / 100,
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      rationale = `Aggressive AI selected move to build long line chains (Chain potential: ${chosenMove.chainPotential}).`;
      break;
    }

    // ─── 5. BALANCED ─────────────────────────────────────────
    case 'balanced': {
      evaluatedCandidates = legalMoves.map(cell => {
        const ev = evaluateCandidateMove(board, cell.row, cell.col, player, analysis);
        // Formula: 45% attack + 45% defense + 10% center control
        const attack = ev.immediateGain * 6 + ev.chainPotential * 2;
        const defense = ev.threatBlock * 6;
        const control = ev.centerScore * 1.5;
        const balScore = attack * 0.45 + defense * 0.45 + control * 0.1;
        return {
          ...ev,
          score: Math.round(balScore * 100) / 100,
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      rationale = `Balanced AI selected highest overall evaluation (45% attack, 45% defense, 10% center).`;
      break;
    }

    // ─── 6. MINIMAX (ALPHA-BETA PRUNING) ────────────────────
    case 'minimax': {
      const nodesRef = { count: 0 };
      const searchDepth = analysis.phase === 'endgame' ? 4 : 3;

      // Candidate selection
      const topCandidates = legalMoves
        .map(cell => evaluateCandidateMove(board, cell.row, cell.col, player, analysis))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(12, legalMoves.length));

      evaluatedCandidates = topCandidates.map(cell => {
        const sim = simulateMove(board, cell.row, cell.col, player);
        const mmScore = minimaxAlphaBeta(sim, searchDepth - 1, false, player, -Infinity, Infinity, nodesRef);
        return {
          ...cell,
          score: Math.round(mmScore * 100) / 100,
          reason: `Minimax (Depth ${searchDepth}) Score: ${mmScore}`,
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      nodesSearched = nodesRef.count;
      rationale = `Minimax with Alpha-Beta pruning searched ${nodesSearched} nodes at depth ${searchDepth}.`;
      break;
    }

    // ─── 7. MONTE CARLO (MCTS) ───────────────────────────────
    case 'montecarlo': {
      const SIMULATIONS = analysis.phase === 'endgame' ? 80 : 50;
      nodesSearched = SIMULATIONS * Math.min(10, legalMoves.length);

      const topCandidates = legalMoves
        .map(cell => evaluateCandidateMove(board, cell.row, cell.col, player, analysis))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(10, legalMoves.length));

      const nextPlayer: Player = player === 1 ? 2 : 1;

      evaluatedCandidates = topCandidates.map(cell => {
        let wins = 0;
        for (let i = 0; i < SIMULATIONS; i++) {
          const sim = simulateMove(board, cell.row, cell.col, player);
          wins += runMCTSRollout(sim, nextPlayer, player);
        }
        const winRate = Math.round((wins / SIMULATIONS) * 100);
        return {
          ...cell,
          score: winRate,
          reason: `MCTS Win Rate: ${winRate}% (${SIMULATIONS} rollouts)`,
        };
      }).sort((a, b) => b.score - a.score);

      chosenMove = evaluatedCandidates[0];
      rationale = `Monte Carlo Tree Search ran ${SIMULATIONS} rollouts per move. Top move win rate: ${chosenMove.score}%.`;
      break;
    }

    default: {
      const pick = legalMoves[0];
      chosenMove = evaluateCandidateMove(board, pick.row, pick.col, player, analysis);
      evaluatedCandidates = [chosenMove];
      rationale = 'Default fallback strategy.';
      break;
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  const moveLabel = `${String.fromCharCode(65 + chosenMove.col)}${7 - chosenMove.row}`;

  // Store debug metrics for the AI Debug Panel
  lastAIDebugInfo = {
    strategyName: level.toUpperCase(),
    level,
    chosenMove: { row: chosenMove.row, col: chosenMove.col, label: moveLabel },
    evaluationScore: chosenMove.score,
    topCandidates: evaluatedCandidates.slice(0, 10),
    thinkingTimeMs: durationMs,
    nodesSearched,
    reason: rationale,
    gamePhase: analysis.phase,
  };

  return { row: chosenMove.row, col: chosenMove.col };
}
