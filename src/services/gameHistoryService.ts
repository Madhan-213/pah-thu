// ============================================================
// Pah Tum — Game History & Analysis Persistence Service
// Manages local game records, statistics, and sample match data.
// ============================================================

import type { GameConfig, GameResult, Move, Player, Board } from '@/types/game';
import { calculatePlayerScore, findLines, createEmptyBoard } from '@/engine/scoring';

export interface RecordedGame {
  id: string;
  timestamp: number;
  date: string;
  config: GameConfig;
  moves: Move[];
  result: GameResult;
  durationSeconds: number;
  totalMoves: number;
}

const STORAGE_KEY = 'pah_tum_game_history_v1';

// ─── SAMPLE MATCH GENERATOR (Loaded on first visit if empty) ──
function generateSampleGames(): RecordedGame[] {
  const now = Date.now();
  const day = 86400 * 1000;

  // Sample 1: Minimax vs MonteCarlo (AI vs AI)
  const moves1: Move[] = [
    { row: 3, col: 3, player: 1, moveNumber: 1, timestamp: now - 3 * day },
    { row: 3, col: 4, player: 2, moveNumber: 2, timestamp: now - 3 * day + 1000 },
    { row: 2, col: 3, player: 1, moveNumber: 3, timestamp: now - 3 * day + 2000 },
    { row: 4, col: 3, player: 2, moveNumber: 4, timestamp: now - 3 * day + 3000 },
    { row: 1, col: 3, player: 1, moveNumber: 5, timestamp: now - 3 * day + 4000 }, // 3-line for P1!
    { row: 3, col: 2, player: 2, moveNumber: 6, timestamp: now - 3 * day + 5000 },
    { row: 0, col: 3, player: 1, moveNumber: 7, timestamp: now - 3 * day + 6000 }, // 4-line for P1!
    { row: 3, col: 5, player: 2, moveNumber: 8, timestamp: now - 3 * day + 7000 }, // 3-line for P2!
    { row: 3, col: 1, player: 1, moveNumber: 9, timestamp: now - 3 * day + 8000 },
    { row: 3, col: 6, player: 2, moveNumber: 10, timestamp: now - 3 * day + 9000 }, // 4-line for P2!
  ];

  // Build board for sample 1
  const board1: Board = createEmptyBoard();
  moves1.forEach(m => { board1[m.row][m.col] = m.player; });
  const p1Score1 = calculatePlayerScore(board1, 1);
  const p2Score1 = calculatePlayerScore(board1, 2);

  const sample1: RecordedGame = {
    id: 'sample-match-1',
    timestamp: now - 3 * day,
    date: new Date(now - 3 * day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    config: {
      mode: 'ai-vs-ai',
      timeControl: 'blitz-3',
      aiLevel1: 'minimax',
      aiLevel2: 'montecarlo',
      player1Name: 'Red AI (Minimax)',
      player2Name: 'Dark AI (Monte Carlo)',
    },
    moves: moves1,
    result: {
      winner: 1,
      scores: [p1Score1, p2Score1],
      winningLines: [...p1Score1.lines, ...p2Score1.lines],
    },
    durationSeconds: 45,
    totalMoves: moves1.length,
  };

  // Sample 2: Human vs Balanced AI
  const moves2: Move[] = [
    { row: 0, col: 0, player: 1, moveNumber: 1, timestamp: now - 1 * day },
    { row: 0, col: 1, player: 2, moveNumber: 2, timestamp: now - 1 * day + 1000 },
    { row: 1, col: 0, player: 1, moveNumber: 3, timestamp: now - 1 * day + 2000 },
    { row: 0, col: 2, player: 2, moveNumber: 4, timestamp: now - 1 * day + 3000 },
    { row: 2, col: 0, player: 1, moveNumber: 5, timestamp: now - 1 * day + 4000 }, // P1 3-line!
    { row: 0, col: 3, player: 2, moveNumber: 6, timestamp: now - 1 * day + 5000 }, // P2 3-line!
    { row: 3, col: 0, player: 1, moveNumber: 7, timestamp: now - 1 * day + 6000 }, // P1 4-line!
  ];

  const board2: Board = createEmptyBoard();
  moves2.forEach(m => { board2[m.row][m.col] = m.player; });
  const p1Score2 = calculatePlayerScore(board2, 1);
  const p2Score2 = calculatePlayerScore(board2, 2);

  const sample2: RecordedGame = {
    id: 'sample-match-2',
    timestamp: now - 1 * day,
    date: new Date(now - 1 * day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    config: {
      mode: 'human-vs-ai',
      timeControl: 'bullet-30',
      aiLevel1: 'balanced',
      aiLevel2: 'balanced',
      player1Name: 'Alex (You)',
      player2Name: 'Balanced AI',
    },
    moves: moves2,
    result: {
      winner: 1,
      scores: [p1Score2, p2Score2],
      winningLines: [...p1Score2.lines, ...p2Score2.lines],
    },
    durationSeconds: 28,
    totalMoves: moves2.length,
  };

  return [sample1, sample2];
}

// ─── API FUNCTIONS ────────────────────────────────────────────

export function getGameHistory(): RecordedGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const samples = generateSampleGames();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
      return samples;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load game history:', err);
    return generateSampleGames();
  }
}

