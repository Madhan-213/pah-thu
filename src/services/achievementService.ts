// ============================================================
// Achievement Service — Unlock Logic & Storage (#21)
// ============================================================

import type { AchievementDefinition, UnlockedAchievement, PlayerProfile } from '@/types/playground';

const STORAGE_KEY = 'pah_tum_achievements_v1';

// ─── Achievement Definitions ──────────────────────────────────

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    badge: 'gold',
    category: 'wins',
    condition: (p) => p.wins >= 1,
    progressMax: 1,
    getProgress: (p) => Math.min(p.wins, 1),
  },
  {
    id: 'wins_10',
    name: 'Rising Champion',
    description: 'Win 10 games',
    icon: '⭐',
    badge: 'silver',
    category: 'wins',
    condition: (p) => p.wins >= 10,
    progressMax: 10,
    getProgress: (p) => Math.min(p.wins, 10),
  },
  {
    id: 'wins_50',
    name: 'Veteran Warrior',
    description: 'Win 50 games',
    icon: '🦁',
    badge: 'gold',
    category: 'wins',
    condition: (p) => p.wins >= 50,
    progressMax: 50,
    getProgress: (p) => Math.min(p.wins, 50),
  },
  {
    id: 'wins_100',
    name: 'Century Legend',
    description: 'Win 100 games',
    icon: '💎',
    badge: 'diamond',
    category: 'wins',
    condition: (p) => p.wins >= 100,
    progressMax: 100,
    getProgress: (p) => Math.min(p.wins, 100),
  },
  {
    id: 'tournament_champion',
    name: 'Tournament Champion',
    description: 'Win a tournament',
    icon: '🥇',
    badge: 'gold',
    category: 'tournament',
    condition: (p) => p.tournamentWins >= 1,
    progressMax: 1,
    getProgress: (p) => Math.min(p.tournamentWins, 1),
  },
  {
    id: 'perfect_tournament',
    name: 'Perfect Tournament',
    description: 'Win a tournament without losing a game',
    icon: '🌟',
    badge: 'diamond',
    category: 'tournament',
    condition: (p) => p.tournamentWins >= 1 && p.losses === 0,
  },
  {
    id: 'fast_thinker',
    name: 'Fast Thinker',
    description: 'Complete a game in under 30 seconds',
    icon: '⚡',
    badge: 'blue',
    category: 'performance',
    condition: () => false, // triggered externally
  },
  {
    id: 'master_defender',
    name: 'Master Defender',
    description: 'Block 50 opponent scoring moves total',
    icon: '🛡️',
    badge: 'blue',
    category: 'performance',
    condition: () => false, // triggered externally
  },
  {
    id: 'master_attacker',
    name: 'Master Attacker',
    description: 'Score 25 points or more in a single game',
    icon: '⚔️',
    badge: 'red',
    category: 'performance',
    condition: () => false, // triggered externally
  },
  {
    id: 'winning_streak_5',
    name: 'Unstoppable Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    badge: 'red',
    category: 'performance',
    condition: () => false, // Requires match history analysis
  },
  {
    id: 'strategy_creator',
    name: 'Strategy Creator',
    description: 'Upload and validate a custom AI strategy',
    icon: '🧪',
    badge: 'purple',
    category: 'strategy',
    condition: () => false, // triggered by sandbox validation
  },
  {
    id: 'ai_developer',
    name: 'AI Developer',
    description: 'Win a game using your own custom AI strategy',
    icon: '🤖',
    badge: 'purple',
    category: 'strategy',
    condition: () => false, // triggered externally
  },
  {
    id: 'top_ranked',
    name: 'Top Ranked',
    description: 'Reach a rating of 1500+',
    icon: '👑',
    badge: 'gold',
    category: 'performance',
    condition: (p) => p.rating >= 1500,
    progressMax: 1500,
    getProgress: (p) => Math.min(p.rating, 1500),
  },
  {
    id: 'first_game',
    name: 'First Step',
    description: 'Play your very first game',
    icon: '🎯',
    badge: 'bronze',
    category: 'wins',
    condition: (p) => p.matchesPlayed >= 1,
    progressMax: 1,
    getProgress: (p) => Math.min(p.matchesPlayed, 1),
  },
  {
    id: 'games_25',
    name: 'Committed Player',
    description: 'Play 25 games',
    icon: '📊',
    badge: 'silver',
    category: 'wins',
    condition: (p) => p.matchesPlayed >= 25,
    progressMax: 25,
    getProgress: (p) => Math.min(p.matchesPlayed, 25),
  },
  {
    id: 'games_100',
    name: 'Dedicated Master',
    description: 'Play 100 games',
    icon: '🏅',
    badge: 'gold',
    category: 'wins',
    condition: (p) => p.matchesPlayed >= 100,
    progressMax: 100,
    getProgress: (p) => Math.min(p.matchesPlayed, 100),
  },
  {
    id: 'beat_minimax',
    name: 'Mind Over Machine',
    description: 'Beat the Minimax AI as a human player',
    icon: '🧠',
    badge: 'purple',
    category: 'strategy',
    condition: () => false, // triggered externally
  },
  {
    id: 'beat_montecarlo',
    name: 'Probability Buster',
    description: 'Beat the Monte Carlo AI as a human player',
    icon: '🎲',
    badge: 'purple',
    category: 'strategy',
    condition: () => false, // triggered externally
  },
  {
    id: 'draw_master',
    name: 'Equilibrium',
    description: 'Draw 5 games',
    icon: '⚖️',
    badge: 'silver',
    category: 'performance',
    condition: (p) => p.draws >= 5,
    progressMax: 5,
    getProgress: (p) => Math.min(p.draws, 5),
  },
  {
    id: 'high_score',
    name: 'Point Machine',
    description: 'Reach a personal best of 50+ points',
    icon: '💯',
    badge: 'gold',
    category: 'performance',
    condition: () => false, // triggered externally
  },
];

// ─── Storage API ──────────────────────────────────────────────

export function getUnlockedAchievements(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isAchievementUnlocked(achievementId: string): boolean {
  return getUnlockedAchievements().some(a => a.achievementId === achievementId);
}

export function unlockAchievement(achievementId: string, profileId: string): UnlockedAchievement | null {
  if (isAchievementUnlocked(achievementId)) return null;
  const unlocked: UnlockedAchievement = {
    achievementId,
    unlockedAt: Date.now(),
    profileId,
  };
  const current = getUnlockedAchievements();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, unlocked]));
  return unlocked;
}

/**
 * Check all condition-based achievements for a profile.
 * Returns array of newly unlocked achievement IDs.
 */
export function checkAchievements(profile: PlayerProfile): string[] {
  const newlyUnlocked: string[] = [];
  for (const def of ACHIEVEMENTS) {
    if (isAchievementUnlocked(def.id)) continue;
    try {
      if (def.condition(profile, [])) {
        unlockAchievement(def.id, profile.id);
        newlyUnlocked.push(def.id);
      }
    } catch {
      // Silently skip errors in condition check
    }
  }
  return newlyUnlocked;
}

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getUnlockedCount(): number {
  return getUnlockedAchievements().length;
}

export function getTotalCount(): number {
  return ACHIEVEMENTS.length;
}
