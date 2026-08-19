'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BlockedSite } from '@/types/blockedSite';
import { SYNC_STORAGE_KEYS } from '@/config/sync';
import { isValidDomain, sanitizeUrl } from '@/lib/url';
import { buildBlockedSitesSignature, normalizeAccessWindow, type AccessWindow } from '@/lib/schedule';
import { supabase } from '@/lib/supabaseClient';

const GUEST_SITES_SIGNATURE_KEY = SYNC_STORAGE_KEYS.blockedSitesSignature;
const SUPABASE_TABLE = 'blocked_sites';

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
        return `local_${btoa(cleanUrl).substring(0, 40)}`;
    } catch {
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
    const { user, loading: authLoading } = useAuth();
    const hasFetchedRef = useRef(false);

    // ─────────────────────────────────────────────────────────────────────────
    // Fetch sites depending on whether the user is authenticated or a guest
    // ─────────────────────────────────────────────────────────────────────────
    const fetchSites = useCallback(async () => {
        // Wait for auth to initialize on first fetch
        if (authLoading && !hasFetchedRef.current) return;

        try {
            setLoading(true);
            setError(null);

            if (user) {
                // ── Authenticated: fetch from Supabase ──────────────────────
                const { data, error: dbError } = await supabase
                    .from(SUPABASE_TABLE)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (dbError) throw new Error(dbError.message);

                const mapped: BlockedSite[] = (data ?? [])
                    .map((s: Partial<BlockedSite> & { createdAt?: string }) => normalizeSite(s))
                    .filter((site): site is BlockedSite => Boolean(site));

                // De-duplicate by URL
                const uniqueMapped = Array.from(new Map(mapped.map(s => [s.url, s])).values());
                setSites(uniqueMapped);

                // Keep the guestSites mirror + signature fresh so the extension's
                // syncDashboardToExtension() never re-adds sites deleted here.
                if (typeof window !== 'undefined') {
                    persistGuestSites(uniqueMapped);
                }
            } else {
                // ── Guest: read from localStorage ───────────────────────────
                const localData = localStorage.getItem(SYNC_STORAGE_KEYS.guestSites);
                const parsed = localData ? JSON.parse(localData) : [];

                const mapped: BlockedSite[] = Array.isArray(parsed)
                    ? parsed
                        .map((s: Partial<BlockedSite> & { createdAt?: string }) => normalizeSite(s))
                        .filter((site): site is BlockedSite => Boolean(site))
                    : [];

                const uniqueMapped = Array.from(new Map(mapped.map(s => [s.url, s])).values());
                setSites(uniqueMapped);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(GUEST_SITES_SIGNATURE_KEY, buildSitesSignature(uniqueMapped));
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sites';
            setError(message);
        } finally {
            hasFetchedRef.current = true;
            setLoading(false);
        }
    }, [authLoading, user]);

    // ─────────────────────────────────────────────────────────────────────────
    // Add a site
    // ─────────────────────────────────────────────────────────────────────────
    const addSite = async (rawUrl: string, accessWindow: AccessWindow | null = null): Promise<BlockedSite | null> => {
        const url = sanitizeUrl(rawUrl);

        if (!isValidDomain(url)) {
            setError('Invalid domain. Example: youtube.com');
            return null;
        }

        if (sites.some(s => s.url === url)) {
            setError(`${url} is already in your block list`);
            return null;
        }

        try {
            setError(null);

            if (user) {
                // ── Authenticated: write to Supabase ────────────────────────
                const { data, error: dbError } = await supabase
                    .from(SUPABASE_TABLE)
                    .insert({
                        url,
                        user_id: user.id,
                        is_active: true,
                        access_window: normalizeAccessWindow(accessWindow)
                    })
                    .select()
                    .single();

                if (dbError) throw new Error(dbError.message);
                const newSite = normalizeSite(data);
                if (!newSite) throw new Error('Failed to normalize new site');

                const updatedSites = [newSite, ...sites];
                setSites(updatedSites);
                persistGuestSites(updatedSites);
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                return newSite;
            } else {
                // ── Guest: write to localStorage ────────────────────────────
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
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                return newSite;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to add site';
            setError(message);
            return null;
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Update access window
    // ─────────────────────────────────────────────────────────────────────────
    const updateSiteSchedule = async (id: string, accessWindow: AccessWindow | null): Promise<BlockedSite | null> => {
        try {
            setError(null);
            const normalizedWindow = normalizeAccessWindow(accessWindow);

            if (user) {
                const { data, error: dbError } = await supabase
                    .from(SUPABASE_TABLE)
                    .update({ access_window: normalizedWindow })
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (dbError) throw new Error(dbError.message);
                const updatedSite = normalizeSite(data);
                const updatedSites = sites.map(site => site.id === id ? (updatedSite ?? site) : site);
                setSites(updatedSites);
                persistGuestSites(updatedSites);
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                return updatedSite;
            } else {
                const updatedSites = sites.map(site =>
                    site.id === id ? { ...site, access_window: normalizedWindow } : site
                );
                const target = updatedSites.find(site => site.id === id) || null;
                setSites(updatedSites);
                persistGuestSites(updatedSites);
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                return target;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update site schedule';
            setError(message);
            return null;
        }
    };

    // Remove only the time-window configuration. The site remains in the main
    // dashboard block list and therefore returns to all-day blocking.
    const removeSiteSchedule = async (id: string): Promise<BlockedSite | null> => {
        return updateSiteSchedule(id, null);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Delete a site
    // ─────────────────────────────────────────────────────────────────────────
    const deleteSite = async (id: string): Promise<void> => {
        try {
            setError(null);

            if (user) {
                const { error: dbError } = await supabase
                    .from(SUPABASE_TABLE)
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id);

                if (dbError) throw new Error(dbError.message);
            }

            const updatedSites = sites.filter(s => s.id !== id);
            setSites(updatedSites);
            // Keep the guestSites mirror fresh so syncDashboardToExtension() doesn't re-add the site
            if (typeof window !== 'undefined') {
                persistGuestSites(updatedSites);
            }
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete site';
            setError(message);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Toggle a site's active status
    // ─────────────────────────────────────────────────────────────────────────
    const toggleSite = async (id: string, currentStatus: boolean): Promise<void> => {
        try {
            setError(null);
            const newStatus = !currentStatus;

            if (user) {
                const { error: dbError } = await supabase
                    .from(SUPABASE_TABLE)
                    .update({ is_active: newStatus })
                    .eq('id', id)
                    .eq('user_id', user.id);

                if (dbError) throw new Error(dbError.message);
            }

            const updatedSites = sites.map(s =>
                s.id === id ? { ...s, is_active: newStatus } : s
            );
            setSites(updatedSites);
            // Keep the guestSites mirror fresh so the extension sees the toggle immediately
            if (typeof window !== 'undefined') {
                persistGuestSites(updatedSites);
            }
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to toggle site';
            setError(message);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Mount + event listeners
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        setIsMounted(true);
        fetchSites();

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
        window.addEventListener('ctrl-blck-ui-refresh', fetchSites as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ctrl-blck-sync', fetchSites as EventListener);
            window.removeEventListener('ctrl-blck-ui-refresh', fetchSites as EventListener);
        };
    }, [fetchSites]);

    return {
        sites,
        loading: !isMounted || loading || (authLoading && sites.length === 0),
        error,
        addSite,
        updateSiteSchedule,
        removeSiteSchedule,
        deleteSite,
        toggleSite,
        refresh: fetchSites
    };
};
