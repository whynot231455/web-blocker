'use client';

import { SYNC_STORAGE_KEYS } from '@/config/sync';

/**
 * True when the visitor is a returning guest with a non-empty saved block
 * list: guest flag set AND at least one stored site with a truthy URL.
 * Corrupt JSON or missing keys → false (never crash, never redirect).
 */
export function hasGuestSitesForRedirect(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (localStorage.getItem(SYNC_STORAGE_KEYS.guestFlag) !== 'true') return false;
        const raw = localStorage.getItem(SYNC_STORAGE_KEYS.guestSites);
        if (!raw) return false;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return false;
        return parsed.some((site) => typeof site === 'object' && site !== null && Boolean((site as { url?: unknown }).url));
    } catch {
        return false;
    }
}

/**
 * Validate a `?returnTo=` target: must be a same-origin path (starts with
 * a single `/`). Anything else falls back to `/dashboard`.
 */
export function getSafeReturnTo(raw: string | null, fallback = '/dashboard'): string {
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return fallback;
}