export function saveGame(game: Omit<RecordedGame, 'id' | 'timestamp' | 'date'>): RecordedGame {
  const history = getGameHistory();
  const now = Date.now();
  const recorded: RecordedGame = {
    ...game,
    id: `game-${now}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
    date: new Date(now).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };

  const updated = [recorded, ...history];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save game history:', err);
  }
  return recorded;
}

export function getGameById(id: string): RecordedGame | undefined {
  const history = getGameHistory();
  return history.find(g => g.id === id);
}

export function deleteGame(id: string): void {
  const history = getGameHistory();
  const updated = history.filter(g => g.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete game:', err);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

// ─── STATS AGGREGATOR ─────────────────────────────────────────

export interface OverallStats {
  totalGames: number;
  totalMoves: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  avgScore: number;
  highestScore: number;
  favoriteMode: string;
  mostUsedAI: string;
}

export function calculateStats(games: RecordedGame[]): OverallStats {
  if (games.length === 0) {
    return {
      totalGames: 0,
      totalMoves: 0,
      player1Wins: 0,
      player2Wins: 0,
      draws: 0,
      avgScore: 0,
      highestScore: 0,
      favoriteMode: 'None',
      mostUsedAI: 'None',
    };
  }

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let totalScoreSum = 0;
  let highest = 0;
  let totalMovesSum = 0;

  const modeCounts: Record<string, number> = {};
  const aiCounts: Record<string, number> = {};

  games.forEach(g => {
    totalMovesSum += g.totalMoves;
    if (g.result.winner === 1) p1Wins++;
    else if (g.result.winner === 2) p2Wins++;
    else draws++;

    const s1 = g.result.scores[0]?.total ?? 0;
    const s2 = g.result.scores[1]?.total ?? 0;
    totalScoreSum += s1 + s2;
    highest = Math.max(highest, s1, s2);

    modeCounts[g.config.mode] = (modeCounts[g.config.mode] || 0) + 1;
    if (g.config.mode === 'human-vs-ai' || g.config.mode === 'ai-vs-ai') {
      aiCounts[g.config.aiLevel1] = (aiCounts[g.config.aiLevel1] || 0) + 1;
      aiCounts[g.config.aiLevel2] = (aiCounts[g.config.aiLevel2] || 0) + 1;
    }
  });

  const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'human-vs-ai';
  const mostUsedAI = Object.entries(aiCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'balanced';

  return {
    totalGames: games.length,
    totalMoves: totalMovesSum,
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    draws,
    avgScore: Math.round(totalScoreSum / (games.length * 2)),
    highestScore: highest,
    favoriteMode: favoriteMode.replace(/-/g, ' '),
    mostUsedAI: mostUsedAI,
  };
}
