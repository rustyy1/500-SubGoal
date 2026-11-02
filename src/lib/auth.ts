const SESSION_PROFILE_KEY = 'rustyy_pilot_profile_v1';
const LEGACY_USERNAME_KEY = 'rustyy_player_username_v1';

export interface PilotProfile {
  id: string;
  tag: string;
  tag_lower: string;
  token: string;
  claimedAt: number;
}

const RESERVED_TAGS = new Set([
  'rustyy',
  'the_rustyy',
  'creator',
  'admin',
  'administrator',
  'system',
  'moderator',
  'official',
  'guest',
  'owner',
  'root',
  'support',
]);

/**
 * Validates a GamerTag according to competitive web rules.
 * Length: 3-16 chars. Letters, digits, underscores only.
 */
export function validateGamerTag(tag: string): { valid: boolean; error?: string } {
  const trimmed = tag.trim();
  if (!trimmed) {
    return { valid: false, error: 'GamerTag cannot be empty.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'GamerTag must be at least 3 characters.' };
  }
  if (trimmed.length > 16) {
    return { valid: false, error: 'GamerTag cannot exceed 16 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Only letters, numbers, and underscores (_) are allowed.' };
  }
  if (RESERVED_TAGS.has(trimmed.toLowerCase())) {
    return { valid: false, error: `"${trimmed}" is a reserved system tag.` };
  }
  return { valid: true };
}

/**
 * Validates a 4 to 6 digit security PIN.
 */
export function validateSecurityPin(pin: string): { valid: boolean; error?: string } {
  const trimmed = pin.trim();
  if (!/^[0-9]{4,6}$/.test(trimmed)) {
    return { valid: false, error: 'PIN must be 4 to 6 numeric digits (0-9).' };
  }
  return { valid: true };
}

/**
 * Produces a SHA-256 hash using the native Web Crypto API.
 */
export async function hashSecurityPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`rustyy_${salt}_${pin.trim()}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a unique cryptographically secure device session token.
 */
export function generateDeviceToken(): string {
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Retrieves the currently authenticated pilot profile from local session storage.
 */
export function getActivePilotProfile(): PilotProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tag && parsed.token) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Check legacy username key if present
  try {
    const legacy = localStorage.getItem(LEGACY_USERNAME_KEY);
    if (legacy && legacy.trim()) {
      return {
        id: `legacy_${Date.now()}`,
        tag: legacy.trim(),
        tag_lower: legacy.trim().toLowerCase(),
        token: 'legacy_local_token',
        claimedAt: Date.now(),
      };
    }
  } catch {
    // fallback
  }

  return null;
}

/**
 * Persists an authenticated pilot profile to local storage.
 */
export function saveActivePilotProfile(profile: PilotProfile): void {
  try {
    localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
    // Keep legacy key in sync for backwards compatibility
    localStorage.setItem(LEGACY_USERNAME_KEY, profile.tag);
  } catch {
    // no-op
  }
}

/**
 * Clears the active pilot session (logs out).
 */
export function clearActivePilotProfile(): void {
  try {
    localStorage.removeItem(SESSION_PROFILE_KEY);
    localStorage.removeItem(LEGACY_USERNAME_KEY);
  } catch {
    // no-op
  }
}
