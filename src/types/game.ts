// ============================================================
// Pah Tum Game Types
// ============================================================

export type Player = 1 | 2;
export type CellValue = 0 | Player;
export type Board = CellValue[][];

export type GameMode =
  | 'human-vs-human'
  | 'human-vs-ai'
  | 'ai-vs-ai'
  | 'practice';

export type AILevel =
  | 'random'
  | 'greedy'
  | 'defensive'
  | 'aggressive'
  | 'balanced'
  | 'minimax'
  | 'montecarlo';

export type TimeControl =
  | 'bullet-15'
  | 'bullet-30'
  | 'bullet-60'
  | 'blitz-3'
  | 'blitz-5'
  | 'untimed';

export interface TimeControlConfig {
  label: string;
  category: 'Bullet' | 'Blitz' | 'Untimed';
  seconds: number | null; // Seconds PER MOVE (Shot Clock)
  increment: number;
}

export interface ScoredLine {
  cells: Array<{ row: number; col: number }>;
  length: number;
  score: number;
  player: Player;
}

export interface PlayerScore {
  player: Player;
  total: number;
  lines: ScoredLine[];
  breakdown: Record<number, number>; // line length -> count
}

export interface GameResult {
  winner: Player | 'draw' | null;
  scores: [PlayerScore, PlayerScore];
  winningLines: ScoredLine[];
}

export interface GameConfig {
  mode: GameMode;
  timeControl: TimeControl;
  aiLevel1: AILevel;   // AI for player 1 (if applicable)
  aiLevel2: AILevel;   // AI for player 2 (if applicable)
  player1Name: string;
  player2Name: string;
}

export interface Move {
  row: number;
  col: number;
  player: Player;
  moveNumber: number;
  timestamp: number;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  moves: Move[];
  gamePhase: 'setup' | 'playing' | 'finished';
  result: GameResult | null;
  config: GameConfig;
  turnTimeLeft: number | null;     // Seconds remaining for CURRENT turn/move (Shot Clock)
  timeControlLimit: number | null; // Per-move time limit (e.g. 15 for 15s)
  isAIThinking: boolean;
  isPaused: boolean;
  lastMove: Move | null;
}

export interface AIStrategy {
  name: string;
  level: AILevel;
  description: string;
  makeMove(board: Board, player: Player): { row: number; col: number };
}

// Scoring constants (DO NOT MODIFY)
export const SCORE_TABLE: Record<number, number> = {
  3: 3,
  4: 10,
  5: 25,
  6: 56,
  7: 119,
};

export const BOARD_SIZE = 7;

export const TIME_CONTROLS: Record<TimeControl, TimeControlConfig> = {
  'bullet-15': { label: '15 sec / move', category: 'Bullet', seconds: 15, increment: 0 },
  'bullet-30': { label: '30 sec / move', category: 'Bullet', seconds: 30, increment: 0 },
  'bullet-60': { label: '1 min / move', category: 'Bullet', seconds: 60, increment: 0 },
  'blitz-3': { label: '3 min / move', category: 'Blitz', seconds: 180, increment: 0 },
  'blitz-5': { label: '5 min / move', category: 'Blitz', seconds: 300, increment: 0 },
  'untimed': { label: 'Untimed', category: 'Untimed', seconds: null, increment: 0 },
};

export const AI_LEVEL_LABELS: Record<AILevel, { label: string; description: string; color: string }> = {
  random: { label: 'Random', description: 'Plays completely random moves', color: '#95a5a6' },
  greedy: { label: 'Greedy', description: 'Maximizes immediate score', color: '#27ae60' },
  defensive: { label: 'Defensive', description: 'Blocks opponent lines', color: '#2980b9' },
  aggressive: { label: 'Aggressive', description: 'Focuses on long lines', color: '#e74c3c' },
  balanced: { label: 'Balanced', description: 'Mix of attack and defense', color: '#8e44ad' },
  minimax: { label: 'Minimax', description: 'Lookahead strategy', color: '#e67e22' },
  montecarlo: { label: 'Monte Carlo', description: 'Simulation-based AI', color: '#d4af37' },
};
