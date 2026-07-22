// ============================================================
// Pah Tum Scoring Engine
// Rules are PRESERVED EXACTLY as original game design.
// ============================================================

import type { Board, CellValue, Player, ScoredLine, PlayerScore, GameResult } from '@/types/game';
import { SCORE_TABLE, BOARD_SIZE } from '@/types/game';

/**
 * Find all contiguous horizontal and vertical lines for a given player.
 * Only lines of length >= 3 score points.
 */
export function findLines(board: Board, player: Player): ScoredLine[] {
  const lines: ScoredLine[] = [];

  // Horizontal lines
  for (let row = 0; row < BOARD_SIZE; row++) {
    let start = -1;
    let len = 0;
    for (let col = 0; col <= BOARD_SIZE; col++) {
      const cell: CellValue = col < BOARD_SIZE ? board[row][col] : 0;
      if (cell === player) {
        if (start === -1) start = col;
        len++;
      } else {
        if (len >= 3) {
          const cells = Array.from({ length: len }, (_, i) => ({ row, col: start + i }));
          lines.push({
            cells,
            length: len,
            score: SCORE_TABLE[len] ?? 0,
            player,
          });
        }
        start = -1;
        len = 0;
      }
    }
  }

  // Vertical lines
  for (let col = 0; col < BOARD_SIZE; col++) {
    let start = -1;
    let len = 0;
    for (let row = 0; row <= BOARD_SIZE; row++) {
      const cell: CellValue = row < BOARD_SIZE ? board[row][col] : 0;
      if (cell === player) {
        if (start === -1) start = row;
        len++;
      } else {
        if (len >= 3) {
          const cells = Array.from({ length: len }, (_, i) => ({ row: start + i, col }));
          lines.push({
            cells,
            length: len,
            score: SCORE_TABLE[len] ?? 0,
            player,
          });
        }
        start = -1;
        len = 0;
      }
    }
  }

  return lines;
}

/**
 * Calculate total score for a player.
 */
export function calculatePlayerScore(board: Board, player: Player): PlayerScore {
  const lines = findLines(board, player);
  const breakdown: Record<number, number> = {};
  let total = 0;

  for (const line of lines) {
    total += line.score;
    breakdown[line.length] = (breakdown[line.length] ?? 0) + 1;
  }

  return { player, total, lines, breakdown };
}

/**
 * Calculate the full game result for both players.
 * Called at the end of the game when all 49 cells are filled.
 */
export function calculateGameResult(board: Board): GameResult {
  const score1 = calculatePlayerScore(board, 1);
  const score2 = calculatePlayerScore(board, 2);

  let winner: Player | 'draw' | null = null;
  if (score1.total > score2.total) winner = 1;
  else if (score2.total > score1.total) winner = 2;
  else winner = 'draw';

  const winningLines = winner !== 'draw'
    ? (winner === 1 ? score1.lines : score2.lines)
    : [...score1.lines, ...score2.lines];

  return {
    winner,
    scores: [score1, score2],
    winningLines,
  };
}

/**
 * Get a preview score if a piece were placed at (row, col) for player.
 * Used by AI strategies for greedy evaluation.
 */
export function evaluateMove(
  board: Board,
  row: number,
  col: number,
  player: Player
): number {
  if (board[row][col] !== 0) return -Infinity;
  const newBoard = board.map(r => [...r]) as Board;
  newBoard[row][col] = player;
  const myScore = calculatePlayerScore(newBoard, player).total;
  const oppScore = calculatePlayerScore(newBoard, player === 1 ? 2 : 1).total;
  return myScore - oppScore;
}

/**
 * Get the score DELTA from placing at (row, col) for player.
 * More efficient than full recalculation.
 */
export function scoreGainFromMove(
  board: Board,
  row: number,
  col: number,
  player: Player
): number {
  if (board[row][col] !== 0) return -Infinity;
  const before = calculatePlayerScore(board, player).total;
  const newBoard = board.map(r => [...r]) as Board;
  newBoard[row][col] = player;
  const after = calculatePlayerScore(newBoard, player).total;
  return after - before;
}

/**
 * Get all empty cells on the board.
 */
export function getEmptyCells(board: Board): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * Check if the board is completely filled.
 */
export function isBoardFull(board: Board): boolean {
  return board.every(row => row.every(cell => cell !== 0));
}

/**
 * Create a fresh empty board.
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  ) as Board;
}

/**
 * Check if a cell coordinate is a winning cell.
 */
export function isWinningCell(
  row: number,
  col: number,
  winningLines: ScoredLine[]
): boolean {
  return winningLines.some(line =>
    line.cells.some(c => c.row === row && c.col === col)
  );
}
