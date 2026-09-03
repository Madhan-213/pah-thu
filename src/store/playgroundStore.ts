// ============================================================
// Playground Store — Strategy Playground State (#12)
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Board, Player, GameResult } from '@/types/game';
import type { AILevel } from '@/types/game';
import type {
  PlaygroundConfig, PlaygroundMoveRecord, PlaygroundSession,
  BoardEvaluation, MoveInspection,
} from '@/types/playground';
import { createEmptyBoard, isBoardFull, calculateGameResult, calculatePlayerScore } from '@/engine/scoring';
import { findLines } from '@/engine/scoring';
import { scoreGainFromMove } from '@/engine/scoring';
import { analyzeBoard } from '@/engine/ai/boardAnalyzer';
import { executeStrategy, getLastAIDebugInfo } from '@/engine/ai/strategyEngine';

const BOARD_SIZE = 7;

function getCellLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + col)}${7 - row}`;
}

function computeBoardEval(board: Board): BoardEvaluation {
  const p1 = calculatePlayerScore(board, 1);
  const p2 = calculatePlayerScore(board, 2);
  const filled = board.flat().filter(c => c !== 0).length;
  return {
    player1Score: p1.total,
    player2Score: p2.total,
    scoreDiff: p1.total - p2.total,
    dominance: p1.total > p2.total ? 'player1' : p2.total > p1.total ? 'player2' : 'equal',
    boardFillPercent: Math.round((filled / 49) * 100),
    player1Lines: p1.lines.length,
    player2Lines: p2.lines.length,
  };
}

function computeThreatLevel(
  board: Board,
  player: Player
): MoveInspection['opponentThreatLevel'] {
  const opp: Player = player === 1 ? 2 : 1;
  const analysis = analyzeBoard(board, opp);
  if (analysis.maxOpponentThreat >= 25) return 'critical';
  if (analysis.maxOpponentThreat >= 10) return 'high';
  if (analysis.maxOpponentThreat >= 3) return 'medium';
  return 'low';
}

function computeConnections(
  boardBefore: Board,
  boardAfter: Board,
  row: number,
  col: number,
  player: Player
): {
  createdConnections: Array<{ row: number; col: number }>;
  blockedConnections: Array<{ row: number; col: number }>;
  affectedLines: Array<{ cells: Array<{ row: number; col: number }>; player: Player }>;
} {
  const linesBefore = findLines(boardBefore, player);
  const linesAfter = findLines(boardAfter, player);

  const created = linesAfter
    .filter(la => !linesBefore.some(lb =>
      lb.cells.length === la.cells.length &&
      lb.cells[0].row === la.cells[0].row &&
      lb.cells[0].col === la.cells[0].col
    ))
    .flatMap(l => l.cells);

  const opp: Player = player === 1 ? 2 : 1;
  const oppBefore = findLines(boardBefore, opp);
  const blocked = oppBefore
    .filter(l => l.cells.some(c => c.row === row && c.col === col))
    .flatMap(l => l.cells);

  const affected = [...linesAfter, ...findLines(boardAfter, opp)]
    .filter(l => l.cells.some(c => c.row === row && c.col === col));

  return {
    createdConnections: created,
    blockedConnections: blocked,
    affectedLines: affected.map(l => ({ cells: l.cells, player: l.player })),
  };
}

function buildMoveInspection(
  boardBefore: Board,
  boardAfter: Board,
  row: number,
  col: number,
  player: Player,
  strategyName: string,
  moveNumber: number,
  thinkingTimeMs: number,
  reason: string,
  moveScore: number
): MoveInspection {
  const boardEvaluation = computeBoardEval(boardAfter);
  const opponentThreatLevel = computeThreatLevel(boardAfter, player === 1 ? 2 : 1);
  const { createdConnections, blockedConnections, affectedLines } = computeConnections(
    boardBefore, boardAfter, row, col, player
  );
  const expectedGain = scoreGainFromMove(boardBefore, row, col, player);

  // Potential future moves (top 5 moves for next turn)
  const opp: Player = player === 1 ? 2 : 1;
  const oppAnalysis = analyzeBoard(boardAfter, opp);
  const potentialFutureMoves = oppAnalysis.emptyCells
    .map(c => ({
      row: c.row,
      col: c.col,
      priority: scoreGainFromMove(boardAfter, c.row, c.col, opp),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  return {
    currentPlayer: player,
    strategyName,
    moveNumber,
    chosenCell: getCellLabel(row, col),
    moveScore,
    thinkingTimeMs,
    reason,
    boardEvaluation,
    expectedGain,
    opponentThreatLevel,
    createdConnections,
    blockedConnections,
    affectedLines,
    potentialFutureMoves,
  };
}

// ─── Default Config ───────────────────────────────────────────

const defaultConfig: PlaygroundConfig = {
  mode: 'builtin-vs-builtin',
  player1Name: 'Strategy A',
  player2Name: 'Strategy B',
  aiLevel1: 'balanced',
  aiLevel2: 'minimax',
  customStrategy1Id: null,
  customStrategy2Id: null,
  isStepMode: false,
  autoPlaySpeed: 600,
};

// ─── Store Interface ──────────────────────────────────────────

interface PlaygroundState {
  config: PlaygroundConfig;
  board: Board;
  currentPlayer: Player;
  moves: PlaygroundMoveRecord[];
  pendingMoves: Array<{ row: number; col: number; player: Player }>;
  gamePhase: 'idle' | 'playing' | 'paused' | 'finished';
  result: GameResult | null;
  selectedMoveIndex: number | null;
  isAIThinking: boolean;
  stepIndex: number; // For step-by-step replay
  session: PlaygroundSession | null;
}

interface PlaygroundActions {
  configure: (config: Partial<PlaygroundConfig>) => void;
  startGame: () => void;
  placeMove: (row: number, col: number, strategyName: string, thinkingMs: number, reason: string) => boolean;
  selectMove: (index: number | null) => void;
  stepForward: () => boolean;
  stepBack: () => boolean;
  jumpToMove: (index: number) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setAIThinking: (thinking: boolean) => void;
  getBoardAtStep: (step: number) => Board;
}

type PlaygroundStore = PlaygroundState & PlaygroundActions;

const defaultPlaygroundState: PlaygroundState = {
  config: defaultConfig,
  board: createEmptyBoard(),
  currentPlayer: 1,
  moves: [],
  pendingMoves: [],
  gamePhase: 'idle',
  result: null,
  selectedMoveIndex: null,
  isAIThinking: false,
  stepIndex: 0,
  session: null,
};

export const usePlaygroundStore = create<PlaygroundStore>()(
  immer((set, get) => ({
    ...defaultPlaygroundState,

    configure: (config) => {
      set(state => {
        state.config = { ...state.config, ...config };
      });
    },

    startGame: () => {
      set(state => {
        state.board = createEmptyBoard();
        state.currentPlayer = 1;
        state.moves = [];
        state.pendingMoves = [];
        state.gamePhase = 'playing';
        state.result = null;
        state.selectedMoveIndex = null;
        state.isAIThinking = false;
        state.stepIndex = 0;
        state.session = {
          id: `playground-${Date.now()}`,
          config: state.config,
          moves: [],
          startedAt: Date.now(),
          finishedAt: null,
          result: null,
        };
      });
    },

    placeMove: (row, col, strategyName, thinkingMs, reason) => {
      let success = false;
      set(state => {
        if (state.gamePhase !== 'playing' || state.board[row][col] !== 0) return;

        const boardBefore = state.board.map(r => [...r]) as Board;
        const player = state.currentPlayer;
        state.board[row][col] = player;
        const boardAfter = state.board.map(r => [...r]) as Board;

        const moveNumber = state.moves.length + 1;
        const gain = scoreGainFromMove(boardBefore, row, col, player);

        const inspection = buildMoveInspection(
          boardBefore, boardAfter, row, col, player,
          strategyName, moveNumber, thinkingMs, reason, gain
        );

        const record: PlaygroundMoveRecord = {
          move: { row, col, player, moveNumber, timestamp: Date.now() },
          inspection,
          boardBefore,
          boardAfter,
        };

        state.moves.push(record);
        state.stepIndex = state.moves.length;
        success = true;

        if (isBoardFull(boardAfter)) {
          state.gamePhase = 'finished';
          state.result = calculateGameResult(boardAfter);
          state.selectedMoveIndex = null;
          if (state.session) {
            state.session.finishedAt = Date.now();
            state.session.result = state.result;
            state.session.moves = [...state.moves];
          }
        } else {
          state.currentPlayer = (player === 1 ? 2 : 1) as Player;
        }
      });
      return success;
    },

    selectMove: (index) => {
      set(state => {
        state.selectedMoveIndex = index;
      });
    },

    stepForward: () => {
      const state = get();
      if (state.stepIndex >= state.moves.length) return false;
      set(s => { s.stepIndex = s.stepIndex + 1; });
      return true;
    },

    stepBack: () => {
      const state = get();
      if (state.stepIndex <= 0) return false;
      set(s => { s.stepIndex = s.stepIndex - 1; });
      return true;
    },

    jumpToMove: (index) => {
      set(state => {
        state.stepIndex = Math.max(0, Math.min(index, state.moves.length));
      });
    },

    pause: () => {
      set(state => {
        if (state.gamePhase === 'playing') state.gamePhase = 'paused';
      });
    },

    resume: () => {
      set(state => {
        if (state.gamePhase === 'paused') state.gamePhase = 'playing';
      });
    },

    restart: () => {
      set(state => {
        state.board = createEmptyBoard();
        state.currentPlayer = 1;
        state.moves = [];
        state.pendingMoves = [];
        state.gamePhase = 'playing';
        state.result = null;
        state.selectedMoveIndex = null;
        state.isAIThinking = false;
        state.stepIndex = 0;
        state.session = {
          id: `playground-${Date.now()}`,
          config: state.config,
          moves: [],
          startedAt: Date.now(),
          finishedAt: null,
          result: null,
        };
      });
    },

    setAIThinking: (thinking) => {
      set(state => { state.isAIThinking = thinking; });
    },

    getBoardAtStep: (step: number): Board => {
      const { moves } = get();
      const board = createEmptyBoard();
      moves.slice(0, step).forEach(m => {
        board[m.move.row][m.move.col] = m.move.player;
      });
      return board;
    },
  }))
);
