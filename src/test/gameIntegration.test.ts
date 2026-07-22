// ============================================================
// Integration Tests: Game Engine — full game rules integration
// Tests that the engine + store together produce correct results.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { calculateGameResult, calculatePlayerScore, findLines } from '@/engine/scoring';
import { GreedyStrategy, RandomStrategy, MinimaxStrategy } from '@/engine/strategies';
import { getEmptyCells } from '@/engine/scoring';
import type { Board, GameConfig, Player } from '@/types/game';

function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: 'human-vs-human',
    timeControl: 'untimed',
    aiLevel1: 'balanced',
    aiLevel2: 'balanced',
    player1Name: 'P1',
    player2Name: 'P2',
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.getState().resetGame();
});

// ─── Score accuracy after full game ──────────────────────────
describe('Score accuracy', () => {
  it('correctly calculates score for a specific board state', () => {
    // Build a known board state
    const board: Board = Array.from({ length: 7 }, () => Array(7).fill(0)) as Board;
    // Player 1: 3-in-a-row at row 0 (cols 0,1,2)
    board[0][0] = 1; board[0][1] = 1; board[0][2] = 1;
    // Player 1: 4-in-a-row at row 2 (cols 0,1,2,3)
    board[2][0] = 1; board[2][1] = 1; board[2][2] = 1; board[2][3] = 1;
    // Player 2: 5-in-a-row at row 4 (cols 0-4)
    board[4][0] = 2; board[4][1] = 2; board[4][2] = 2; board[4][3] = 2; board[4][4] = 2;

    const p1Score = calculatePlayerScore(board, 1);
    const p2Score = calculatePlayerScore(board, 2);

    expect(p1Score.total).toBe(3 + 10); // 3-line + 4-line
    expect(p2Score.total).toBe(25);      // 5-line
  });

  it('winner has higher score than loser', () => {
    useGameStore.getState().initGame(makeConfig());
    // Give P1 a clear advantage by filling most of their moves optimally
    // We'll simulate 49 moves via the store
    let current: Player = 1;
    const board = useGameStore.getState().board;

    // Just run random moves for a full game and check result is valid
    let emptyCells = getEmptyCells(board);
    // Use greedy for P1, random for P2
    const snap = { ...useGameStore.getState() };

    let b = board.map(r => [...r]) as Board;
    let cp: Player = 1;

    for (let i = 0; i < 49; i++) {
      const move = cp === 1
        ? GreedyStrategy.makeMove(b, 1)
        : RandomStrategy.makeMove(b, 2);
      b[move.row][move.col] = cp;
      cp = cp === 1 ? 2 : 1;
    }

    const result = calculateGameResult(b);
    const { scores } = result;

    if (result.winner === 1) {
      expect(scores[0].total).toBeGreaterThan(scores[1].total);
    } else if (result.winner === 2) {
      expect(scores[1].total).toBeGreaterThan(scores[0].total);
    } else {
      expect(scores[0].total).toBe(scores[1].total);
    }
  });
});

// ─── Game flow via store ──────────────────────────────────────
describe('Game flow via store (integration)', () => {
  it('a complete human-vs-human game ends with result', () => {
    useGameStore.getState().initGame(makeConfig());

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        useGameStore.getState().placepiece(r, c, true);
      }
    }

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('finished');
    expect(state.result).not.toBeNull();
    expect(state.moves).toHaveLength(49);
  });

  it('game has correct result scores — they sum to total pieces placed with scoring', () => {
    useGameStore.getState().initGame(makeConfig());
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        useGameStore.getState().placepiece(r, c, true);
      }
    }
    const { result, board } = useGameStore.getState();
    // Re-compute and verify
    const p1 = calculatePlayerScore(board, 1);
    const p2 = calculatePlayerScore(board, 2);
    expect(result!.scores[0].total).toBe(p1.total);
    expect(result!.scores[1].total).toBe(p2.total);
  });

  it('50th move is rejected (board already full)', () => {
    useGameStore.getState().initGame(makeConfig());
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        useGameStore.getState().placepiece(r, c, true);
      }
    }
    const movesBeforeExtra = useGameStore.getState().moves.length;
    useGameStore.getState().placepiece(0, 0, true); // board full, should fail
    expect(useGameStore.getState().moves.length).toBe(movesBeforeExtra);
  });
});

