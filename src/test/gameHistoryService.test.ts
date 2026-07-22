// ============================================================
// Unit Tests: Game History Service & Stats Aggregator
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGameHistory,
  saveGame,
  getGameById,
  deleteGame,
  clearHistory,
  calculateStats,
} from '@/services/gameHistoryService';
import type { GameConfig, GameResult } from '@/types/game';

const mockConfig: GameConfig = {
  mode: 'human-vs-ai',
  timeControl: 'untimed',
  aiLevel1: 'balanced',
  aiLevel2: 'balanced',
  player1Name: 'Player 1',
  player2Name: 'AI',
};

const mockResult: GameResult = {
  winner: 1,
  scores: [
    { player: 1, total: 38, lines: [], breakdown: { 3: 1, 5: 1 } },
    { player: 2, total: 10, lines: [], breakdown: { 4: 1 } },
  ],
  winningLines: [],
};

beforeEach(() => {
  localStorage.clear();
});

describe('getGameHistory', () => {
  it('returns pre-loaded sample games when local storage is empty', () => {
    const games = getGameHistory();
    expect(games.length).toBeGreaterThan(0);
    expect(games[0].id).toBeDefined();
    expect(games[0].config).toBeDefined();
  });
});

describe('saveGame', () => {
  it('persists a new played game to history', () => {
    const saved = saveGame({
      config: mockConfig,
      moves: [{ row: 0, col: 0, player: 1, moveNumber: 1, timestamp: Date.now() }],
      result: mockResult,
      durationSeconds: 15,
      totalMoves: 1,
    });

    expect(saved.id).toContain('game-');
    expect(saved.config.player1Name).toBe('Player 1');

    const history = getGameHistory();
    expect(history.some(g => g.id === saved.id)).toBe(true);
  });
});

describe('getGameById', () => {
  it('retrieves specific game by id', () => {
    const saved = saveGame({
      config: mockConfig,
      moves: [],
      result: mockResult,
      durationSeconds: 10,
      totalMoves: 0,
    });

    const found = getGameById(saved.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(saved.id);
  });
});

describe('deleteGame', () => {
  it('removes a game from history', () => {
    const saved = saveGame({
      config: mockConfig,
      moves: [],
      result: mockResult,
      durationSeconds: 10,
      totalMoves: 0,
    });

    deleteGame(saved.id);
    expect(getGameById(saved.id)).toBeUndefined();
  });
});

describe('clearHistory', () => {
  it('clears all history from local storage', () => {
    saveGame({
      config: mockConfig,
      moves: [],
      result: mockResult,
      durationSeconds: 10,
      totalMoves: 0,
    });

    clearHistory();
    // After clearing localStorage, calling getGameHistory() loads fresh sample games
    expect(localStorage.getItem('pah_tum_game_history_v1')).toBeNull();
  });
});

describe('calculateStats', () => {
  it('calculates correct aggregate statistics', () => {
    const games = getGameHistory();
    const stats = calculateStats(games);

    expect(stats.totalGames).toBe(games.length);
    expect(stats.totalMoves).toBeGreaterThan(0);
    expect(stats.avgScore).toBeGreaterThanOrEqual(0);
  });

  it('handles empty games array gracefully', () => {
    const stats = calculateStats([]);
    expect(stats.totalGames).toBe(0);
    expect(stats.player1Wins).toBe(0);
    expect(stats.avgScore).toBe(0);
  });
});
