// ============================================================
// Unit Tests: Pah Tum Scoring Engine
// Tests every rule of the game scoring system.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyBoard,
  findLines,
  calculatePlayerScore,
  calculateGameResult,
  evaluateMove,
  scoreGainFromMove,
  getEmptyCells,
  isBoardFull,
  isWinningCell,
} from '@/engine/scoring';
import { BOARD_SIZE, SCORE_TABLE } from '@/types/game';
import type { Board, Player } from '@/types/game';

// ─── Helpers ─────────────────────────────────────────────────
function placeRow(board: Board, row: number, player: Player, startCol: number, length: number): Board {
  const b = board.map(r => [...r]) as Board;
  for (let c = startCol; c < startCol + length; c++) {
    b[row][c] = player;
  }
  return b;
}

function placeCol(board: Board, col: number, player: Player, startRow: number, length: number): Board {
  const b = board.map(r => [...r]) as Board;
  for (let r = startRow; r < startRow + length; r++) {
    b[r][col] = player;
  }
  return b;
}

// ─── Board Creation ───────────────────────────────────────────
describe('createEmptyBoard', () => {
  it('creates a 7×7 board', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(7);
    board.forEach(row => expect(row.length).toBe(7));
  });

  it('all cells start as 0', () => {
    const board = createEmptyBoard();
    board.forEach(row => row.forEach(cell => expect(cell).toBe(0)));
  });

  it('returns independent arrays (no shared references)', () => {
    const b1 = createEmptyBoard();
    const b2 = createEmptyBoard();
    b1[0][0] = 1;
    expect(b2[0][0]).toBe(0);
  });
});

// ─── SCORE_TABLE correctness ──────────────────────────────────
describe('SCORE_TABLE', () => {
  it('has correct scores per the official rules', () => {
    expect(SCORE_TABLE[3]).toBe(3);
    expect(SCORE_TABLE[4]).toBe(10);
    expect(SCORE_TABLE[5]).toBe(25);
    expect(SCORE_TABLE[6]).toBe(56);
    expect(SCORE_TABLE[7]).toBe(119);
  });

  it('has entries for lengths 3 through 7', () => {
    [3, 4, 5, 6, 7].forEach(len => expect(SCORE_TABLE[len]).toBeDefined());
  });
});

// ─── findLines ────────────────────────────────────────────────
describe('findLines', () => {
  let board: Board;
  beforeEach(() => { board = createEmptyBoard(); });

  // Horizontal
  it('finds a horizontal line of 3', () => {
    board = placeRow(board, 0, 1, 0, 3);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].length).toBe(3);
    expect(lines[0].score).toBe(3);
  });

  it('finds a horizontal line of 4', () => {
    board = placeRow(board, 3, 1, 1, 4);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].length).toBe(4);
    expect(lines[0].score).toBe(10);
  });

  it('finds a horizontal line of 5', () => {
    board = placeRow(board, 2, 1, 0, 5);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].score).toBe(25);
  });

  it('finds a horizontal line of 6', () => {
    board = placeRow(board, 4, 2, 0, 6);
    const lines = findLines(board, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].score).toBe(56);
  });

  it('finds a full horizontal row of 7', () => {
    board = placeRow(board, 6, 1, 0, 7);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].score).toBe(119);
  });

  // Vertical
  it('finds a vertical line of 3', () => {
    board = placeCol(board, 0, 1, 0, 3);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].length).toBe(3);
    expect(lines[0].score).toBe(3);
  });

  it('finds a vertical line of 7', () => {
    board = placeCol(board, 3, 2, 0, 7);
    const lines = findLines(board, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].score).toBe(119);
  });

  // Multiple lines
  it('finds multiple horizontal lines', () => {
    board = placeRow(board, 0, 1, 0, 3);
    board = placeRow(board, 2, 1, 2, 4);
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(2);
  });

  it('finds both horizontal and vertical lines', () => {
    board = placeRow(board, 0, 1, 0, 3);
    board = placeCol(board, 0, 1, 0, 3); // shares (0,0)
    const lines = findLines(board, 1);
    // Should find at least 2 lines (one H, one V)
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  // No lines shorter than 3
  it('does NOT score a line of 1', () => {
    board[3][3] = 1;
    expect(findLines(board, 1)).toHaveLength(0);
  });

  it('does NOT score a line of 2', () => {
    board = placeRow(board, 0, 1, 0, 2);
    expect(findLines(board, 1)).toHaveLength(0);
  });

  // Does not mix players
  it('does not count opponent pieces in a line', () => {
    board = placeRow(board, 0, 1, 0, 2);
    board[0][2] = 2; // opponent piece breaks the line
    board[0][3] = 1;
    const lines = findLines(board, 1);
    expect(lines).toHaveLength(0);
  });

  // Cell references
  it('returns correct cell coordinates for a horizontal line', () => {
    board = placeRow(board, 2, 1, 1, 3); // row 2, cols 1-3
    const lines = findLines(board, 1);
    expect(lines[0].cells).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ]);
  });

  it('returns correct cell coordinates for a vertical line', () => {
    board = placeCol(board, 4, 2, 1, 3); // col 4, rows 1-3
    const lines = findLines(board, 2);
    expect(lines[0].cells).toEqual([
      { row: 1, col: 4 },
      { row: 2, col: 4 },
      { row: 3, col: 4 },
    ]);
  });

  // Isolated lines
  it('does NOT merge two separate 2-piece groups into a line', () => {
    board[0][0] = 1; board[0][1] = 1; // two
    board[0][3] = 1; board[0][4] = 1; // another two (gap at 2)
    expect(findLines(board, 1)).toHaveLength(0);
  });
});

