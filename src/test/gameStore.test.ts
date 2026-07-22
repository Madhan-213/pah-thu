// ============================================================
// Unit Tests: Zustand Game Store
// Tests state management, transitions, per-move timer, and store actions.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import type { GameConfig } from '@/types/game';

// ─── Helpers ─────────────────────────────────────────────────
const defaultConfig: GameConfig = {
  mode: 'human-vs-human',
  timeControl: 'untimed',
  aiLevel1: 'balanced',
  aiLevel2: 'balanced',
  player1Name: 'Alice',
  player2Name: 'Bob',
};

const timedConfig: GameConfig = {
  ...defaultConfig,
  timeControl: 'blitz-3', // 180s per move
};

function initAndGet(config: GameConfig = defaultConfig) {
  useGameStore.getState().initGame(config);
  return useGameStore.getState();
}

// ─── Reset before each test ───────────────────────────────────
beforeEach(() => {
  useGameStore.getState().resetGame();
});

// ─── Initial state ────────────────────────────────────────────
describe('Initial state after resetGame', () => {
  it('gamePhase is "setup"', () => {
    expect(useGameStore.getState().gamePhase).toBe('setup');
  });

  it('board is 7×7 with all zeros', () => {
    const { board } = useGameStore.getState();
    expect(board.length).toBe(7);
    board.forEach(row => {
      expect(row.length).toBe(7);
      row.forEach(cell => expect(cell).toBe(0));
    });
  });

  it('currentPlayer is 1', () => {
    expect(useGameStore.getState().currentPlayer).toBe(1);
  });

  it('moves is empty', () => {
    expect(useGameStore.getState().moves).toHaveLength(0);
  });

  it('result is null', () => {
    expect(useGameStore.getState().result).toBeNull();
  });

  it('isAIThinking is false', () => {
    expect(useGameStore.getState().isAIThinking).toBe(false);
  });

  it('lastMove is null', () => {
    expect(useGameStore.getState().lastMove).toBeNull();
  });
});

// ─── initGame ────────────────────────────────────────────────
describe('initGame', () => {
  it('sets gamePhase to "playing"', () => {
    initAndGet();
    expect(useGameStore.getState().gamePhase).toBe('playing');
  });

  it('resets board to all zeros', () => {
    initAndGet();
    const { board } = useGameStore.getState();
    board.forEach(row => row.forEach(cell => expect(cell).toBe(0)));
  });

  it('sets currentPlayer to 1', () => {
    initAndGet();
    expect(useGameStore.getState().currentPlayer).toBe(1);
  });

  it('stores the config', () => {
    initAndGet(defaultConfig);
    expect(useGameStore.getState().config.player1Name).toBe('Alice');
    expect(useGameStore.getState().config.player2Name).toBe('Bob');
  });

  it('sets turnTimeLeft to null for untimed game', () => {
    initAndGet(defaultConfig);
    expect(useGameStore.getState().turnTimeLeft).toBeNull();
  });

  it('sets turnTimeLeft to correct seconds for timed game (blitz-3 = 180s per move)', () => {
    initAndGet(timedConfig);
    expect(useGameStore.getState().turnTimeLeft).toBe(180);
    expect(useGameStore.getState().timeControlLimit).toBe(180);
  });

  it('clears moves array', () => {
    initAndGet();
    useGameStore.getState().placepiece(0, 0);
    initAndGet();
    expect(useGameStore.getState().moves).toHaveLength(0);
  });

  it('clears result', () => {
    initAndGet();
    expect(useGameStore.getState().result).toBeNull();
  });
});

// ─── placepiece & Per-Move Timer Reset ─────────────────────────
describe('placepiece', () => {
  beforeEach(() => initAndGet());

  it('places a piece on an empty cell', () => {
    useGameStore.getState().placepiece(0, 0);
    expect(useGameStore.getState().board[0][0]).toBe(1);
  });

  it('returns true on successful placement', () => {
    const result = useGameStore.getState().placepiece(0, 0);
    expect(result).toBe(true);
  });

  it('switches currentPlayer after placement', () => {
    useGameStore.getState().placepiece(0, 0);
    expect(useGameStore.getState().currentPlayer).toBe(2);
  });

  it('resets turnTimeLeft to timeControlLimit after placement', () => {
    initAndGet(timedConfig);
    useGameStore.getState().setTurnTimeLeft(5); // reduced to 5s
    useGameStore.getState().placepiece(0, 0);   // P1 moves -> P2 turn
    expect(useGameStore.getState().turnTimeLeft).toBe(180); // reset back to 180s for P2
  });

  it('switches back to player 1 after player 2 places', () => {
    useGameStore.getState().placepiece(0, 0);
    useGameStore.getState().placepiece(0, 1);
    expect(useGameStore.getState().currentPlayer).toBe(1);
  });

  it('adds to moves array', () => {
    useGameStore.getState().placepiece(3, 3);
    expect(useGameStore.getState().moves).toHaveLength(1);
    expect(useGameStore.getState().moves[0].row).toBe(3);
    expect(useGameStore.getState().moves[0].col).toBe(3);
  });

  it('move has correct player, row, col, moveNumber', () => {
    useGameStore.getState().placepiece(2, 4);
    const move = useGameStore.getState().moves[0];
    expect(move.player).toBe(1);
    expect(move.row).toBe(2);
    expect(move.col).toBe(4);
    expect(move.moveNumber).toBe(1);
  });

  it('increments moveNumber correctly', () => {
    useGameStore.getState().placepiece(0, 0);
    useGameStore.getState().placepiece(0, 1);
    useGameStore.getState().placepiece(0, 2);
    const moves = useGameStore.getState().moves;
    expect(moves[0].moveNumber).toBe(1);
    expect(moves[1].moveNumber).toBe(2);
    expect(moves[2].moveNumber).toBe(3);
  });

  it('sets lastMove correctly', () => {
    useGameStore.getState().placepiece(5, 6);
    expect(useGameStore.getState().lastMove?.row).toBe(5);
    expect(useGameStore.getState().lastMove?.col).toBe(6);
  });

  it('does NOT place on an already occupied cell', () => {
    useGameStore.getState().placepiece(0, 0); // player 1
    const result = useGameStore.getState().placepiece(0, 0); // player 2 tries same cell
    expect(result).toBe(false);
    expect(useGameStore.getState().board[0][0]).toBe(1); // still player 1's piece
    expect(useGameStore.getState().moves).toHaveLength(1);
  });

  it('returns false and does not change state when game is in "setup"', () => {
    useGameStore.getState().resetGame(); // back to setup
    const result = useGameStore.getState().placepiece(0, 0);
    expect(result).toBe(false);
    expect(useGameStore.getState().board[0][0]).toBe(0);
  });

  it('human is blocked when isAIThinking=true (bypassAICheck=false)', () => {
    useGameStore.getState().setAIThinking(true);
    const result = useGameStore.getState().placepiece(0, 0, false);
    expect(result).toBe(false);
  });

  it('AI can place when isAIThinking=true (bypassAICheck=true)', () => {
    useGameStore.getState().setAIThinking(true);
    const result = useGameStore.getState().placepiece(0, 0, true);
    expect(result).toBe(true);
    expect(useGameStore.getState().board[0][0]).toBe(1);
  });

  it('game finishes when all 49 cells filled', () => {
    initAndGet();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        useGameStore.getState().placepiece(r, c, true);
      }
    }
    expect(useGameStore.getState().gamePhase).toBe('finished');
    expect(useGameStore.getState().result).not.toBeNull();
  });
});

