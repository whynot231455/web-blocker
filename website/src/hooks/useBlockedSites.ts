'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BlockedSite } from '@/types/blockedSite';
import { SYNC_STORAGE_KEYS } from '@/config/sync';
import { isValidDomain, sanitizeUrl } from '@/lib/url';
import { buildBlockedSitesSignature, normalizeAccessWindow, type AccessWindow } from '@/lib/schedule';

const GUEST_SITES_SIGNATURE_KEY = SYNC_STORAGE_KEYS.blockedSitesSignature;

function buildSitesSignature(sites: BlockedSite[]): string {
    return buildBlockedSitesSignature(sites);
}

function persistGuestSites(sites: BlockedSite[]) {
    localStorage.setItem(SYNC_STORAGE_KEYS.guestSites, JSON.stringify(sites));
    localStorage.setItem(GUEST_SITES_SIGNATURE_KEY, buildSitesSignature(sites));
}

/** Generate a stable ID for guest mode sites based on URL */
function getStableId(url: string): string {
    try {
        const cleanUrl = url.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];
        // Use btoa for a simple stable string (consistent with extension)
        // Increased to 40 chars to avoid collisions (e.g., youtube.com vs youtube.co)
        return `local_${btoa(cleanUrl).substring(0, 40)}`;
    } catch {
        // Fallback for non-ascii if any
        return `local_${Math.random().toString(36).substring(2, 11)}`;
    }
}

function normalizeSite(site: Partial<BlockedSite> & { createdAt?: string }): BlockedSite | null {
    const url = sanitizeUrl(site.url || '');
    if (!url) return null;

    return {
        id: site.id || getStableId(url),
        url,
        user_id: site.user_id || 'guest',
        is_active: site.is_active !== false,
        created_at: site.created_at || site.createdAt || new Date().toISOString(),
        access_window: normalizeAccessWindow(site.access_window || null)
    };
}

export const useBlockedSites = () => {
    const [sites, setSites] = useState<BlockedSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { isGuest, loading: authLoading } = useAuth();
    const hasFetchedRef = useRef(false);

    const fetchSites = useCallback(async () => {
        // Wait for auth to initialize on first fetch
        if (authLoading && !hasFetchedRef.current) return;
        
        try {
            setLoading(true);
            setError(null);

            if (!isGuest) {
                setSites([]);
                setLoading(false);
                return;
            }

            const localData = localStorage.getItem(SYNC_STORAGE_KEYS.guestSites);
            const parsed = localData ? JSON.parse(localData) : [];

            const mapped: BlockedSite[] = Array.isArray(parsed)
                ? parsed.map((s: Partial<BlockedSite> & { createdAt?: string }) => normalizeSite(s)).filter((site): site is BlockedSite => Boolean(site))
                : [];

            // De-duplicate by URL to prevent UI glitches if storage somehow gets corrupted
            const uniqueMapped = Array.from(new Map(mapped.map(s => [s.url, s])).values());
            setSites(uniqueMapped);
            if (typeof window !== 'undefined') {
                localStorage.setItem(GUEST_SITES_SIGNATURE_KEY, buildSitesSignature(uniqueMapped));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sites';
            setError(message);
        } finally {
            hasFetchedRef.current = true;
            setLoading(false);
        }
    }, [authLoading, isGuest]);

    const addSite = async (rawUrl: string, accessWindow: AccessWindow | null = null): Promise<BlockedSite | null> => {
        const url = sanitizeUrl(rawUrl);

        if (!isValidDomain(url)) {
            setError('Invalid domain. Example: youtube.com');
            return null;
        }

        // Check for duplicates before writing local guest storage
        if (sites.some(s => s.url === url)) {
            setError(`${url} is already in your block list`);
            return null;
        }

        try {
            setError(null);

            const newSite: BlockedSite = {
                id: getStableId(url),
                url,
                user_id: 'guest',
                is_active: true,
                created_at: new Date().toISOString(),
                access_window: normalizeAccessWindow(accessWindow)
            };
            const updatedSites = [newSite, ...sites];
            setSites(updatedSites);
            persistGuestSites(updatedSites);
            
            // Notify the content script for immediate sync
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            return newSite;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to add site';
            setError(message);
            return null;
        }
    };

    const updateSiteSchedule = async (id: string, accessWindow: AccessWindow | null): Promise<BlockedSite | null> => {
        try {
            setError(null);

            const normalizedWindow = normalizeAccessWindow(accessWindow);
            const updatedSites = sites.map(site =>
                site.id === id ? { ...site, access_window: normalizedWindow } : site
            );
            const target = updatedSites.find(site => site.id === id) || null;
            setSites(updatedSites);
            persistGuestSites(updatedSites);

            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            return target;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update site schedule';
            setError(message);
            return null;
        }
    };

    const deleteSite = async (id: string): Promise<void> => {
        try {
            setError(null);

            const updatedSites = sites.filter(s => s.id !== id);
            setSites(updatedSites);
            persistGuestSites(updatedSites);

            // Notify the content script for immediate sync
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete site';
            setError(message);
        }
    };

    const toggleSite = async (id: string, currentStatus: boolean): Promise<void> => {
        try {
            setError(null);

            const updatedSites = sites.map(s =>
                s.id === id ? { ...s, is_active: !currentStatus } : s
            );
            setSites(updatedSites);
            persistGuestSites(updatedSites);

            // Notify the content script for immediate sync
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to toggle site';
            setError(message);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchSites();

        // Listen for storage changes from other tabs or content scripts
        const handleStorageChange = (e: StorageEvent) => {
            if (
                e.key === SYNC_STORAGE_KEYS.guestSites ||
                e.key === SYNC_STORAGE_KEYS.guestFlag ||
                e.key === GUEST_SITES_SIGNATURE_KEY
            ) {
                fetchSites();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('ctrl-blck-sync', fetchSites as EventListener);
        // Also listen for ctrl-blck-ui-refresh — fired internally by dashboard-sync.js
        // when the extension sync updates localStorage (e.g. site added via extension popup).
        // Safe to call fetchSites here: it only reads localStorage and updates React state.
        window.addEventListener('ctrl-blck-ui-refresh', fetchSites as EventListener);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ctrl-blck-sync', fetchSites as EventListener);
            window.removeEventListener('ctrl-blck-ui-refresh', fetchSites as EventListener);
        };
    }, [fetchSites, isGuest]);

    return { 
        sites, 
        loading: !isMounted || loading || (authLoading && sites.length === 0), 
        error, 
        addSite, 
        updateSiteSchedule,
        deleteSite, 
        toggleSite, 
        refresh: fetchSites
    };
};
