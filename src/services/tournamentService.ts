// ============================================================
// Tournament Service — Tournament Storage (#19)
// ============================================================

import type { TournamentRecord, TournamentPlayer, TournamentFormat } from '@/types/playground';
import type { AILevel } from '@/types/game';

const STORAGE_KEY = 'pah_tum_tournaments_v1';

// ─── CRUD ─────────────────────────────────────────────────────

export function getAllTournaments(): TournamentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSampleTournaments();
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : getSampleTournaments();
  } catch {
    return getSampleTournaments();
  }
}

export function getTournamentById(id: string): TournamentRecord | undefined {
  return getAllTournaments().find(t => t.id === id);
}

export function saveTournament(tournament: TournamentRecord): void {
  const tournaments = getAllTournaments();
  const idx = tournaments.findIndex(t => t.id === tournament.id);
  if (idx >= 0) {
    tournaments[idx] = tournament;
  } else {
    tournaments.unshift(tournament);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

export function deleteTournament(id: string): void {
  const tournaments = getAllTournaments().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

export function createTournament(
  name: string,
  format: TournamentFormat,
  players: TournamentPlayer[]
): TournamentRecord {
  const tournament: TournamentRecord = {
    id: `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    format,
    boardSize: 7,
    createdAt: Date.now(),
    completedAt: null,
    players,
    matches: [],
    champion: null,
    runnerUp: null,
    winnerStrategy: null,
    totalGames: 0,
    statistics: {
      avgMatchDuration: 0,
      highestScore: 0,
      totalMoves: 0,
    },
  };
  saveTournament(tournament);
  return tournament;
}

// ─── Search & Filter ──────────────────────────────────────────

export function searchTournaments(query: string): TournamentRecord[] {
  const q = query.toLowerCase();
  return getAllTournaments().filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.champion ?? '').toLowerCase().includes(q) ||
    t.format.includes(q)
  );
}

export function filterTournaments(
  tournaments: TournamentRecord[],
  filters: {
    format?: TournamentFormat | 'all';
    completed?: boolean;
    winnerStrategy?: AILevel | 'all';
  }
): TournamentRecord[] {
  return tournaments.filter(t => {
    if (filters.format && filters.format !== 'all' && t.format !== filters.format) return false;
    if (filters.completed !== undefined) {
      if (filters.completed && !t.completedAt) return false;
      if (!filters.completed && t.completedAt) return false;
    }
    if (filters.winnerStrategy && filters.winnerStrategy !== 'all' && t.winnerStrategy !== filters.winnerStrategy) return false;
    return true;
  });
}

// ─── Sample Data ──────────────────────────────────────────────

function getSampleTournaments(): TournamentRecord[] {
  const now = Date.now();
  const day = 86400 * 1000;

  const sample1: TournamentRecord = {
    id: 'sample-tournament-1',
    name: 'AI Championship I',
    format: 'round-robin',
    boardSize: 7,
    createdAt: now - 7 * day,
    completedAt: now - 6 * day,
    players: [
      { name: 'Minimax Alpha', strategy: 'minimax' },
      { name: 'Monte Carlo Beta', strategy: 'montecarlo' },
      { name: 'Balanced Gamma', strategy: 'balanced' },
      { name: 'Aggressive Delta', strategy: 'aggressive' },
    ],
    matches: [
      { id: 'm1', round: 1, playerA: 'Minimax Alpha', playerB: 'Monte Carlo Beta', winner: 'Minimax Alpha', gameId: null, scoreA: 45, scoreB: 32 },
      { id: 'm2', round: 1, playerA: 'Balanced Gamma', playerB: 'Aggressive Delta', winner: 'Balanced Gamma', gameId: null, scoreA: 38, scoreB: 29 },
      { id: 'm3', round: 2, playerA: 'Minimax Alpha', playerB: 'Balanced Gamma', winner: 'Minimax Alpha', gameId: null, scoreA: 51, scoreB: 41 },
      { id: 'm4', round: 2, playerA: 'Monte Carlo Beta', playerB: 'Aggressive Delta', winner: 'Monte Carlo Beta', gameId: null, scoreA: 36, scoreB: 28 },
      { id: 'm5', round: 3, playerA: 'Minimax Alpha', playerB: 'Aggressive Delta', winner: 'Minimax Alpha', gameId: null, scoreA: 58, scoreB: 22 },
      { id: 'm6', round: 3, playerA: 'Balanced Gamma', playerB: 'Monte Carlo Beta', winner: 'Balanced Gamma', gameId: null, scoreA: 44, scoreB: 39 },
    ],
    champion: 'Minimax Alpha',
    runnerUp: 'Balanced Gamma',
    winnerStrategy: 'minimax',
    totalGames: 6,
    statistics: {
      avgMatchDuration: 42,
      highestScore: 58,
      totalMoves: 294,
    },
  };

  const sample2: TournamentRecord = {
    id: 'sample-tournament-2',
    name: 'Beginner Cup',
    format: 'elimination',
    boardSize: 7,
    createdAt: now - 2 * day,
    completedAt: now - 1 * day,
    players: [
      { name: 'Random Rook', strategy: 'random' },
      { name: 'Greedy Knight', strategy: 'greedy' },
      { name: 'Defensive Bishop', strategy: 'defensive' },
      { name: 'Human Player', strategy: 'human' },
    ],
    matches: [
      { id: 'bm1', round: 1, playerA: 'Random Rook', playerB: 'Greedy Knight', winner: 'Greedy Knight', gameId: null, scoreA: 12, scoreB: 25 },
      { id: 'bm2', round: 1, playerA: 'Defensive Bishop', playerB: 'Human Player', winner: 'Defensive Bishop', gameId: null, scoreA: 31, scoreB: 19 },
      { id: 'bm3', round: 2, playerA: 'Greedy Knight', playerB: 'Defensive Bishop', winner: 'Defensive Bishop', gameId: null, scoreA: 28, scoreB: 34 },
    ],
    champion: 'Defensive Bishop',
    runnerUp: 'Greedy Knight',
    winnerStrategy: 'defensive',
    totalGames: 3,
    statistics: {
      avgMatchDuration: 31,
      highestScore: 34,
      totalMoves: 147,
    },
  };

  return [sample1, sample2];
}
