import { getRemoteLeaderboard, submitRemoteScore } from './supabase';
import { getActivePilotProfile } from './auth';

const USERNAME_KEY = 'rustyy_player_username_v1';
const GUEST_TAG_KEY = 'rustyy_guest_tag_v1';
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

export function getOrCreateGuestTag(): string {
  try {
    const existing = localStorage.getItem(GUEST_TAG_KEY);
    if (existing) return existing;
    const generated = `Guest_${Math.floor(100 + Math.random() * 900)}`;
    localStorage.setItem(GUEST_TAG_KEY, generated);
    return generated;
  } catch {
    return 'Guest_99';
  }
}

/**
 * Transfers all guest scores for the current browser session to the newly
 * registered or authenticated official GamerTag.
 */
export function claimGuestScores(oldGuestTag: string, newProfileTag: string, playerId?: string): void {
  if (!oldGuestTag || !newProfileTag || oldGuestTag.toLowerCase() === newProfileTag.toLowerCase()) return;
  const games: Array<'runner' | 'target' | 'trivia'> = ['runner', 'target', 'trivia'];

  for (const game of games) {
    try {
      const list = getLeaderboard(game);
      const guestScore = list.find((e) => e.name.toLowerCase() === oldGuestTag.toLowerCase());
      if (guestScore && guestScore.score > 0) {
        // Fire score registration for the new verified profile
        void submitRemoteScore(game, newProfileTag, guestScore.score, playerId);
        const updated = deduplicateLeaderboard([
          {
            id: `p_${Date.now()}_${game}`,
            name: newProfileTag,
            score: guestScore.score,
            timestamp: Date.now(),
            isPlayer: true,
          },
          ...list.filter((e) => e.name.toLowerCase() !== oldGuestTag.toLowerCase()),
        ]);
        localStorage.setItem(`${LEADERBOARD_KEY_PREFIX}${game}`, JSON.stringify(updated));
      }
    } catch {
      // no-op
    }
  }
}

export function getPlayerUsername(): string {
  try {
    const profile = getActivePilotProfile();
    if (profile && profile.tag) return profile.tag;
    const legacy = localStorage.getItem(USERNAME_KEY);
    if (legacy && legacy.trim()) return legacy.trim();
    return getOrCreateGuestTag();
  } catch {
    return 'Guest_99';
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

/**
 * Ensures each unique player appears at most once on the leaderboard,
 * displaying ONLY their personal highest score.
 */
export function deduplicateLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  const activePlayer = getPlayerUsername().trim().toLowerCase();

  for (const entry of entries) {
    const rawName = (entry.name || '').trim();
    if (!rawName) continue;
    const key = rawName.toLowerCase();
    const existing = map.get(key);

    const isCurrentPlayer = Boolean(entry.isPlayer || (activePlayer && key === activePlayer));
    const normalizedEntry: LeaderboardEntry = {
      ...entry,
      name: rawName,
      isPlayer: isCurrentPlayer,
    };

    if (!existing) {
      map.set(key, normalizedEntry);
    } else {
      // Keep only the highest score; if scores tie, keep the most recent
      if (entry.score > existing.score) {
        map.set(key, normalizedEntry);
      } else if (entry.score === existing.score && entry.timestamp > existing.timestamp) {
        map.set(key, normalizedEntry);
      }
    }
  }

  // Sort descending by score and keep top 10
  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function getLeaderboard(game: 'runner' | 'target' | 'trivia'): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(`${LEADERBOARD_KEY_PREFIX}${game}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateLeaderboard(parsed);
      }
    }
  } catch {
    // fallback
  }
  return deduplicateLeaderboard(DEFAULT_LEADERBOARDS[game] || []);
}

export async function fetchAndSyncLeaderboard(game: 'runner' | 'target' | 'trivia'): Promise<LeaderboardEntry[]> {
  const local = getLeaderboard(game);
  try {
    const remote = await getRemoteLeaderboard(game);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      const activePlayer = getPlayerUsername().trim().toLowerCase();
      const mapped: LeaderboardEntry[] = remote.map((row) => ({
        id: row.id,
        name: row.name.trim(),
        score: row.score,
        timestamp: new Date(row.created_at).getTime(),
        isPlayer: activePlayer ? row.name.trim().toLowerCase() === activePlayer : false,
      }));

      // Merge remote scores with default and local entries, keeping only the single highest per player
      const combined = deduplicateLeaderboard([...mapped, ...local, ...DEFAULT_LEADERBOARDS[game]]);
      try {
        localStorage.setItem(`${LEADERBOARD_KEY_PREFIX}${game}`, JSON.stringify(combined));
      } catch {
        // no-op
      }
      return combined;
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
  const profile = getActivePilotProfile();
  const current = getLeaderboard(game);
  const name = (profile?.tag || username || 'Anonymous Legend').trim();
  const playerId = profile?.id;

  // Fire-and-forget sync to Supabase remote database with player ID link
  void submitRemoteScore(game, name, score, playerId);

  const newEntry: LeaderboardEntry = {
    id: `p_${Date.now()}`,
    name,
    score,
    timestamp: Date.now(),
    isPlayer: true,
  };

  // Add the new score and deduplicate to retain ONLY the highest score for this player
  const updated = deduplicateLeaderboard([newEntry, ...current]);

  try {
    localStorage.setItem(`${LEADERBOARD_KEY_PREFIX}${game}`, JSON.stringify(updated));
  } catch {
    // no-op
  }

  return updated;
}
