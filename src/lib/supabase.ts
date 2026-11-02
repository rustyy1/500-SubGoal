const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://cvcjhxdzyptjzgdopmbr.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2poeGR6eXB0anpnZG9wbWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MzYwODAsImV4cCI6MjEwOTIxMjA4MH0.lJ9IqyTASoNARVFTKLK6UiB3T84C0dz4YoRSgBMxb4k';

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

// ----------------- LEADERBOARD -----------------
export async function getRemoteLeaderboard(game: 'target' | 'runner' | 'trivia'): Promise<RemoteLeaderboardRow[] | null> {
  return supabaseFetch<RemoteLeaderboardRow[]>(`leaderboard?game=eq.${game}&order=score.desc&limit=10`);
}

export async function submitRemoteScore(game: 'target' | 'runner' | 'trivia', name: string, score: number): Promise<boolean> {
  const result = await supabaseFetch<RemoteLeaderboardRow[]>('leaderboard', {
    method: 'POST',
    body: JSON.stringify({ game, name, score }),
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
