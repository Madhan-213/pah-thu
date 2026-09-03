// ============================================================
// Board Analyzer — Single Responsibility Module
// Analyzes empty cells, center control, line chains, game phase & threats
// ============================================================

import type { Board, Player } from '@/types/game';
import { BOARD_SIZE } from '@/types/game';
import type { BoardAnalysis, GamePhase } from './types';
import {
  getEmptyCells,
  calculatePlayerScore,
  scoreGainFromMove,
} from '../scoring';

/** Distance to center of 7x7 board (cell 3,3) */
export function getCenterDistance(row: number, col: number): number {
  return Math.abs(row - 3) + Math.abs(col - 3);
}

/** Center control score (0-6, highest at center [3,3]) */
export function getCenterControlScore(row: number, col: number): number {
  const dist = getCenterDistance(row, col);
  return Math.max(0, 6 - dist);
}

/** Determine game phase based on empty cell count */
export function getGamePhase(emptyCount: number): GamePhase {
  if (emptyCount < 12) return 'endgame';
  if (emptyCount >= 40) return 'opening';
  return 'midgame';
}

/**
 * Finds the maximum immediate score the opponent could gain on their next move.
 */
export function getMaxOpponentThreat(board: Board, opponent: Player): number {
  const empty = getEmptyCells(board);
  let maxThreat = 0;

  for (const cell of empty) {
    const gain = scoreGainFromMove(board, cell.row, cell.col, opponent);
    if (gain > maxThreat) {
      maxThreat = gain;
    }
  }

  return maxThreat;
}

/**
 * Complete board analysis.
 */
export function analyzeBoard(board: Board, activePlayer: Player): BoardAnalysis {
  const empty = getEmptyCells(board);
  const emptyCount = empty.length;
  const opponent: Player = activePlayer === 1 ? 2 : 1;

  const p1Score = calculatePlayerScore(board, 1);
  const p2Score = calculatePlayerScore(board, 2);

  const phase = getGamePhase(emptyCount);
  const maxThreat = getMaxOpponentThreat(board, opponent);

  return {
    emptyCells: empty,
    emptyCount,
    phase,
    player1Score: p1Score.total,
    player2Score: p2Score.total,
    player1Chains: p1Score.breakdown,
    player2Chains: p2Score.breakdown,
    maxOpponentThreat: maxThreat,
  };
}
