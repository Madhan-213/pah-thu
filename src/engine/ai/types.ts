// ============================================================
// Pah Tum — AI Engine Types & Data Contracts
// ============================================================

import type { Board, Player, AILevel } from '@/types/game';

export type GamePhase = 'opening' | 'midgame' | 'endgame';

export interface BoardAnalysis {
  emptyCells: Array<{ row: number; col: number }>;
  emptyCount: number;
  phase: GamePhase;
  player1Score: number;
  player2Score: number;
  player1Chains: Record<number, number>; // length -> count
  player2Chains: Record<number, number>;
  maxOpponentThreat: number; // Max immediate points opponent could score on next turn
}

export interface EvaluatedMove {
  row: number;
  col: number;
  score: number;
  immediateGain: number;
  threatBlock: number;
  chainPotential: number;
  centerScore: number;
  reason: string;
}

export interface AIDebugInfo {
  strategyName: string;
  level: AILevel;
  chosenMove: { row: number; col: number; label: string };
  evaluationScore: number;
  topCandidates: EvaluatedMove[];
  thinkingTimeMs: number;
  nodesSearched: number;
  reason: string;
  gamePhase: GamePhase;
}
