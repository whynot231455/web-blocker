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

// Placeholder origin used only to resolve return targets; never navigated to.
const RETURN_TO_BASE = 'https://return-to.invalid';

/**
 * Validate a `?returnTo=` target: must resolve to a same-origin path.
 * Anything else falls back to `/dashboard`.
 *
 * A prefix check is not enough: browsers read `/\evil.com` as `//evil.com`
 * and strip tabs/newlines (`/%09/evil.com`), so the router would leave the
 * site. Resolving with the URL parser — the same one the router uses —
 * catches every such variant.
 */
export function getSafeReturnTo(raw: string | null, fallback = '/dashboard'): string {
    if (!raw || !raw.startsWith('/')) return fallback;
    try {
        const url = new URL(raw, RETURN_TO_BASE);
        if (url.origin !== RETURN_TO_BASE) return fallback;
        const path = `${url.pathname}${url.search}${url.hash}`;
        // Dot segments can normalize into a protocol-relative path
        // (`/.//evil.com` -> `//evil.com`), so the result must resolve
        // same-origin too.
        return new URL(path, RETURN_TO_BASE).origin === RETURN_TO_BASE ? path : fallback;
    } catch {
        return fallback;
    }
}
