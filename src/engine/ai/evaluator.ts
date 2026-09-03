// ============================================================
// Evaluation Engine — Single Responsibility Module
// Calculates numerical evaluation scores for candidate moves
// ============================================================

import type { Board, Player } from '@/types/game';
import { scoreGainFromMove, calculatePlayerScore } from '../scoring';
import { getCenterControlScore } from './boardAnalyzer';
import { simulateMove } from './moveGenerator';
import type { EvaluatedMove, BoardAnalysis } from './types';

/**
 * Calculates line chain building potential of a move.
 * Rewards extending 2-in-a-row to 3, 3 to 4, 4 to 5, 5 to 6, 6 to 7.
 */
export function calculateChainPotential(
  simBoard: Board,
  player: Player,
  immediateGain: number
): number {
  const scoreData = calculatePlayerScore(simBoard, player);
  let potential = 0;

  scoreData.lines.forEach(line => {
    if (line.length === 3) potential += 4;
    else if (line.length === 4) potential += 12;
    else if (line.length === 5) potential += 30;
    else if (line.length === 6) potential += 70;
    else if (line.length === 7) potential += 150;
  });

  return potential + immediateGain * 3;
}

/**
 * Detailed evaluation of a single candidate move for an active player.
 */
export function evaluateCandidateMove(
  board: Board,
  row: number,
  col: number,
  player: Player,
  analysis: BoardAnalysis
): EvaluatedMove {
  const opponent: Player = player === 1 ? 2 : 1;

  // 1. Immediate personal score gain
  const immediateGain = scoreGainFromMove(board, row, col, player);

  // 2. Opponent threat block (what opponent would score if they took this cell)
  const oppGain = scoreGainFromMove(board, row, col, opponent);
  const threatBlock = oppGain;

  // 3. Simulated board for chain building & center control
  const simBoard = simulateMove(board, row, col, player);
  const chainPotential = calculateChainPotential(simBoard, player, immediateGain);
  const centerScore = getCenterControlScore(row, col);

  // Base weighted score computation
  let totalScore = immediateGain * 10 + threatBlock * 8 + chainPotential * 1.5 + centerScore * 1.2;

  // Endgame boost: prioritize guaranteed points and blocking
  if (analysis.phase === 'endgame') {
    totalScore += immediateGain * 15 + threatBlock * 12;
  }

  // Reason description
  let reason = 'Positional development';
  if (immediateGain >= 119) reason = 'Completed full 7-in-a-row!';
  else if (immediateGain >= 56) reason = 'Completed 6-in-a-row (+56pts)';
  else if (immediateGain >= 25) reason = 'Completed 5-in-a-row (+25pts)';
  else if (immediateGain >= 10) reason = 'Completed 4-in-a-row (+10pts)';
  else if (immediateGain >= 3) reason = 'Formed 3-in-a-row line (+3pts)';
  else if (threatBlock >= 10) reason = `Blocked opponent line (+${threatBlock}pts threat)`;
  else if (centerScore >= 5) reason = 'Secured center grid position';
  else if (chainPotential > 10) reason = 'Building long line chain';

  return {
    row,
    col,
    score: Math.round(totalScore * 100) / 100,
    immediateGain,
    threatBlock,
    chainPotential,
    centerScore,
    reason,
  };
}
