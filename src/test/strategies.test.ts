// ============================================================
// Unit Tests: AI Strategies
// Verifies all 7 strategies produce valid, legal moves.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  RandomStrategy,
  GreedyStrategy,
  DefensiveStrategy,
  AggressiveStrategy,
  BalancedStrategy,
  MinimaxStrategy,
  MonteCarloStrategy,
  getStrategy,
  STRATEGIES,
} from '@/engine/strategies';
import { createEmptyBoard, getEmptyCells } from '@/engine/scoring';
import { AI_LEVEL_LABELS } from '@/types/game';
import type { Board, Player, AILevel } from '@/types/game';

// ─── Helpers ─────────────────────────────────────────────────
function makeBoard(pattern: number[][]): Board {
  return pattern as Board;
}

function isLegalMove(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < 7 && col >= 0 && col < 7 && board[row][col] === 0;
}

// Fill most of the board, leaving specific cells empty
function boardWithHoles(emptyPositions: Array<[number, number]>): Board {
  const board = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      const isEmpty = emptyPositions.some(([er, ec]) => er === r && ec === c);
      return isEmpty ? 0 : ((r + c) % 2 === 0 ? 1 : 2);
    })
  ) as Board;
  return board;
}

// All strategies to test
const allStrategies = [
  { name: 'Random',     strategy: RandomStrategy },
  { name: 'Greedy',     strategy: GreedyStrategy },
  { name: 'Defensive',  strategy: DefensiveStrategy },
  { name: 'Aggressive', strategy: AggressiveStrategy },
  { name: 'Balanced',   strategy: BalancedStrategy },
  { name: 'Minimax',    strategy: MinimaxStrategy },
  { name: 'MonteCarlo', strategy: MonteCarloStrategy },
];

// ─── Common contract tests for ALL strategies ─────────────────
describe.each(allStrategies)('$name strategy — contract', ({ name, strategy }) => {
  it(`[${name}] makes a legal move on empty board for player 1`, () => {
    const board = createEmptyBoard();
    const move = strategy.makeMove(board, 1);
    expect(isLegalMove(board, move.row, move.col)).toBe(true);
  });

  it(`[${name}] makes a legal move on empty board for player 2`, () => {
    const board = createEmptyBoard();
    const move = strategy.makeMove(board, 2);
    expect(isLegalMove(board, move.row, move.col)).toBe(true);
  });

  it(`[${name}] does NOT place on an occupied cell`, () => {
    let board = createEmptyBoard();
    // Fill most of the board
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 6; c++) {
        board[r][c] = ((r + c) % 2 === 0 ? 1 : 2) as 1 | 2;
      }
    }
    // Only column 6 is empty
    const move = strategy.makeMove(board, 1);
    expect(board[move.row][move.col]).toBe(0);
    expect(move.col).toBe(6);
  });

  it(`[${name}] returns {row, col} within 0–6 range`, () => {
    const board = createEmptyBoard();
    const move = strategy.makeMove(board, 1);
    expect(move.row).toBeGreaterThanOrEqual(0);
    expect(move.row).toBeLessThanOrEqual(6);
    expect(move.col).toBeGreaterThanOrEqual(0);
    expect(move.col).toBeLessThanOrEqual(6);
  });

  it(`[${name}] works with only one empty cell remaining`, () => {
    const board = boardWithHoles([[4, 4]]);
    const move = strategy.makeMove(board, 1);
    expect(move.row).toBe(4);
    expect(move.col).toBe(4);
  });

  it(`[${name}] is consistent (same empty board produces a valid move repeatedly)`, () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      const move = strategy.makeMove(board, 1);
      expect(isLegalMove(board, move.row, move.col)).toBe(true);
    }
  });

  it(`[${name}] has correct metadata`, () => {
    expect(strategy.name).toBeTruthy();
    expect(strategy.level).toBeTruthy();
    expect(strategy.description).toBeTruthy();
  });
});

// ─── Random Strategy specific tests ───────────────────────────
describe('RandomStrategy', () => {
  it('level is "random"', () => {
    expect(RandomStrategy.level).toBe('random');
  });

  it('produces different moves across many calls (non-deterministic)', () => {
    const board = createEmptyBoard();
    const moves = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const m = RandomStrategy.makeMove(board, 1);
      moves.add(`${m.row},${m.col}`);
    }
    // With 49 empty cells, 30 random picks should give more than 1 unique cell
    expect(moves.size).toBeGreaterThan(1);
  });
});

// ─── Greedy Strategy specific tests ───────────────────────────
describe('GreedyStrategy', () => {
  it('level is "greedy"', () => {
    expect(GreedyStrategy.level).toBe('greedy');
  });

  it('prefers a move that completes a 3-in-a-row over an isolated move', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    board[0][1] = 1;
    // (0,2) would complete a 3-line for player 1 (+3 pts)
    // Any other cell is isolated (+0 pts)
    const move = GreedyStrategy.makeMove(board, 1);
    expect(move.row).toBe(0);
    expect(move.col).toBe(2);
  });

  it('prefers a 4-line completion over a 3-line completion', () => {
    const board = createEmptyBoard();
    board[0][0] = 1; board[0][1] = 1; board[0][2] = 1; // 3 in a row (row 0)
    board[1][0] = 1; board[1][1] = 1; board[1][2] = 1; // 3 in a row (row 1)
    // Placing at (0,3) completes a 4-in-row (+7 gain) for row 0
    // Placing at (1,3) completes a 4-in-row (+7 gain) for row 1
    // Both are equally good — just verify it picks one of these
    const move = GreedyStrategy.makeMove(board, 1);
    const gain = (move.row === 0 || move.row === 1) && move.col === 3;
    expect(gain).toBe(true);
  });
});