// ─── calculatePlayerScore ─────────────────────────────────────
describe('calculatePlayerScore', () => {
  it('returns 0 for empty board', () => {
    const board = createEmptyBoard();
    expect(calculatePlayerScore(board, 1).total).toBe(0);
  });

  it('calculates correct score for one line of 3', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 3);
    const score = calculatePlayerScore(board, 1);
    expect(score.total).toBe(3);
    expect(score.breakdown[3]).toBe(1);
  });

  it('calculates correct total for multiple lines', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 3); // +3
    board = placeRow(board, 2, 1, 0, 4); // +10
    board = placeCol(board, 6, 1, 0, 5); // +25
    const score = calculatePlayerScore(board, 1);
    expect(score.total).toBe(3 + 10 + 25);
  });

  it('does not include opponent pieces in score', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 3); // player 1 gets 3
    board = placeRow(board, 1, 2, 0, 5); // player 2 gets 25
    const p1Score = calculatePlayerScore(board, 1);
    const p2Score = calculatePlayerScore(board, 2);
    expect(p1Score.total).toBe(3);
    expect(p2Score.total).toBe(25);
  });

  it('breakdown tracks individual line lengths', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 3); // one 3-line
    board = placeRow(board, 2, 1, 0, 3); // another 3-line
    board = placeRow(board, 4, 1, 0, 4); // one 4-line
    const score = calculatePlayerScore(board, 1);
    expect(score.breakdown[3]).toBe(2);
    expect(score.breakdown[4]).toBe(1);
    expect(score.total).toBe(3 + 3 + 10);
  });
});

// ─── calculateGameResult ──────────────────────────────────────
describe('calculateGameResult', () => {
  it('correctly identifies player 1 as winner', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 7); // P1: 119
    board = placeRow(board, 1, 2, 0, 3); // P2: 3
    const result = calculateGameResult(board);
    expect(result.winner).toBe(1);
  });

  it('correctly identifies player 2 as winner', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 2, 0, 7); // P2: 119
    board = placeRow(board, 1, 1, 0, 3); // P1: 3
    const result = calculateGameResult(board);
    expect(result.winner).toBe(2);
  });

  it('correctly identifies a draw', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 3); // P1: 3
    board = placeRow(board, 1, 2, 0, 3); // P2: 3
    const result = calculateGameResult(board);
    expect(result.winner).toBe('draw');
  });

  it('returns both player scores', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 4); // P1: 10
    board = placeRow(board, 1, 2, 0, 3); // P2: 3
    const result = calculateGameResult(board);
    expect(result.scores[0].total).toBe(10);
    expect(result.scores[1].total).toBe(3);
  });

  it('includes winning lines in result', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 5); // P1 wins
    board = placeRow(board, 1, 2, 0, 3);
    const result = calculateGameResult(board);
    expect(result.winningLines.length).toBeGreaterThan(0);
  });
});

