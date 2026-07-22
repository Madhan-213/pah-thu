// ============================================================
// AI Strategies for Pah Tum
// Each strategy implements: makeMove(board, player) => {row, col}
// Interface is preserved for future custom strategy uploads.
// ============================================================

import type { Board, Player, AIStrategy, AILevel } from '@/types/game';
import {
  getEmptyCells,
  scoreGainFromMove,
  calculatePlayerScore,
  evaluateMove,
} from './scoring';
import { BOARD_SIZE } from '@/types/game';

// ─── Random Strategy ─────────────────────────────────────────
export const RandomStrategy: AIStrategy = {
  name: 'Random',
  level: 'random',
  description: 'Plays completely random valid moves.',
  makeMove(board, _player) {
    const empty = getEmptyCells(board);
    return empty[Math.floor(Math.random() * empty.length)];
  },
};

// ─── Greedy Strategy ─────────────────────────────────────────
export const GreedyStrategy: AIStrategy = {
  name: 'Greedy',
  level: 'greedy',
  description: 'Maximizes immediate personal score gain.',
  makeMove(board, player) {
    const empty = getEmptyCells(board);
    let best = empty[0];
    let bestGain = -Infinity;

    for (const cell of empty) {
      const gain = scoreGainFromMove(board, cell.row, cell.col, player);
      if (gain > bestGain) {
        bestGain = gain;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Defensive Strategy ──────────────────────────────────────
export const DefensiveStrategy: AIStrategy = {
  name: 'Defensive',
  level: 'defensive',
  description: 'Blocks opponent high-scoring lines first.',
  makeMove(board, player) {
    const opponent = player === 1 ? 2 : 1;
    const empty = getEmptyCells(board);
    let best = empty[0];
    let bestScore = -Infinity;

    for (const cell of empty) {
      // Weight: block opponent gain more than own gain
      const ownGain = scoreGainFromMove(board, cell.row, cell.col, player);
      const oppGain = scoreGainFromMove(board, cell.row, cell.col, opponent);
      const score = ownGain + oppGain * 1.5; // bias toward blocking
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Aggressive Strategy ─────────────────────────────────────
export const AggressiveStrategy: AIStrategy = {
  name: 'Aggressive',
  level: 'aggressive',
  description: 'Focuses on building own long lines at all costs.',
  makeMove(board, player) {
    const empty = getEmptyCells(board);
    let best = empty[0];
    let bestScore = -Infinity;

    for (const cell of empty) {
      const ownGain = scoreGainFromMove(board, cell.row, cell.col, player);
      // Extra weight on larger lines
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[cell.row][cell.col] = player;
      const lines = calculatePlayerScore(newBoard, player).lines;
      const maxLineLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
      const score = ownGain * 2 + maxLineLen * 3;
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Balanced Strategy ───────────────────────────────────────
export const BalancedStrategy: AIStrategy = {
  name: 'Balanced',
  level: 'balanced',
  description: 'Balances offense and defense using evaluation.',
  makeMove(board, player) {
    const empty = getEmptyCells(board);
    let best = empty[0];
    let bestScore = -Infinity;

    for (const cell of empty) {
      const score = evaluateMove(board, cell.row, cell.col, player);
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Minimax Strategy ────────────────────────────────────────
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  alpha: number,
  beta: number
): number {
  const opponent = player === 1 ? 2 : 1;
  const empty = getEmptyCells(board);

  if (depth === 0 || empty.length === 0) {
    const myScore = calculatePlayerScore(board, player).total;
    const oppScore = calculatePlayerScore(board, opponent).total;
    return myScore - oppScore;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const cell of empty.slice(0, 12)) { // limit branching
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[cell.row][cell.col] = player;
      const evalScore = minimax(newBoard, depth - 1, false, player, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const cell of empty.slice(0, 12)) {
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[cell.row][cell.col] = opponent;
      const evalScore = minimax(newBoard, depth - 1, true, player, alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export const MinimaxStrategy: AIStrategy = {
  name: 'Minimax',
  level: 'minimax',
  description: 'Lookahead search with alpha-beta pruning (depth 3).',
  makeMove(board, player) {
    const empty = getEmptyCells(board);
    let best = empty[0];
    let bestScore = -Infinity;

    // Sort candidates by immediate gain first (move ordering)
    const candidates = empty
      .map(c => ({ ...c, gain: scoreGainFromMove(board, c.row, c.col, player) }))
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 16); // top candidates

    for (const cell of candidates) {
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[cell.row][cell.col] = player;
      const score = minimax(newBoard, 2, false, player, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Monte Carlo Strategy ────────────────────────────────────
function simulateGame(
  board: Board,
  player: Player,
  startPlayer: Player
): number {
  const simBoard = board.map(r => [...r]) as Board;
  let current: Player = player;

  const empty = getEmptyCells(simBoard);
  // Fisher-Yates shuffle
  for (let i = empty.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empty[i], empty[j]] = [empty[j], empty[i]];
  }

  for (const cell of empty) {
    simBoard[cell.row][cell.col] = current;
    current = current === 1 ? 2 : 1;
  }

  const myScore = calculatePlayerScore(simBoard, startPlayer).total;
  const oppScore = calculatePlayerScore(simBoard, startPlayer === 1 ? 2 : 1).total;
  return myScore - oppScore;
}

export const MonteCarloStrategy: AIStrategy = {
  name: 'Monte Carlo',
  level: 'montecarlo',
  description: 'Runs 60 simulations per candidate move.',
  makeMove(board, player) {
    const empty = getEmptyCells(board);
    const SIMULATIONS = 60;
    let best = empty[0];
    let bestAvg = -Infinity;

    // Evaluate top candidates by immediate gain
    const candidates = empty
      .map(c => ({ ...c, gain: scoreGainFromMove(board, c.row, c.col, player) }))
      .sort((a, b) => b.gain - a.gain)
      .slice(0, Math.min(12, empty.length));

    for (const cell of candidates) {
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[cell.row][cell.col] = player;

      let totalScore = 0;
      const nextPlayer: Player = player === 1 ? 2 : 1;
      for (let i = 0; i < SIMULATIONS; i++) {
        totalScore += simulateGame(newBoard, nextPlayer, player);
      }
      const avg = totalScore / SIMULATIONS;
      if (avg > bestAvg) {
        bestAvg = avg;
        best = cell;
      }
    }
    return best;
  },
};

// ─── Strategy Registry ───────────────────────────────────────
export const STRATEGIES: Record<AILevel, AIStrategy> = {
  random: RandomStrategy,
  greedy: GreedyStrategy,
  defensive: DefensiveStrategy,
  aggressive: AggressiveStrategy,
  balanced: BalancedStrategy,
  minimax: MinimaxStrategy,
  montecarlo: MonteCarloStrategy,
};

export function getStrategy(level: AILevel): AIStrategy {
  return STRATEGIES[level] ?? BalancedStrategy;
}