// ─── Per-Move Timer & handleTurnTimeout ───────────────────────
describe('Per-Move Shot Clock Timer & handleTurnTimeout', () => {
  it('setTurnTimeLeft updates remaining turn seconds', () => {
    initAndGet(timedConfig);
    useGameStore.getState().setTurnTimeLeft(12);
    expect(useGameStore.getState().turnTimeLeft).toBe(12);
  });

  it('handleTurnTimeout auto-places a piece and switches turn to opponent', () => {
    initAndGet(timedConfig);
    expect(useGameStore.getState().currentPlayer).toBe(1);

    // Player 1 doesn't move -> turn timer hits 0 -> handleTurnTimeout called
    useGameStore.getState().handleTurnTimeout();

    // Player 1 gets auto-placed move, turn passes to Player 2
    expect(useGameStore.getState().moves).toHaveLength(1);
    expect(useGameStore.getState().moves[0].player).toBe(1);
    expect(useGameStore.getState().currentPlayer).toBe(2);
    expect(useGameStore.getState().turnTimeLeft).toBe(180); // Reset for Player 2
  });
});

// ─── setAIThinking ────────────────────────────────────────────
describe('setAIThinking', () => {
  it('sets isAIThinking to true', () => {
    initAndGet();
    useGameStore.getState().setAIThinking(true);
    expect(useGameStore.getState().isAIThinking).toBe(true);
  });

  it('sets isAIThinking back to false', () => {
    initAndGet();
    useGameStore.getState().setAIThinking(true);
    useGameStore.getState().setAIThinking(false);
    expect(useGameStore.getState().isAIThinking).toBe(false);
  });
});

// ─── onTimeout (Forfeit) ──────────────────────────────────────
describe('onTimeout (Forfeit)', () => {
  beforeEach(() => initAndGet());

  it('sets gamePhase to "finished"', () => {
    useGameStore.getState().onTimeout(1);
    expect(useGameStore.getState().gamePhase).toBe('finished');
  });

  it('player 1 forfeit => player 2 wins', () => {
    useGameStore.getState().onTimeout(1);
    expect(useGameStore.getState().result?.winner).toBe(2);
  });

  it('player 2 forfeit => player 1 wins', () => {
    useGameStore.getState().onTimeout(2);
    expect(useGameStore.getState().result?.winner).toBe(1);
  });
});

// ─── undoMove ─────────────────────────────────────────────────
describe('undoMove', () => {
  beforeEach(() => initAndGet());

  it('removes last placed piece from board', () => {
    useGameStore.getState().placepiece(3, 3);
    useGameStore.getState().undoMove();
    expect(useGameStore.getState().board[3][3]).toBe(0);
  });

  it('reduces moves array length by 1', () => {
    useGameStore.getState().placepiece(0, 0);
    useGameStore.getState().placepiece(0, 1);
    useGameStore.getState().undoMove();
    expect(useGameStore.getState().moves).toHaveLength(1);
  });

  it('reverts currentPlayer back to the player who placed', () => {
    useGameStore.getState().placepiece(0, 0); // player 1 → now player 2's turn
    useGameStore.getState().undoMove();
    expect(useGameStore.getState().currentPlayer).toBe(1); // back to player 1
  });

  it('resets turnTimeLeft back to timeControlLimit', () => {
    initAndGet(timedConfig);
    useGameStore.getState().placepiece(0, 0);
    useGameStore.getState().setTurnTimeLeft(50);
    useGameStore.getState().undoMove();
    expect(useGameStore.getState().turnTimeLeft).toBe(180);
  });
});