// ─── getEmptyCells ────────────────────────────────────────────
describe('getEmptyCells', () => {
  it('returns 49 cells for empty board', () => {
    const board = createEmptyBoard();
    expect(getEmptyCells(board)).toHaveLength(49);
  });

  it('returns fewer cells after placing pieces', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    board[1][1] = 2;
    expect(getEmptyCells(board)).toHaveLength(47);
  });

  it('returns 0 cells for full board', () => {
    const board = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (r + c) % 2 === 0 ? 1 : 2)
    ) as Board;
    expect(getEmptyCells(board)).toHaveLength(0);
  });

  it('returns correct coordinates', () => {
    const board = createEmptyBoard();
    board[0][0] = 1; // fill (0,0)
    const cells = getEmptyCells(board);
    expect(cells.some(c => c.row === 0 && c.col === 0)).toBe(false);
    expect(cells.some(c => c.row === 0 && c.col === 1)).toBe(true);
  });
});

// ─── isBoardFull ──────────────────────────────────────────────
describe('isBoardFull', () => {
  it('returns false for empty board', () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false);
  });

  it('returns false if one cell is empty', () => {
    const board = Array.from({ length: 7 }, () =>
      Array(7).fill(1)
    ) as Board;
    board[6][6] = 0;
    expect(isBoardFull(board)).toBe(false);
  });

  it('returns true for completely filled board', () => {
    const board = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (r + c) % 2 === 0 ? 1 : 2)
    ) as Board;
    expect(isBoardFull(board)).toBe(true);
  });
});

// ─── evaluateMove ─────────────────────────────────────────────
describe('evaluateMove', () => {
  it('returns -Infinity for occupied cell', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    expect(evaluateMove(board, 0, 0, 1)).toBe(-Infinity);
  });

  it('returns a higher value for move extending a line', () => {
    let board = createEmptyBoard();
    board = placeRow(board, 0, 1, 0, 2); // two pieces in a row
    const extendScore = evaluateMove(board, 0, 2, 1); // completes a 3-line
    const randomScore = evaluateMove(board, 6, 6, 1); // isolated move
    expect(extendScore).toBeGreaterThan(randomScore);
  });
});

// ─── scoreGainFromMove ────────────────────────────────────────
describe('scoreGainFromMove', () => {
  it('returns 0 for isolated placement (no lines)', () => {
    const board = createEmptyBoard();
    const gain = scoreGainFromMove(board, 3, 3, 1);
    expect(gain).toBe(0); // one piece does not form a 3-line
  });

  it('returns 3 for completing a 3-in-a-row', () => {
    let board = createEmptyBoard();
    board[0][0] = 1;
    board[0][1] = 1;
    const gain = scoreGainFromMove(board, 0, 2, 1);
    expect(gain).toBe(3);
  });

  it('returns 10 for completing a 4-in-a-row (minus prior 3-line score)', () => {
    let board = createEmptyBoard();
    board[0][0] = 1;
    board[0][1] = 1;
    board[0][2] = 1; // already has a 3-line worth 3
    const gain = scoreGainFromMove(board, 0, 3, 1);
    // 4-line = 10 pts, was 3 pts, gain = 7
    expect(gain).toBe(10 - 3);
  });

  it('returns -Infinity for occupied cell', () => {
    const board = createEmptyBoard();
    board[0][0] = 2;
    expect(scoreGainFromMove(board, 0, 0, 1)).toBe(-Infinity);
  });
});

// ─── isWinningCell ────────────────────────────────────────────
describe('isWinningCell', () => {
  it('returns true for a cell in a winning line', () => {
    const lines = [{
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      length: 3, score: 3, player: 1 as Player,
    }];
    expect(isWinningCell(0, 0, lines)).toBe(true);
    expect(isWinningCell(0, 2, lines)).toBe(true);
  });

  it('returns false for a cell not in any winning line', () => {
    const lines = [{
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      length: 3, score: 3, player: 1 as Player,
    }];
    expect(isWinningCell(3, 3, lines)).toBe(false);
  });

  it('returns false when no winning lines', () => {
    expect(isWinningCell(0, 0, [])).toBe(false);
  });
});

// ─── BOARD_SIZE constant ──────────────────────────────────────
describe('BOARD_SIZE', () => {
  it('is 7', () => {
    expect(BOARD_SIZE).toBe(7);
  });
});
