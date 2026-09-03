// ============================================================
// Profile Service — Player Profile Management (#20)
// ============================================================

import type { PlayerProfile } from '@/types/playground';
import type { AILevel } from '@/types/game';
import { checkAchievements } from './achievementService';

const STORAGE_KEY = 'pah_tum_profiles_v1';
const ACTIVE_PROFILE_KEY = 'pah_tum_active_profile_v1';

const COUNTRY_LIST: Array<{ code: string; name: string; flag: string }> = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'other', name: 'Other', flag: '🌍' },
];

export { COUNTRY_LIST };

const AVATAR_OPTIONS = ['🧑', '👩', '🧑‍💻', '👨‍💻', '🦊', '🐺', '🦁', '🐯', '🦅', '🤖', '🧙', '⚔️', '🎯', '🧪', '🏆'];
export { AVATAR_OPTIONS };

// ─── CRUD ─────────────────────────────────────────────────────

export function getAllProfiles(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProfileById(id: string): PlayerProfile | undefined {
  return getAllProfiles().find(p => p.id === id);
}

export function getActiveProfile(): PlayerProfile | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!activeId) return null;
    return getProfileById(activeId) ?? null;
  } catch {
    return null;
  }
}

export function setActiveProfile(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function createProfile(name: string, avatar: string, country: string): PlayerProfile {
  const profiles = getAllProfiles();
  const profile: PlayerProfile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    avatar,
    country,
    rating: 1000,
    createdAt: Date.now(),
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    favoriteStrategy: null,
    achievements: [],
    tournamentWins: 0,
    avgScore: 0,
    currentRank: null,
    matchHistory: [],
    strategyHistory: {},
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([profile, ...profiles]));
  return profile;
}

export function updateProfile(id: string, updates: Partial<PlayerProfile>): PlayerProfile | null {
  const profiles = getAllProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx < 0) return null;
  profiles[idx] = { ...profiles[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

  // Check achievements after update
  checkAchievements(profiles[idx]);
  return profiles[idx];
}

export function deleteProfile(id: string): void {
  const profiles = getAllProfiles().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (activeId === id) localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

// ─── Rating System ────────────────────────────────────────────

/**
 * Simple Elo-like rating update.
 * K-factor of 32 for simplicity.
 */
export function updateRating(
  profileId: string,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw'
): number {
  const profile = getProfileById(profileId);
  if (!profile) return 1000;

  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - profile.rating) / 400));
  const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const newRating = Math.max(100, Math.round(profile.rating + K * (score - expected)));

  updateProfile(profileId, { rating: newRating });
  return newRating;
}

// ─── Game Recording ───────────────────────────────────────────

export function recordGameForProfile(
  profileId: string,
  gameId: string,
  result: 'win' | 'loss' | 'draw',
  score: number,
  strategy: AILevel | 'custom' | null
): void {
  const profile = getProfileById(profileId);
  if (!profile) return;

  const updates: Partial<PlayerProfile> = {
    matchesPlayed: profile.matchesPlayed + 1,
    wins: result === 'win' ? profile.wins + 1 : profile.wins,
    losses: result === 'loss' ? profile.losses + 1 : profile.losses,
    draws: result === 'draw' ? profile.draws + 1 : profile.draws,
    matchHistory: [gameId, ...profile.matchHistory].slice(0, 50),
  };

  // Update avg score
  const totalGames = updates.matchesPlayed!;
  const currentTotal = profile.avgScore * profile.matchesPlayed;
  updates.avgScore = Math.round((currentTotal + score) / totalGames);

  // Update strategy history
  if (strategy) {
    const sh = { ...profile.strategyHistory };
    sh[strategy] = (sh[strategy] ?? 0) + 1;
    updates.strategyHistory = sh;

    // Update favorite strategy
    const favorite = Object.entries(sh).sort((a, b) => b[1] - a[1])[0]?.[0] as AILevel | 'custom';
    updates.favoriteStrategy = favorite ?? null;
  }

  updateProfile(profileId, updates);
}

// ─── Leaderboard ──────────────────────────────────────────────

export function getLeaderboard(limit = 10): PlayerProfile[] {
  return getAllProfiles()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((p, i) => ({ ...p, currentRank: i + 1 }));
}
