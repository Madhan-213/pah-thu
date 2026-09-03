// ============================================================
// Pah Tum — Extended Types for Features 12–23
// Extends (never replaces) src/types/game.ts
// ============================================================

import type { Board, Player, AILevel, GameConfig, GameResult, Move } from './game';

// ─── Playground Types (#12) ───────────────────────────────────

export type PlaygroundMode =
  | 'human-vs-custom'
  | 'custom-vs-builtin'
  | 'custom-vs-custom'
  | 'builtin-vs-builtin';

export interface CustomStrategy {
  id: string;
  name: string;
  code: string; // Raw JS function body
  isValid: boolean;
  validationReport: ValidationReport | null;
  createdAt: number;
}

export interface PlaygroundConfig {
  mode: PlaygroundMode;
  player1Name: string;
  player2Name: string;
  // Built-in AI levels
  aiLevel1: AILevel;
  aiLevel2: AILevel;
  // Custom strategy IDs (if applicable)
  customStrategy1Id: string | null;
  customStrategy2Id: string | null;
  isStepMode: boolean;
  autoPlaySpeed: number; // ms between moves
}

export interface BoardEvaluation {
  player1Score: number;
  player2Score: number;
  scoreDiff: number;
  dominance: 'player1' | 'player2' | 'equal';
  boardFillPercent: number;
  player1Lines: number;
  player2Lines: number;
}

export interface MoveInspection {
  // Core move data
  currentPlayer: Player;
  strategyName: string;
  moveNumber: number;
  chosenCell: string; // "A4" notation
  moveScore: number;
  thinkingTimeMs: number;
  reason: string;
  // Board state after move
  boardEvaluation: BoardEvaluation;
  expectedGain: number;
  opponentThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  // Connections analysis
  createdConnections: Array<{ row: number; col: number }>;
  blockedConnections: Array<{ row: number; col: number }>;
  affectedLines: Array<{ cells: Array<{ row: number; col: number }>; player: Player }>;
  potentialFutureMoves: Array<{ row: number; col: number; priority: number }>;
}

export interface PlaygroundMoveRecord {
  move: Move;
  inspection: MoveInspection;
  boardBefore: Board;
  boardAfter: Board;
}

export interface PlaygroundSession {
  id: string;
  config: PlaygroundConfig;
  moves: PlaygroundMoveRecord[];
  startedAt: number;
  finishedAt: number | null;
  result: GameResult | null;
}

// ─── Debugger Types (#13) ──────────────────────────────────────

export interface DebugFrame {
  functionName: string;
  input: {
    board: Board;
    player: Player;
    boardState: string; // Compact string repr
  };
  output: {
    move: { row: number; col: number; label: string } | null;
    isValid: boolean;
    errorMessage?: string;
  };
  executionTimeMs: number;
  memoryEstimateKb: number;
  warnings: string[];
  errors: string[];
  exceptions: string[];
  didTimeout: boolean;
  didLoop: boolean;
  candidateMoves: DebugCandidate[];
  chosenMove: DebugCandidate | null;
}

export interface DebugCandidate {
  row: number;
  col: number;
  label: string;
  score: number;
  reason: string;
  wasChosen: boolean;
  rejectionReason?: string;
}

// ─── Strategy Comparison Types (#14) ─────────────────────────

export interface ComparisonConfig {
  strategyA: AILevel | 'custom';
  strategyB: AILevel | 'custom';
  customAId?: string;
  customBId?: string;
  numGames: number; // Default: 10
}

export interface HeatMapData {
  cells: number[][]; // 7x7 grid, values 0-100
  player: Player;
  label: string;
}

export interface RadarData {
  labels: string[];
  valuesA: number[];
  valuesB: number[];
  labelA: string;
  labelB: string;
}

export interface ComparisonResult {
  strategyAName: string;
  strategyBName: string;
  gamesPlayed: number;
  winsA: number;
  winsB: number;
  draws: number;
  winRateA: number;
  winRateB: number;
  avgScoreA: number;
  avgScoreB: number;
  avgThinkingMsA: number;
  avgThinkingMsB: number;
  openingWinRateA: number;  // Win rate when ahead after move 10
  openingWinRateB: number;
  endgameWinRateA: number;  // Win rate when ahead at move 40
  endgameWinRateB: number;
  moveAccuracyA: number;    // % of moves that match minimax best
  moveAccuracyB: number;
  moveDistributionA: number[]; // 49 cells, how often each was chosen
  moveDistributionB: number[];
  heatMapA: HeatMapData;
  heatMapB: HeatMapData;
  scoreHistoryA: number[];  // Score over 10 games
  scoreHistoryB: number[];
  radarData: RadarData;
  strengthsA: string[];
  weaknessesA: string[];
  strengthsB: string[];
  weaknessesB: string[];
  recommendation: string;
}

// ─── Sandbox / Validation Types (#15) ────────────────────────

