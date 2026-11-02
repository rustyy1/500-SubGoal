import { getRemoteLeaderboard, submitRemoteScore } from './supabase';

const USERNAME_KEY = 'rustyy_player_username_v1';
const LEADERBOARD_KEY_PREFIX = 'rustyy_leaderboard_';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: number;
  isPlayer?: boolean;
}

const DEFAULT_LEADERBOARDS: Record<'runner' | 'target' | 'trivia', LeaderboardEntry[]> = {
  runner: [
    { id: 'r1', name: 'Valkyrie_Aim', score: 1420, timestamp: Date.now() - 86400000 * 3 },
    { id: 'r2', name: 'ShadowBlade_X', score: 1180, timestamp: Date.now() - 86400000 * 5 },
    { id: 'r3', name: 'EldenLord99', score: 940, timestamp: Date.now() - 86400000 * 7 },
    { id: 'r4', name: 'CyberSamurai', score: 760, timestamp: Date.now() - 86400000 * 9 },
    { id: 'r5', name: 'NightOwlGamer', score: 520, timestamp: Date.now() - 86400000 * 11 },
  ],
  target: [
    { id: 't1', name: 'TenZ_Reflex', score: 3850, timestamp: Date.now() - 86400000 * 2 },
    { id: 't2', name: 'ApexShooter', score: 3200, timestamp: Date.now() - 86400000 * 4 },
    { id: 't3', name: 'GhostRunner_', score: 2750, timestamp: Date.now() - 86400000 * 6 },
    { id: 't4', name: 'ValorantAce', score: 2300, timestamp: Date.now() - 86400000 * 8 },
    { id: 't5', name: 'TacticalPanda', score: 1850, timestamp: Date.now() - 86400000 * 10 },
  ],
  trivia: [
    { id: 'q1', name: 'LoreMaster_Rustyy', score: 500, timestamp: Date.now() - 86400000 * 1 },
    { id: 'q2', name: 'DarkSoulsVet', score: 400, timestamp: Date.now() - 86400000 * 3 },
    { id: 'q3', name: 'CrypticWolf', score: 400, timestamp: Date.now() - 86400000 * 4 },
    { id: 'q4', name: 'IndieGamer_22', score: 300, timestamp: Date.now() - 86400000 * 6 },
    { id: 'q5', name: 'PixelRaider', score: 300, timestamp: Date.now() - 86400000 * 8 },
  ],
};

export function getPlayerUsername(): string {
  try {
    return localStorage.getItem(USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function savePlayerUsername(username: string): void {
  try {
    const trimmed = username.trim().slice(0, 18);
    localStorage.setItem(USERNAME_KEY, trimmed);
  } catch {
    // no-op
  }
}

export function getLeaderboard(game: 'runner' | 'target' | 'trivia'): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(`${LEADERBOARD_KEY_PREFIX}${game}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEFAULT_LEADERBOARDS[game] || [];
}

export async function fetchAndSyncLeaderboard(game: 'runner' | 'target' | 'trivia'): Promise<LeaderboardEntry[]> {
  const local = getLeaderboard(game);
  try {
    const remote = await getRemoteLeaderboard(game);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      const activePlayer = getPlayerUsername().toLowerCase();
      const mapped: LeaderboardEntry[] = remote.map((row) => ({
        id: row.id,
        name: row.name,
        score: row.score,
        timestamp: new Date(row.created_at).getTime(),
        isPlayer: activePlayer ? row.name.toLowerCase() === activePlayer : false,
      }));
      try {
        localStorage.setItem(`${LEADERBOARD_KEY_PREFIX}${game}`, JSON.stringify(mapped));
      } catch {
        // no-op
      }
      return mapped;
    }
  } catch {
    // remote unavailable
  }
  return local;
}

export function saveScoreToLeaderboard(
  game: 'runner' | 'target' | 'trivia',
  username: string,
  score: number
): LeaderboardEntry[] {
  const current = getLeaderboard(game);
  const name = username.trim() || 'Anonymous Legend';

  // Fire-and-forget sync to Supabase remote database
  void submitRemoteScore(game, name, score);

  // Check if player already exists in leaderboard
  const existingIndex = current.findIndex((item) => item.isPlayer || item.name.toLowerCase() === name.toLowerCase());

  let updated: LeaderboardEntry[];
  if (existingIndex >= 0) {
    if (score > current[existingIndex].score) {
      current[existingIndex] = {
        ...current[existingIndex],
        name,
        score,
        timestamp: Date.now(),
        isPlayer: true,
      };
      updated = [...current];
    } else {
      updated = current;
    }
  } else {
    const newEntry: LeaderboardEntry = {
      id: `p_${Date.now()}`,
      name,
      score,
      timestamp: Date.now(),
      isPlayer: true,
    };
    updated = [...current, newEntry];
  }

  // Sort descending by score
  updated.sort((a, b) => b.score - a.score);

  // Keep top 10
  const top10 = updated.slice(0, 10);

  try {
    localStorage.setItem(`${LEADERBOARD_KEY_PREFIX}${game}`, JSON.stringify(top10));
  } catch {
    // no-op
  }

  return top10;
}
