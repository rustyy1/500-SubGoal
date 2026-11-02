import { generateDeviceToken, hashSecurityPin, PilotProfile } from './auth';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface RemoteLeaderboardRow {
  id: string;
  game: 'target' | 'runner' | 'trivia';
  name: string;
  score: number;
  created_at: string;
}

export interface RemoteLegendWallRow {
  id: string;
  name: string;
  message: string;
  tier: string;
  created_at: string;
}

export interface RemotePredictionRow {
  id: string;
  name: string;
  predicted_date: string;
  created_at: string;
}

export interface RemotePlayerRow {
  id: string;
  tag: string;
  tag_lower: string;
  pin_hash: string;
  device_token: string;
  created_at: string;
  last_active: string;
}

const LOCAL_REGISTERED_PLAYERS_KEY = 'rustyy_registered_players_v1';

function getLocalRegisteredPlayers(): RemotePlayerRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_REGISTERED_PLAYERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRegisteredPlayers(players: RemotePlayerRow[]): void {
  try {
    localStorage.setItem(LOCAL_REGISTERED_PLAYERS_KEY, JSON.stringify(players));
  } catch {
    // no-op
  }
}

async function supabaseFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.method === 'POST' ? 'return=representation' : 'count=none',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ----------------- GAMERTAG & PLAYER AUTH -----------------

export type TagCheckResult =
  | { status: 'available' }
  | { status: 'claimed'; tag: string; id: string };

/**
 * Checks whether a GamerTag is already claimed in Supabase (or local fallback).
 */
export async function checkGamerTagAvailability(tag: string): Promise<TagCheckResult> {
  const tagLower = tag.trim().toLowerCase();

  // 1. Try remote database lookup
  const remote = await supabaseFetch<RemotePlayerRow[]>(`players?tag_lower=eq.${encodeURIComponent(tagLower)}&limit=1`);
  if (remote && Array.isArray(remote) && remote.length > 0) {
    return { status: 'claimed', tag: remote[0].tag, id: remote[0].id };
  }

  // 2. Local fallback check
  const localList = getLocalRegisteredPlayers();
  const localFound = localList.find((p) => p.tag_lower === tagLower);
  if (localFound) {
    return { status: 'claimed', tag: localFound.tag, id: localFound.id };
  }

  return { status: 'available' };
}

/**
 * Registers a new unique GamerTag with a security PIN.
 */
export async function registerPlayerAccount(
  tag: string,
  pin: string
): Promise<{ success: boolean; profile?: PilotProfile; error?: string }> {
  const trimmedTag = tag.trim();
  const tagLower = trimmedTag.toLowerCase();
  const pinHash = await hashSecurityPin(pin, tagLower);
  const deviceToken = generateDeviceToken();
  const nowStr = new Date().toISOString();

  // Check availability first
  const check = await checkGamerTagAvailability(trimmedTag);
  if (check.status === 'claimed') {
    return { success: false, error: `GamerTag "${check.tag}" is already claimed.` };
  }

  const newPlayerRow: Partial<RemotePlayerRow> = {
    tag: trimmedTag,
    tag_lower: tagLower,
    pin_hash: pinHash,
    device_token: deviceToken,
    created_at: nowStr,
    last_active: nowStr,
  };

  // Try insert into Supabase
  let inserted = await supabaseFetch<RemotePlayerRow[]>('players', {
    method: 'POST',
    body: JSON.stringify(newPlayerRow),
  });

  const playerId = inserted?.[0]?.id || `pilot_${Date.now()}`;

  // Always save to local registered registry for offline resilience
  const localList = getLocalRegisteredPlayers();
  localList.push({
    id: playerId,
    tag: trimmedTag,
    tag_lower: tagLower,
    pin_hash: pinHash,
    device_token: deviceToken,
    created_at: nowStr,
    last_active: nowStr,
  });
  saveLocalRegisteredPlayers(localList);

  const profile: PilotProfile = {
    id: playerId,
    tag: trimmedTag,
    tag_lower: tagLower,
    token: deviceToken,
    claimedAt: Date.now(),
  };

  return { success: true, profile };
}

/**
 * Authenticates an existing GamerTag using their 4-digit security PIN.
 */
export async function authenticatePlayerAccount(
  tag: string,
  pin: string
): Promise<{ success: boolean; profile?: PilotProfile; error?: string }> {
  const trimmedTag = tag.trim();
  const tagLower = trimmedTag.toLowerCase();
  const inputPinHash = await hashSecurityPin(pin, tagLower);

  // 1. Check remote database first
  const remote = await supabaseFetch<RemotePlayerRow[]>(`players?tag_lower=eq.${encodeURIComponent(tagLower)}&limit=1`);
  let playerRecord: RemotePlayerRow | null = remote?.[0] || null;

  // 2. Fallback to local registered registry
  if (!playerRecord) {
    const localList = getLocalRegisteredPlayers();
    playerRecord = localList.find((p) => p.tag_lower === tagLower) || null;
  }

  if (!playerRecord) {
    return { success: false, error: `GamerTag "${trimmedTag}" not found.` };
  }

  // Verify PIN hash
  if (playerRecord.pin_hash !== inputPinHash) {
    return { success: false, error: 'Incorrect Security PIN. This tag is owned by another pilot.' };
  }

  // Generate new active device session token
  const newDeviceToken = generateDeviceToken();
  const profile: PilotProfile = {
    id: playerRecord.id,
    tag: playerRecord.tag,
    tag_lower: playerRecord.tag_lower,
    token: newDeviceToken,
    claimedAt: new Date(playerRecord.created_at).getTime(),
  };

  return { success: true, profile };
}

// ----------------- LEADERBOARD -----------------
export async function getRemoteLeaderboard(game: 'target' | 'runner' | 'trivia'): Promise<RemoteLeaderboardRow[] | null> {
  return supabaseFetch<RemoteLeaderboardRow[]>(`leaderboard?game=eq.${game}&order=score.desc&limit=60`);
}

export async function submitRemoteScore(
  game: 'target' | 'runner' | 'trivia',
  name: string,
  score: number,
  playerId?: string
): Promise<boolean> {
  const result = await supabaseFetch<RemoteLeaderboardRow[]>('leaderboard', {
    method: 'POST',
    body: JSON.stringify({
      game,
      name,
      score,
      ...(playerId ? { player_id: playerId } : {}),
    }),
  });
  return Boolean(result);
}

// ----------------- LEGEND WALL -----------------
export async function getRemoteLegendWall(): Promise<RemoteLegendWallRow[] | null> {
  return supabaseFetch<RemoteLegendWallRow[]>('legend_wall?order=created_at.desc&limit=40');
}

export async function submitRemoteLegendMessage(name: string, message: string, tier = 'RUSTYY WARRIOR'): Promise<boolean> {
  const result = await supabaseFetch<RemoteLegendWallRow[]>('legend_wall', {
    method: 'POST',
    body: JSON.stringify({ name, message, tier }),
  });
  return Boolean(result);
}

// ----------------- PREDICTIONS -----------------
export async function getRemotePredictions(): Promise<RemotePredictionRow[] | null> {
  return supabaseFetch<RemotePredictionRow[]>('predictions?order=created_at.desc&limit=50');
}

export async function submitRemotePrediction(name: string, predicted_date: string): Promise<boolean> {
  const result = await supabaseFetch<RemotePredictionRow[]>('predictions', {
    method: 'POST',
    body: JSON.stringify({ name, predicted_date }),
  });
  return Boolean(result);
}
