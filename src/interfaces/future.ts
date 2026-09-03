// ============================================================
// Future-Ready Architecture — TypeScript Interfaces Only (#23)
// These are never instantiated at runtime.
// They define contracts for future online, cloud, and platform features.
// ============================================================

export const FUTURE_API_VERSION = '1.0.0' as const;

// ─── Online Multiplayer Adapter ───────────────────────────────
export interface OnlineMultiplayerAdapter {
  readonly version: string;
  connect(serverUrl: string, token: string): Promise<void>;
  disconnect(): Promise<void>;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(): Promise<void>;
  sendMove(row: number, col: number): Promise<void>;
  onMoveReceived(callback: (row: number, col: number) => void): void;
  onOpponentDisconnected(callback: () => void): void;
}

// ─── Cloud Save Adapter ───────────────────────────────────────
export interface CloudSaveAdapter {
  readonly version: string;
  authenticate(provider: 'google' | 'github' | 'anonymous'): Promise<string>;
  saveProfile(profileId: string, data: unknown): Promise<void>;
  loadProfile(profileId: string): Promise<unknown>;
  syncGameHistory(games: unknown[]): Promise<void>;
  fetchGameHistory(userId: string): Promise<unknown[]>;
}

// ─── Spectator Mode Adapter ───────────────────────────────────
export interface SpectatorModeAdapter {
  readonly version: string;
  joinAsSpectator(matchId: string): Promise<void>;
  leaveSpectating(): Promise<void>;
  onBoardUpdate(callback: (board: unknown) => void): void;
  onGameEnd(callback: (result: unknown) => void): void;
  getActiveMatches(): Promise<Array<{ id: string; players: string[]; moveCount: number }>>;
}

// ─── Ranked Matchmaking Adapter ───────────────────────────────
export interface RankedMatchmakingAdapter {
  readonly version: string;
  enterQueue(rating: number, mode: string): Promise<string>; // returns queueId
  leaveQueue(queueId: string): Promise<void>;
  onMatchFound(callback: (matchId: string, opponent: unknown) => void): void;
  submitResult(matchId: string, result: unknown): Promise<void>;
  getRankings(limit: number): Promise<Array<{ name: string; rating: number; rank: number }>>;
}

// ─── Season Pass Adapter ──────────────────────────────────────
export interface SeasonPassAdapter {
  readonly version: string;
  getCurrentSeason(): Promise<{ id: string; name: string; endsAt: number; tier: number }>;
  getSeasonRewards(tier: number): Promise<unknown[]>;
  claimReward(rewardId: string): Promise<void>;
  getSeasonProgress(userId: string): Promise<{ xp: number; tier: number; nextTierXp: number }>;
}

// ─── Daily Challenges Adapter ─────────────────────────────────
export interface DailyChallengeAdapter {
  readonly version: string;
  getTodaysChallenge(): Promise<{
    id: string;
    title: string;
    description: string;
    boardSetup: unknown;
    requiredMoves: number;
    reward: { xp: number; badge?: string };
  }>;
  submitChallengeResult(challengeId: string, moves: unknown[]): Promise<{ success: boolean; xpEarned: number }>;
  getChallengeHistory(): Promise<unknown[]>;
}

// ─── Community Strategy Sharing Adapter ───────────────────────
export interface CommunityStrategyAdapter {
  readonly version: string;
  uploadStrategy(code: string, name: string, description: string): Promise<string>; // returns strategyId
  downloadStrategy(strategyId: string): Promise<{ code: string; name: string; author: string }>;
  searchStrategies(query: string): Promise<Array<{ id: string; name: string; author: string; rating: number }>>;
  rateStrategy(strategyId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<void>;
  getFeaturedStrategies(): Promise<unknown[]>;
}

// ─── AI Marketplace Adapter ───────────────────────────────────
export interface AIMarketplaceAdapter {
  readonly version: string;
  listProducts(): Promise<Array<{ id: string; name: string; price: number; description: string }>>;
  purchaseProduct(productId: string, paymentToken: string): Promise<void>;
  getOwnedProducts(userId: string): Promise<string[]>;
  downloadPurchasedAI(productId: string): Promise<{ code: string; name: string }>;
}

// ─── Plugin Support Adapter ───────────────────────────────────
export interface PluginAdapter {
  readonly version: string;
  registerPlugin(plugin: { id: string; name: string; hooks: Record<string, unknown> }): void;
  unregisterPlugin(pluginId: string): void;
  getRegisteredPlugins(): Array<{ id: string; name: string; active: boolean }>;
  executeHook(hookName: string, payload: unknown): unknown;
}

// ─── REST API Adapter ─────────────────────────────────────────
export interface RESTAPIAdapter {
  readonly version: string;
  readonly baseUrl: string;
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, body: unknown): Promise<T>;
  put<T>(endpoint: string, body: unknown): Promise<T>;
  delete(endpoint: string): Promise<void>;
  setAuthToken(token: string): void;
}

// ─── WebSocket Live Matches Adapter ───────────────────────────
export interface WebSocketAdapter {
  readonly version: string;
  connect(url: string): Promise<void>;
  disconnect(): void;
  send(event: string, data: unknown): void;
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string): void;
  isConnected(): boolean;
}

// ─── Feature Flag Registry (for future gated features) ────────
export interface FeatureFlags {
  onlineMultiplayer: boolean;
  cloudSave: boolean;
  spectatorMode: boolean;
  rankedMatchmaking: boolean;
  seasonPass: boolean;
  dailyChallenges: boolean;
  communitySharing: boolean;
  aiMarketplace: boolean;
  plugins: boolean;
  restAPI: boolean;
  webSocket: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  onlineMultiplayer: false,
  cloudSave: false,
  spectatorMode: false,
  rankedMatchmaking: false,
  seasonPass: false,
  dailyChallenges: false,
  communitySharing: false,
  aiMarketplace: false,
  plugins: false,
  restAPI: false,
  webSocket: false,
};
