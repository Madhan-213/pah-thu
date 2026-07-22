// ============================================================
// Zustand Game Store — Central State Management
// Handles per-move shot-clock timers & auto-saves completed games
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  GameState,
  GameConfig,
  Board,
  Player,
  Move,
  CellValue,
} from '@/types/game';
import { TIME_CONTROLS } from '@/types/game';
import {
  createEmptyBoard,
  isBoardFull,
  calculateGameResult,
  getEmptyCells,
} from '@/engine/scoring';
import { saveGame } from '@/services/gameHistoryService';
import { RandomStrategy } from '@/engine/strategies';

interface GameStore extends GameState {
  initGame: (config: GameConfig) => void;
  /** Place a piece. bypassAICheck=true lets the AI place even when isAIThinking=true */
  placepiece: (row: number, col: number, bypassAICheck?: boolean) => boolean;
  setTurnTimeLeft: (seconds: number) => void;
  handleTurnTimeout: () => void;
  onTimeout: (player: Player) => void;
  setAIThinking: (thinking: boolean) => void;
  togglePause: () => void;
  resetGame: () => void;
  undoMove: () => void;
}

const defaultConfig: GameConfig = {
  mode: 'human-vs-ai',
  timeControl: 'untimed',
  aiLevel1: 'balanced',
  aiLevel2: 'balanced',
  player1Name: 'Player 1',
  player2Name: 'Player 2',
};

const defaultState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: 1,
  moves: [],
  gamePhase: 'setup',
  result: null,
  config: defaultConfig,
  turnTimeLeft: null,
  timeControlLimit: null,
  isAIThinking: false,
  isPaused: false,
  lastMove: null,
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...defaultState,

    initGame: (config: GameConfig) => {
      const tc = TIME_CONTROLS[config.timeControl];
      set(state => {
        state.board = createEmptyBoard();
        state.currentPlayer = 1;
        state.moves = [];
        state.gamePhase = 'playing';
        state.result = null;
        state.config = config;
        state.turnTimeLeft = tc.seconds;
        state.timeControlLimit = tc.seconds;
        state.isAIThinking = false;
        state.isPaused = false;
        state.lastMove = null;
      });
    },

    placepiece: (row: number, col: number, bypassAICheck = false) => {
      let success = false;
      set(state => {
        if (state.gamePhase !== 'playing' || state.board[row][col] !== 0) return;
        if (!bypassAICheck && state.isAIThinking) return;
        if (!bypassAICheck && state.isPaused) return;

        const player = state.currentPlayer;
        (state.board[row][col] as CellValue) = player as CellValue;

        const move: Move = {
          row,
          col,
          player,
          moveNumber: state.moves.length + 1,
          timestamp: Date.now(),
        };
        state.moves.push(move);
        state.lastMove = move;
        success = true;

        if (isBoardFull(state.board as Board)) {
          state.gamePhase = 'finished';
          state.result = calculateGameResult(state.board as Board);

          // Auto-save game to history
          try {
            saveGame({
              config: state.config,
              moves: [...state.moves],
              result: state.result,
              durationSeconds: Math.max(1, Math.round((Date.now() - (state.moves[0]?.timestamp || Date.now())) / 1000)),
              totalMoves: state.moves.length,
            });
          } catch (e) {
            console.error('Failed to auto-save game:', e);
          }
        } else {
          // Switch turn to next player & RESET per-move timer back to full limit
          state.currentPlayer = (player === 1 ? 2 : 1) as Player;
          state.turnTimeLeft = state.timeControlLimit;
        }
      });
      return success;
    },

    setTurnTimeLeft: (seconds: number) => {
      set(state => {
        state.turnTimeLeft = seconds;
      });
    },

    /**
     * Called when per-move timer reaches 0 (Shot Clock timeout).
     * Automatically places a valid piece for the timed-out player,
     * passes turn to opponent, and resets timer to 15s/30s for next player.
     */
    handleTurnTimeout: () => {
      set(state => {
        if (state.gamePhase !== 'playing') return;

        const empty = getEmptyCells(state.board as Board);
        if (empty.length === 0) return;

        // Make an auto move for non-responding player
        const autoMove = RandomStrategy.makeMove(state.board as Board, state.currentPlayer);
        const player = state.currentPlayer;
        (state.board[autoMove.row][autoMove.col] as CellValue) = player as CellValue;

        const move: Move = {
          row: autoMove.row,
          col: autoMove.col,
          player,
          moveNumber: state.moves.length + 1,
          timestamp: Date.now(),
        };
        state.moves.push(move);
        state.lastMove = move;

        if (isBoardFull(state.board as Board)) {
          state.gamePhase = 'finished';
          state.result = calculateGameResult(state.board as Board);
        } else {
          // Advance turn & RESET timer for next player
          state.currentPlayer = (player === 1 ? 2 : 1) as Player;
          state.turnTimeLeft = state.timeControlLimit;
        }
      });
    },

    onTimeout: (player: Player) => {
      set(state => {
        if (state.gamePhase !== 'playing') return;
        state.gamePhase = 'finished';
        const winner: Player = (player === 1 ? 2 : 1) as Player;
        const s1 = { player: 1 as Player, total: 0, lines: [], breakdown: {} };
        const s2 = { player: 2 as Player, total: 0, lines: [], breakdown: {} };
        state.result = {
          winner,
          scores: [s1, s2],
          winningLines: [],
        };

        try {
          saveGame({
            config: state.config,
            moves: [...state.moves],
            result: state.result,
            durationSeconds: Math.max(1, Math.round((Date.now() - (state.moves[0]?.timestamp || Date.now())) / 1000)),
            totalMoves: state.moves.length,
          });
        } catch (e) {
          console.error('Failed to auto-save game on forfeit:', e);
        }
      });
    },

    setAIThinking: (thinking: boolean) => {
      set(state => { state.isAIThinking = thinking; });
    },

    togglePause: () => {
      set(state => {
        if (state.gamePhase !== 'playing') return;
        state.isPaused = !state.isPaused;
        if (state.isPaused) state.isAIThinking = false;
      });
    },

    resetGame: () => {
      set(() => ({ ...defaultState, board: createEmptyBoard() }));
    },

    undoMove: () => {
      set(state => {
        if (state.moves.length === 0) return;
        const last = state.moves[state.moves.length - 1];
        state.board[last.row][last.col] = 0;
        state.moves.pop();
        state.currentPlayer = last.player;
        state.lastMove = state.moves.length > 0
          ? state.moves[state.moves.length - 1]
          : null;
        state.result = null;
        state.gamePhase = 'playing';
        state.isPaused = false;
        state.turnTimeLeft = state.timeControlLimit;
      });
    },
  }))
);