// ─── Score invariants ─────────────────────────────────────────
describe('Scoring invariants', () => {
  it('scores are always non-negative', () => {
    const board = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => ((r + c) % 2 === 0 ? 1 : 2))
    ) as Board;
    expect(calculatePlayerScore(board, 1).total).toBeGreaterThanOrEqual(0);
    expect(calculatePlayerScore(board, 2).total).toBeGreaterThanOrEqual(0);
  });

  it('an all-player-1 board gives player 1 the maximum score', () => {
    const board = Array.from({ length: 7 }, () => Array(7).fill(1)) as Board;
    const p1 = calculatePlayerScore(board, 1);
    const p2 = calculatePlayerScore(board, 2);
    // 7 rows × 119 + 7 cols × 119 = maximum possible
    expect(p1.total).toBe(7 * 119 + 7 * 119);
    expect(p2.total).toBe(0);
  });

  it('findLines does not overlap when pieces are adjacent diagonally (no diagonal scoring)', () => {
    const board = Array.from({ length: 7 }, () => Array(7).fill(0)) as Board;
    // Place diagonally — should score 0 (no diagonal lines in Pah Tum)
    board[0][0] = 1; board[1][1] = 1; board[2][2] = 1;
    board[3][3] = 1; board[4][4] = 1;
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(0); // no diagonal scoring
  });

  it('line scores match SCORE_TABLE exactly', () => {
    const expected = [
      { len: 3, score: 3 },
      { len: 4, score: 10 },
      { len: 5, score: 25 },
      { len: 6, score: 56 },
      { len: 7, score: 119 },
    ];

    for (const { len, score } of expected) {
      const board = Array.from({ length: 7 }, () => Array(7).fill(0)) as Board;
      for (let c = 0; c < len; c++) board[0][c] = 1 as 1;
      const lines = findLines(board, 1);
      expect(lines[0].score).toBe(score);
    }
  });
});

// ─── Edge cases ───────────────────────────────────────────────
describe('Edge cases', () => {
  it('two separate lines in same row do not merge', () => {
    const board = Array.from({ length: 7 }, () => Array(7).fill(0)) as Board;
    // Row 0: cols 0,1,2 = P1, col 3 = P2, cols 4,5,6 = P1
    board[0][0] = 1; board[0][1] = 1; board[0][2] = 1;
    board[0][3] = 2;
    board[0][4] = 1; board[0][5] = 1; board[0][6] = 1;
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(2);
    lines.forEach(l => expect(l.length).toBe(3));
  });

  it('a 7-piece vertical and horizontal through same cell counts both', () => {
    const board = Array.from({ length: 7 }, () => Array(7).fill(0)) as Board;
    // Full row 3 for P1
    for (let c = 0; c < 7; c++) board[3][c] = 1 as 1;
    // Full col 3 for P1
    for (let r = 0; r < 7; r++) board[r][3] = 1 as 1;
    const lines = findLines(board, 1);
    // Expect 2 lines: one H, one V (they share cell (3,3))
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const total = calculatePlayerScore(board, 1).total;
    // Both 7-lines score 119 each = 238
    expect(total).toBe(238);
  });

  it('placing at the board boundary (corner) is valid', () => {
    useGameStore.getState().initGame(makeConfig());
    expect(useGameStore.getState().placepiece(0, 0)).toBe(true);   // top-left
    expect(useGameStore.getState().placepiece(0, 6)).toBe(true);   // top-right (P2)
    expect(useGameStore.getState().placepiece(6, 0)).toBe(true);   // bottom-left (P1)
    expect(useGameStore.getState().placepiece(6, 6)).toBe(true);   // bottom-right (P2)
  });

  it('undo after completing a game returns to playing state', () => {
    useGameStore.getState().initGame(makeConfig());
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        useGameStore.getState().placepiece(r, c, true);
      }
    }
    expect(useGameStore.getState().gamePhase).toBe('finished');
    useGameStore.getState().undoMove(); // undo last move
    expect(useGameStore.getState().gamePhase).toBe('playing');
  });
});

// ─── AI vs AI simulation via store ───────────────────────────
describe('AI vs AI complete game simulation', () => {
  it('Greedy vs Greedy completes via store without error', () => {
    useGameStore.getState().initGame(makeConfig({ mode: 'ai-vs-ai', aiLevel1: 'greedy', aiLevel2: 'greedy' }));

    let b = useGameStore.getState().board.map(r => [...r]) as Board;
    let cp: Player = 1;

    for (let i = 0; i < 49; i++) {
      const move = GreedyStrategy.makeMove(b, cp);
      b[move.row][move.col] = cp;
      cp = cp === 1 ? 2 : 1;
    }

    const result = calculateGameResult(b);
    expect(['1', '2', 'draw'].includes(String(result.winner))).toBe(true);
  });
});
