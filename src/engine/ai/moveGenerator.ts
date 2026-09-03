// ============================================================
// Move Generator — Single Responsibility Module
// Generates legal moves and performs fast immutable board simulations
// ============================================================

import type { Board, Player } from '@/types/game';
import { getEmptyCells } from '../scoring';

export interface SimulatedMove {
  row: number;
  col: number;
  simulatedBoard: Board;
}

/**
 * Generate all legal moves (empty cells) on the board.
 * Guaranteed never to miss an empty cell.
 */
export function generateLegalMoves(board: Board): Array<{ row: number; col: number }> {
  return getEmptyCells(board);
}

/**
 * Fast immutable board cloning for simulation.
 * Avoids deep object overhead.
 */
export function cloneBoard(board: Board): Board {
  return [
    [...board[0]],
    [...board[1]],
    [...board[2]],
    [...board[3]],
    [...board[4]],
    [...board[5]],
    [...board[6]],
  ] as Board;
}

/**
 * Simulates placing a piece for a player on a cloned board.
 */
export function simulateMove(board: Board, row: number, col: number, player: Player): Board {
  const sim = cloneBoard(board);
  sim[row][col] = player;
  return sim;
}
