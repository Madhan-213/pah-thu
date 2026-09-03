// ============================================================
// AI Strategies Registry for Pah Tum
// Connects UI & Engine to the modular StrategyEngine pipeline
// Preserves 100% backward compatibility with makeMove(board, player)
// ============================================================

import type { Board, Player, AIStrategy, AILevel } from '@/types/game';
import { executeStrategy, getLastAIDebugInfo } from './ai/strategyEngine';
export { getLastAIDebugInfo } from './ai/strategyEngine';

// ─── 1. Random Strategy ───────────────────────────────────────
export const RandomStrategy: AIStrategy = {
  name: 'Random',
  level: 'random',
  description: 'Plays completely random valid moves without evaluation.',
  makeMove(board, player) {
    return executeStrategy('random', board, player);
  },
};

// ─── 2. Greedy Strategy ───────────────────────────────────────
export const GreedyStrategy: AIStrategy = {
  name: 'Greedy',
  level: 'greedy',
  description: 'Rushes immediate scoring. Ignores future opponent planning.',
  makeMove(board, player) {
    return executeStrategy('greedy', board, player);
  },
};

// ─── 3. Defensive Strategy ────────────────────────────────────
export const DefensiveStrategy: AIStrategy = {
  name: 'Defensive',
  level: 'defensive',
  description: 'Detects and blocks opponent scoring threats first.',
  makeMove(board, player) {
    return executeStrategy('defensive', board, player);
  },
};

// ─── 4. Aggressive Strategy ───────────────────────────────────
export const AggressiveStrategy: AIStrategy = {
  name: 'Aggressive',
  level: 'aggressive',
  description: 'Focuses on creating long 5, 6, and 7-in-a-row chains.',
  makeMove(board, player) {
    return executeStrategy('aggressive', board, player);
  },
};

// ─── 5. Balanced Strategy ─────────────────────────────────────
export const BalancedStrategy: AIStrategy = {
  name: 'Balanced',
  level: 'balanced',
  description: '45% attack, 45% defense, 10% center control evaluation.',
  makeMove(board, player) {
    return executeStrategy('balanced', board, player);
  },
};

// ─── 6. Minimax Strategy ──────────────────────────────────────
export const MinimaxStrategy: AIStrategy = {
  name: 'Minimax',
  level: 'minimax',
  description: 'Lookahead search with Alpha-Beta pruning & node memoization.',
  makeMove(board, player) {
    return executeStrategy('minimax', board, player);
  },
};

// ─── 7. Monte Carlo Strategy ──────────────────────────────────
export const MonteCarloStrategy: AIStrategy = {
  name: 'Monte Carlo',
  level: 'montecarlo',
  description: 'Simulation-based MCTS estimating move win probabilities.',
  makeMove(board, player) {
    return executeStrategy('montecarlo', board, player);
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