export type ValidationStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning';

export interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: ValidationStatus;
  message: string;
  detail?: string;
}

export interface ValidationReport {
  strategyId: string;
  strategyName: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  checks: ValidationCheck[];
  executionTimeMs: number;
  testedAt: number;
  sampleMoveOutput: { row: number; col: number } | null;
  errorLog: string[];
}

// ─── AI Coach Types (#16) ──────────────────────────────────────

export type MoveQualityRating = 'excellent' | 'good' | 'neutral' | 'mistake' | 'critical_mistake' | 'missed_opportunity';

export interface MoveQuality {
  moveNumber: number;
  move: Move;
  rating: MoveQualityRating;
  bestMove: { row: number; col: number; label: string } | null;
  scoreLost: number;      // Points lost compared to best move
  description: string;
}

export interface CoachReport {
  gameId: string;
  player1Name: string;
  player2Name: string;
  bestMove: MoveQuality | null;
  worstMove: MoveQuality | null;
  missedOpportunities: MoveQuality[];
  mistakes: MoveQuality[];
  criticalMistakes: MoveQuality[];
  excellentMoves: MoveQuality[];
  defensiveRating: number;   // 0–100
  offensiveRating: number;   // 0–100
  efficiencyRating: number;  // 0–100
  suggestions: string[];
  improvementTips: string[];
  estimatedSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// ─── Opening Explorer Types (#17) ────────────────────────────

export interface OpeningEntry {
  id: string;
  name: string;
  moves: Array<{ row: number; col: number; label: string }>;
  frequency: number;
  winRate: number;  // 0–100
  avgScore: number;
}

export interface OpeningTreeNode {
  move: { row: number; col: number; label: string };
  frequency: number;
  winRate: number;
  children: OpeningTreeNode[];
}

export interface OpeningStats {
  topOpenings: OpeningEntry[];
  bestOpening: OpeningEntry | null;
  worstOpening: OpeningEntry | null;
  openingTree: OpeningTreeNode | null;
  recommendedOpenings: OpeningEntry[];
}

// ─── Tournament History Types (#19) ──────────────────────────

export type TournamentFormat = 'elimination' | 'round-robin' | 'swiss';

export interface TournamentPlayer {
  name: string;
  strategy: AILevel | 'human' | 'custom';
  customStrategyId?: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  playerA: string;
  playerB: string;
  winner: string | null;
  gameId: string | null;  // Links to RecordedGame
  scoreA: number;
  scoreB: number;
}

export interface TournamentRecord {
  id: string;
  name: string;
  format: TournamentFormat;
  boardSize: number; // always 7 for now
  createdAt: number;
  completedAt: number | null;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  champion: string | null;
  runnerUp: string | null;
  winnerStrategy: AILevel | 'human' | 'custom' | null;
  totalGames: number;
  statistics: {
    avgMatchDuration: number;
    highestScore: number;
    totalMoves: number;
  };
}

// ─── Player Profile Types (#20) ──────────────────────────────

export type CountryCode = string; // ISO 3166-1 alpha-2

export interface ProfileAchievement {
  achievementId: string;
  unlockedAt: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;    // Emoji or URL
  country: CountryCode;
  rating: number;    // Elo-like, starts at 1000
  createdAt: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  favoriteStrategy: AILevel | 'custom' | null;
  achievements: ProfileAchievement[];
  tournamentWins: number;
  avgScore: number;
  currentRank: number | null;
  matchHistory: string[];        // RecordedGame IDs (last 50)
  strategyHistory: Record<string, number>; // strategy -> times used
}

// ─── Achievement Types (#21) ──────────────────────────────────

export type AchievementCategory = 'wins' | 'strategy' | 'performance' | 'tournament' | 'special';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;            // Emoji
  badge: string;           // Badge color key
  category: AchievementCategory;
  condition: (profile: PlayerProfile, games: import('./game').GameConfig[]) => boolean;
  progressMax?: number;
  getProgress?: (profile: PlayerProfile) => number;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
  profileId: string;
}

// ─── Statistics Dashboard Types (#22) ────────────────────────

export interface DailyStats {
  date: string;
  gamesPlayed: number;
  avgScore: number;
  topStrategy: string;
}

export interface DashboardStats {
  gamesPlayed: number;
  matchesToday: number;
  tournamentCount: number;
  strategiesTested: number;
  uploadedStrategies: number;
  mostUsedStrategy: string;
  highestWinRate: { strategy: string; rate: number };
  avgMatchDuration: number;   // seconds
  avgThinkingTime: number;    // ms
  topPlayers: Array<{ name: string; rating: number; wins: number }>;
  topStrategies: Array<{ name: string; winRate: number; gamesPlayed: number }>;
  latestChampion: string | null;
  performanceTrend: DailyStats[];
  modeDistribution: Record<string, number>;
  aiUsageDistribution: Record<string, number>;
}