// ─── Defensive Strategy specific tests ────────────────────────
describe('DefensiveStrategy', () => {
  it('level is "defensive"', () => {
    expect(DefensiveStrategy.level).toBe('defensive');
  });

  it('blocks a high-value opponent line when possible', () => {
    const board = createEmptyBoard();
    // Player 2 is about to complete a 7-in-a-row (119 pts)
    for (let c = 0; c < 6; c++) { board[0][c] = 2; }
    // Player 1 (defensive) should block at (0,6)
    const move = DefensiveStrategy.makeMove(board, 1);
    expect(move.row).toBe(0);
    expect(move.col).toBe(6);
  });
});

// ─── Minimax Strategy specific tests ──────────────────────────
describe('MinimaxStrategy', () => {
  it('level is "minimax"', () => {
    expect(MinimaxStrategy.level).toBe('minimax');
  });

  it('completes a winning line if immediately available', () => {
    const board = createEmptyBoard();
    board[0][0] = 1; board[0][1] = 1; board[0][2] = 1; board[0][3] = 1; board[0][4] = 1; board[0][5] = 1;
    // (0,6) completes a 7-line for +119 points — any smart strategy should take this
    const move = MinimaxStrategy.makeMove(board, 1);
    expect(move.row).toBe(0);
    expect(move.col).toBe(6);
  });
});

// ─── Monte Carlo Strategy specific tests ──────────────────────
describe('MonteCarloStrategy', () => {
  it('level is "montecarlo"', () => {
    expect(MonteCarloStrategy.level).toBe('montecarlo');
  });

  it('returns a valid move under time pressure (multiple calls)', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 3; i++) {
      const move = MonteCarloStrategy.makeMove(board, 1);
      expect(isLegalMove(board, move.row, move.col)).toBe(true);
    }
  });
});

// ─── getStrategy factory ──────────────────────────────────────
describe('getStrategy', () => {
  const levels: AILevel[] = ['random', 'greedy', 'defensive', 'aggressive', 'balanced', 'minimax', 'montecarlo'];

  it.each(levels)('returns a strategy for level "%s"', (level) => {
    const s = getStrategy(level);
    expect(s).toBeDefined();
    expect(s.makeMove).toBeTypeOf('function');
  });

  it('falls back to BalancedStrategy for unknown level', () => {
    const s = getStrategy('unknown' as AILevel);
    expect(s.level).toBe('balanced');
  });
});

// ─── STRATEGIES registry ──────────────────────────────────────
describe('STRATEGIES registry', () => {
  it('has all 7 strategies registered', () => {
    expect(Object.keys(STRATEGIES)).toHaveLength(7);
  });

  it('each registered strategy has a makeMove function', () => {
    Object.values(STRATEGIES).forEach(s => {
      expect(s.makeMove).toBeTypeOf('function');
    });
  });
});

// ─── AI_LEVEL_LABELS completeness ─────────────────────────────
describe('AI_LEVEL_LABELS', () => {
  const levels: AILevel[] = ['random', 'greedy', 'defensive', 'aggressive', 'balanced', 'minimax', 'montecarlo'];

  it.each(levels)('has label and description for "%s"', (level) => {
    expect(AI_LEVEL_LABELS[level].label).toBeTruthy();
    expect(AI_LEVEL_LABELS[level].description).toBeTruthy();
    expect(AI_LEVEL_LABELS[level].color).toMatch(/^#/);
  });
});

// ─── Full simulation test ─────────────────────────────────────
describe('Full game simulation with AI strategies', () => {
  function simulateGame(player1Strategy: typeof RandomStrategy, player2Strategy: typeof RandomStrategy) {
    let board = createEmptyBoard();
    let currentPlayer: Player = 1;
    let moves = 0;

    while (getEmptyCells(board).length > 0) {
      const strategy = currentPlayer === 1 ? player1Strategy : player2Strategy;
      const move = strategy.makeMove(board, currentPlayer);

      expect(isLegalMove(board, move.row, move.col)).toBe(true);
      board[move.row][move.col] = currentPlayer;
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      moves++;
    }

    expect(moves).toBe(49);
    expect(getEmptyCells(board)).toHaveLength(0);
    return board;
  }

  it('Random vs Random completes all 49 moves', () => {
    simulateGame(RandomStrategy, RandomStrategy);
  });

  it('Greedy vs Random completes all 49 moves', () => {
    simulateGame(GreedyStrategy, RandomStrategy);
  });

  it('Greedy vs Defensive completes all 49 moves', () => {
    simulateGame(GreedyStrategy, DefensiveStrategy);
  });

  it('Balanced vs Minimax completes all 49 moves', () => {
    simulateGame(BalancedStrategy, MinimaxStrategy);
  });

  it('Minimax vs MonteCarlo completes all 49 moves', () => {
    simulateGame(MinimaxStrategy, MonteCarloStrategy);
  });
});
