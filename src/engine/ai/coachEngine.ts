// ============================================================
// Coach Engine — Post-Game AI Analysis (#16)
// ============================================================

import type { Board, Player, Move } from '@/types/game';
import type { CoachReport, MoveQuality, MoveQualityRating } from '@/types/playground';
import { executeStrategy } from './strategyEngine';
import { calculatePlayerScore, createEmptyBoard } from '../scoring';
import { scoreGainFromMove } from '../scoring';
import { analyzeBoard } from './boardAnalyzer';

function getCellLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + col)}${7 - row}`;
}

function reconstructBoards(moves: Move[]): Board[] {
  const boards: Board[] = [createEmptyBoard()];
  for (const move of moves) {
    const prev = boards[boards.length - 1];
    const next = prev.map(r => [...r]) as Board;
    next[move.row][move.col] = move.player;
    boards.push(next);
  }
  return boards;
}

function getBestMove(board: Board, player: Player): { row: number; col: number; score: number } {
  // Use balanced as the coaching oracle (fast enough for analysis)
  const result = executeStrategy('balanced', board, player);
  const scoreAfter = scoreGainFromMove(board, result.row, result.col, player);
  return { ...result, score: scoreAfter };
}

function rateMove(
  actualGain: number,
  bestGain: number,
  analysis: ReturnType<typeof analyzeBoard>
): MoveQualityRating {
  const delta = bestGain - actualGain;
  if (delta === 0 && actualGain > 0) return 'excellent';
  if (delta === 0) return 'good';
  if (actualGain > 0 && delta <= 3) return 'good';
  if (delta <= 0 && analysis.phase === 'opening') return 'neutral';
  if (delta > 0 && actualGain === 0 && bestGain > 10) return 'missed_opportunity';
  if (delta > 10) return 'critical_mistake';
  if (delta > 3) return 'mistake';
  return 'neutral';
}

export function generateCoachReport(
  gameId: string,
  moves: Move[],
  player1Name: string,
  player2Name: string
): CoachReport {
  if (moves.length === 0) {
    return {
      gameId, player1Name, player2Name,
      bestMove: null, worstMove: null,
      missedOpportunities: [], mistakes: [], criticalMistakes: [], excellentMoves: [],
      defensiveRating: 50, offensiveRating: 50, efficiencyRating: 50,
      suggestions: ['Play more games to generate coaching insights.'],
      improvementTips: ['Start by playing against Greedy AI and understand its patterns.'],
      estimatedSkillLevel: 'beginner',
    };
  }

  const boards = reconstructBoards(moves);
  const moveQualities: MoveQuality[] = [];

  for (let i = 0; i < moves.length; i++) {
    const board = boards[i];
    const move = moves[i];
    const { player } = move;
    const analysis = analyzeBoard(board, player);

    const actualGain = scoreGainFromMove(board, move.row, move.col, player);
    const best = getBestMove(board, player);
    const rating = rateMove(actualGain, best.score, analysis);

    moveQualities.push({
      moveNumber: i + 1,
      move,
      rating,
      bestMove: {
        row: best.row,
        col: best.col,
        label: getCellLabel(best.row, best.col),
      },
      scoreLost: Math.max(0, best.score - actualGain),
      description: buildDescription(rating, actualGain, best.score, move),
    });
  }

  const excellent = moveQualities.filter(m => m.rating === 'excellent');
  const good = moveQualities.filter(m => m.rating === 'good');
  const mistakes = moveQualities.filter(m => m.rating === 'mistake');
  const critical = moveQualities.filter(m => m.rating === 'critical_mistake');
  const missed = moveQualities.filter(m => m.rating === 'missed_opportunity');

  // Ratings (0-100)
  const totalMoves = moveQualities.length;
  const offensiveRating = Math.min(100, Math.round(
    ((excellent.length * 20 + good.length * 10) / Math.max(1, totalMoves)) * 100 / 20
  ));
  const defensiveRating = Math.min(100, Math.round(
    100 - ((critical.length * 15 + mistakes.length * 8) / Math.max(1, totalMoves)) * 100 / 15
  ));
  const efficiencyRating = Math.min(100, Math.round(
    100 - (moveQualities.reduce((s, m) => s + m.scoreLost, 0) / Math.max(1, totalMoves)) * 2
  ));

  const skillLevel = determineSkillLevel(offensiveRating, defensiveRating, efficiencyRating);
  const suggestions = buildSuggestions(excellent, mistakes, critical, missed, skillLevel);
  const tips = buildTips(skillLevel, offensiveRating, defensiveRating);

  const allByScore = [...moveQualities].sort((a, b) => {
    const scoreOrder = { excellent: 4, good: 3, neutral: 2, missed_opportunity: 1, mistake: 0, critical_mistake: -1 };
    return scoreOrder[b.rating] - scoreOrder[a.rating];
  });

  return {
    gameId, player1Name, player2Name,
    bestMove: allByScore[0] ?? null,
    worstMove: allByScore[allByScore.length - 1] ?? null,
    missedOpportunities: missed,
    mistakes,
    criticalMistakes: critical,
    excellentMoves: excellent,
    defensiveRating,
    offensiveRating,
    efficiencyRating,
    suggestions,
    improvementTips: tips,
    estimatedSkillLevel: skillLevel,
  };
}

function buildDescription(
  rating: MoveQualityRating,
  gain: number,
  bestGain: number,
  move: Move
): string {
  const label = getCellLabel(move.row, move.col);
  switch (rating) {
    case 'excellent': return `Excellent! ${label} was the best move (+${gain}pts)`;
    case 'good': return `Good move at ${label} (+${gain}pts)`;
    case 'neutral': return `Neutral move at ${label} — positional play`;
    case 'missed_opportunity': return `Missed +${bestGain}pts opportunity; played ${label} for +${gain}pts`;
    case 'mistake': return `Mistake at ${label} — lost ${bestGain - gain}pts vs best move`;
    case 'critical_mistake': return `Critical mistake! Surrendered ${bestGain - gain}pts vs optimal play`;
    default: return `Move at ${label}`;
  }
}

function determineSkillLevel(off: number, def: number, eff: number): CoachReport['estimatedSkillLevel'] {
  const avg = (off + def + eff) / 3;
  if (avg >= 80) return 'expert';
  if (avg >= 60) return 'advanced';
  if (avg >= 40) return 'intermediate';
  return 'beginner';
}

function buildSuggestions(
  excellent: MoveQuality[],
  mistakes: MoveQuality[],
  critical: MoveQuality[],
  missed: MoveQuality[],
  level: string
): string[] {
  const s: string[] = [];
  if (excellent.length > 0) s.push(`You made ${excellent.length} excellent move${excellent.length > 1 ? 's' : ''} — great pattern recognition!`);
  if (critical.length > 0) s.push(`${critical.length} critical mistake${critical.length > 1 ? 's' : ''} identified — review moves ${critical.map(m => m.moveNumber).join(', ')}`);
  if (missed.length > 0) s.push(`${missed.length} scoring opportunity${missed.length > 1 ? 'ies' : ''} missed — watch for long lines`);
  if (mistakes.length > 0) s.push(`Focus on move accuracy — ${mistakes.length} mistake${mistakes.length > 1 ? 's' : ''} cost points`);
  if (level === 'beginner') s.push('Try the Greedy strategy first to understand basic scoring');
  if (level === 'advanced') s.push('Study Minimax AI decisions to understand deep strategic thinking');
  return s.length > 0 ? s : ['Solid performance! Keep practicing to refine your strategy.'];
}

function buildTips(level: string, off: number, def: number): string[] {
  const tips: string[] = [];
  if (off < def) tips.push('Your defense is stronger than offense — try scoring more proactively');
  if (def < off) tips.push('Your attack is strong but watch for opponent threats in mid-game');
  if (level === 'beginner') tips.push('Focus on completing 3-in-a-row lines before building longer ones');
  if (level === 'intermediate') tips.push('Block opponent 4+ chains aggressively — they score exponentially more');
  if (level === 'advanced') tips.push('Plan 2-3 moves ahead and look for dual-threat setups');
  if (level === 'expert') tips.push('Study Monte Carlo statistics to understand move probabilities deeply');
  tips.push('Use the Strategy Playground to test different approaches safely');
  return tips;
}
