import { EXTENSION_ID, SYNC_STORAGE_KEYS } from '@/config/sync';

/**
 * A `Storage`-shaped adapter for supabase-js, backed by `localStorage`.
 *
 * The one extra behaviour: on the *first* read of the auth-token key it also
 * asks the CTRL+BLCK extension whether it is holding a fresher session. The
 * extension refreshes the Supabase access token on its own whenever no dashboard
 * tab is open (so it can keep syncing and blocking newly-added sites). Without
 * this hand-off, supabase-js would load its now-stale persisted session on the
 * next visit, try to refresh an already-rotated refresh token, and sign the user
 * out. After that first read the website owns the session again and this adapter
 * is a plain `localStorage` pass-through, additionally mirroring writes back to
 * the extension so both sides stay on the same refresh-token chain.
 */

const AUTH_TOKEN_KEY = SYNC_STORAGE_KEYS.supabaseAuthToken;

interface ChromeRuntime {
  sendMessage?: (
    extensionId: string,
    message: unknown,
    callback?: (response?: unknown) => void
  ) => void;
  lastError?: { message?: string };
}

declare const chrome: { runtime?: ChromeRuntime } | undefined;

function getRuntime(): ChromeRuntime | undefined {
  try {
    return typeof chrome !== 'undefined' ? chrome.runtime : undefined;
  } catch {
    return undefined;
  }
}

type StoredSession = { access_token?: unknown; expires_at?: unknown } & Record<string, unknown>;

/** Ask the extension for the session it holds. Resolves null when the extension
 *  is absent or slow to answer. */
function requestExtensionSession(timeoutMs = 700): Promise<StoredSession | null> {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const done = (value: StoredSession | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      runtime.sendMessage!(EXTENSION_ID, { action: 'getSupabaseSession' }, (response?: unknown) => {
        if (runtime.lastError) return done(null);
        const session = (response as { session?: StoredSession } | undefined)?.session;
        done(session && typeof session === 'object' ? session : null);
      });
    } catch {
      done(null);
    }

    setTimeout(() => done(null), timeoutMs);
  });
}

/** Best-effort: hand the extension the session the website just persisted. */
function pushExtensionSession(session: unknown): void {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) return;
  try {
    runtime.sendMessage(EXTENSION_ID, { action: 'setSupabaseSession', session }, () => {
      // Reading lastError suppresses Chrome's "unchecked runtime.lastError" noise
      // when the extension isn't installed.
      void runtime.lastError;
    });
  } catch {
    /* extension not installed — ignore */
  }
}

function expiryOf(raw: string | null): number {
  if (!raw) return 0;
  try {
    return Number((JSON.parse(raw) as StoredSession)?.expires_at) || 0;
  } catch {
    return 0;
  }
}

let extensionConsulted = false;

export const extensionAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const local = window.localStorage.getItem(key);

    if (key !== AUTH_TOKEN_KEY || extensionConsulted) return local;
    extensionConsulted = true;

    const extSession = await requestExtensionSession();
    if (!extSession || !extSession.access_token) return local;

    // Only adopt the extension's copy when it is genuinely newer — i.e. it
    // refreshed the token while this site was closed.
    if (Number(extSession.expires_at) > expiryOf(local)) {
      const serialized = JSON.stringify(extSession);
      try {
        window.localStorage.setItem(key, serialized);
      } catch {
        /* quota — still return the fresher session */
      }
      return serialized;
    }
    return local;
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    if (key === AUTH_TOKEN_KEY) {
      try {
        pushExtensionSession(JSON.parse(value));
      } catch {
        /* value wasn't JSON (unexpected) — ignore */
      }
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};
