// ============================================================
// Comparison Engine — Strategy vs Strategy Analysis (#14)
// ============================================================

import type { Board, Player, AILevel } from '@/types/game';
import type { ComparisonResult, HeatMapData } from '@/types/playground';
import { executeStrategy } from './strategyEngine';
import { calculateGameResult, createEmptyBoard, isBoardFull } from '../scoring';
import { scoreGainFromMove } from '../scoring';

const BOARD_SIZE = 7;

function getCellLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + col)}${7 - row}`;
}

interface SimulatedGame {
  winner: 1 | 2 | 'draw';
  scoreA: number;
  scoreB: number;
  thinkingMsA: number;
  thinkingMsB: number;
  moves: Array<{ row: number; col: number; player: Player }>;
  moveDistA: number[]; // 49-length flat move distribution
  moveDistB: number[];
}

function playSimulatedGame(
  strategyA: AILevel,
  strategyB: AILevel
): SimulatedGame {
  const board: Board = createEmptyBoard();
  let currentPlayer: Player = 1;
  const moves: Array<{ row: number; col: number; player: Player }> = [];
  let totalTimeA = 0;
  let totalMovesA = 0;
  let totalTimeB = 0;
  let totalMovesB = 0;
  const moveDistA = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
  const moveDistB = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);

  while (!isBoardFull(board)) {
    const isA = currentPlayer === 1;
    const strategy = isA ? strategyA : strategyB;
    const start = performance.now();

    const move = executeStrategy(strategy, board, currentPlayer);
    const elapsed = performance.now() - start;

    if (isA) { totalTimeA += elapsed; totalMovesA++; }
    else { totalTimeB += elapsed; totalMovesB++; }

    if (board[move.row][move.col] !== 0) break; // safety guard
    board[move.row][move.col] = currentPlayer;

    const idx = move.row * BOARD_SIZE + move.col;
    if (isA) moveDistA[idx]++;
    else moveDistB[idx]++;

    moves.push({ ...move, player: currentPlayer });
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }

  const result = calculateGameResult(board);
  const scoreA = result.scores[0]?.total ?? 0;
  const scoreB = result.scores[1]?.total ?? 0;
  const winner = result.winner === 'draw' ? 'draw' : result.winner as 1 | 2;

  return {
    winner,
    scoreA,
    scoreB,
    thinkingMsA: totalMovesA > 0 ? totalTimeA / totalMovesA : 0,
    thinkingMsB: totalMovesB > 0 ? totalTimeB / totalMovesB : 0,
    moves,
    moveDistA,
    moveDistB,
  };
}

function buildHeatMap(distribution: number[], player: Player, label: string): HeatMapData {
  const max = Math.max(...distribution, 1);
  const cells: number[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push(Math.round((distribution[r * BOARD_SIZE + c] / max) * 100));
    }
    cells.push(row);
  }
  return { cells, player, label };
}

function buildRadarData(
  nameA: string,
  nameB: string,
  winsA: number,
  winsB: number,
  gamesPlayed: number,
  avgTimeA: number,
  avgTimeB: number,
  avgScoreA: number,
  avgScoreB: number,
  openingA: number,
  openingB: number,
  endgameA: number,
  endgameB: number
) {
  const maxTime = Math.max(avgTimeA, avgTimeB, 1);
  const maxScore = Math.max(avgScoreA, avgScoreB, 1);

  return {
    labels: ['Win Rate', 'Speed', 'Avg Score', 'Opening', 'Endgame', 'Consistency'],
    valuesA: [
      Math.round((winsA / gamesPlayed) * 100),
      Math.round((1 - avgTimeA / (maxTime + 1)) * 100),
      Math.round((avgScoreA / (maxScore + 1)) * 100),
      openingA,
      endgameA,
      75, // Placeholder consistency
    ],
    valuesB: [
      Math.round((winsB / gamesPlayed) * 100),
      Math.round((1 - avgTimeB / (maxTime + 1)) * 100),
      Math.round((avgScoreB / (maxScore + 1)) * 100),
      openingB,
      endgameB,
      70, // Placeholder consistency
    ],
    labelA: nameA,
    labelB: nameB,
  };
}

function buildStrengths(name: string, winRate: number, speed: number, avgScore: number): string[] {
  const strengths: string[] = [];
  if (winRate >= 60) strengths.push(`${name} has a dominant win rate of ${winRate}%`);
  if (speed < 2) strengths.push(`${name} makes lightning-fast decisions (<2ms)`);
  if (avgScore >= 40) strengths.push(`${name} consistently achieves high scores (avg ${Math.round(avgScore)}pts)`);
  if (strengths.length === 0) strengths.push(`${name} provides competitive gameplay`);
  return strengths;
}

function buildWeaknesses(name: string, winRate: number, speed: number): string[] {
  const w: string[] = [];
  if (winRate < 40) w.push(`${name} struggles to win consistently`);
  if (speed > 50) w.push(`${name} takes longer to decide (${Math.round(speed)}ms avg)`);
  if (w.length === 0) w.push(`${name} has no glaring weaknesses in this matchup`);
  return w;
}

export async function runStrategyComparison(
  strategyA: AILevel,
  strategyB: AILevel,
  numGames = 10,
  onProgress?: (done: number, total: number) => void
): Promise<ComparisonResult> {
  const nameA = strategyA.charAt(0).toUpperCase() + strategyA.slice(1);
  const nameB = strategyB.charAt(0).toUpperCase() + strategyB.slice(1);

  let winsA = 0, winsB = 0, draws = 0;
  let totalScoreA = 0, totalScoreB = 0;
  let totalTimeA = 0, totalTimeB = 0;
  const scoreHistoryA: number[] = [];
  const scoreHistoryB: number[] = [];
  const distA = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
  const distB = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
  let openingWinsA = 0, endgameWinsA = 0;
  let openingWinsB = 0, endgameWinsB = 0;

  for (let i = 0; i < numGames; i++) {
    // Alternate who plays as player 1
    const aIsP1 = i % 2 === 0;
    const sA = aIsP1 ? strategyA : strategyB;
    const sB = aIsP1 ? strategyB : strategyA;

    const game = playSimulatedGame(sA, sB);

    const winnerIsA = aIsP1 ? game.winner === 1 : game.winner === 2;
    const winnerIsB = aIsP1 ? game.winner === 2 : game.winner === 1;

    if (winnerIsA) winsA++;
    else if (winnerIsB) winsB++;
    else draws++;

    totalScoreA += aIsP1 ? game.scoreA : game.scoreB;
    totalScoreB += aIsP1 ? game.scoreB : game.scoreA;
    totalTimeA += aIsP1 ? game.thinkingMsA : game.thinkingMsB;
    totalTimeB += aIsP1 ? game.thinkingMsB : game.thinkingMsA;

    scoreHistoryA.push(aIsP1 ? game.scoreA : game.scoreB);
    scoreHistoryB.push(aIsP1 ? game.scoreB : game.scoreA);

    // Accumulate distributions
    const dA = aIsP1 ? game.moveDistA : game.moveDistB;
    const dB = aIsP1 ? game.moveDistB : game.moveDistA;
    dA.forEach((v, idx) => { distA[idx] += v; });
    dB.forEach((v, idx) => { distB[idx] += v; });

    // Opening/endgame analysis (simplified)
    const moveCountA = game.moves.filter(m => (aIsP1 ? m.player === 1 : m.player === 2)).length;
    const halfPoint = Math.floor(moveCountA / 2);
    if (winnerIsA) {
      if (i < numGames / 2) openingWinsA++;
      else endgameWinsA++;
    }
    if (winnerIsB) {
      if (i < numGames / 2) openingWinsB++;
      else endgameWinsB++;
    }

    onProgress?.(i + 1, numGames);

    // Yield to avoid blocking UI
    await new Promise(r => setTimeout(r, 0));
  }

  const avgScoreA = totalScoreA / numGames;
  const avgScoreB = totalScoreB / numGames;
  const avgTimeA = totalTimeA / numGames;
  const avgTimeB = totalTimeB / numGames;
  const winRateA = Math.round((winsA / numGames) * 100);
  const winRateB = Math.round((winsB / numGames) * 100);
  const openingTotal = Math.max(1, Math.floor(numGames / 2));
  const openingWinRateA = Math.round((openingWinsA / openingTotal) * 100);
  const openingWinRateB = Math.round((openingWinsB / openingTotal) * 100);
  const endgameTotal = numGames - openingTotal;
  const endgameWinRateA = Math.round((endgameWinsA / Math.max(1, endgameTotal)) * 100);
  const endgameWinRateB = Math.round((endgameWinsB / Math.max(1, endgameTotal)) * 100);

  const heatMapA = buildHeatMap(distA, 1, nameA);
  const heatMapB = buildHeatMap(distB, 2, nameB);

  const radarData = buildRadarData(
    nameA, nameB, winsA, winsB, numGames,
    avgTimeA, avgTimeB, avgScoreA, avgScoreB,
    openingWinRateA, openingWinRateB, endgameWinRateA, endgameWinRateB
  );

  const recommendation = winsA > winsB
    ? `${nameA} outperforms ${nameB} with a ${winRateA}% win rate. Recommended for tournament play.`
    : winsB > winsA
    ? `${nameB} outperforms ${nameA} with a ${winRateB}% win rate. Recommended for tournament play.`
    : `Both strategies are evenly matched! Choose based on your preferred play style.`;

  return {
    strategyAName: nameA,
    strategyBName: nameB,
    gamesPlayed: numGames,
    winsA, winsB, draws,
    winRateA, winRateB,
    avgScoreA: Math.round(avgScoreA),
    avgScoreB: Math.round(avgScoreB),
    avgThinkingMsA: Math.round(avgTimeA * 10) / 10,
    avgThinkingMsB: Math.round(avgTimeB * 10) / 10,
    openingWinRateA, openingWinRateB,
    endgameWinRateA, endgameWinRateB,
    moveAccuracyA: winRateA,
    moveAccuracyB: winRateB,
    moveDistributionA: distA,
    moveDistributionB: distB,
    heatMapA, heatMapB,
    scoreHistoryA, scoreHistoryB,
    radarData,
    strengthsA: buildStrengths(nameA, winRateA, avgTimeA, avgScoreA),
    weaknessesA: buildWeaknesses(nameA, winRateA, avgTimeA),
    strengthsB: buildStrengths(nameB, winRateB, avgTimeB, avgScoreB),
    weaknessesB: buildWeaknesses(nameB, winRateB, avgTimeB),
    recommendation,
  };
}
