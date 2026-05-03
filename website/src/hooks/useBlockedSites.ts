'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { BlockedSite } from '@/types/blockedSite';
import { SYNC_STORAGE_KEYS } from '@/config/sync';
import { isValidDomain, sanitizeUrl } from '@/lib/url';

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

export const useBlockedSites = () => {
    const [sites, setSites] = useState<BlockedSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { user, isGuest, loading: authLoading } = useAuth();
    const hasFetchedRef = useRef(false);

    const fetchSites = useCallback(async () => {
        // Wait for auth to initialize on first fetch
        if (authLoading && !hasFetchedRef.current) return;
        
        try {
            setLoading(true);
            setError(null);

            if (isGuest) {
                const localData = localStorage.getItem(SYNC_STORAGE_KEYS.guestSites);
                const parsed = localData ? JSON.parse(localData) : [];
                
                // Map to ensure it follows the BlockedSite interface and has stable IDs
                const mapped: BlockedSite[] = Array.isArray(parsed) ? parsed.map((s: Partial<BlockedSite> & { createdAt?: string }) => {
                    const url = s.url || '';
                    return {
                        id: getStableId(url),
                        url: url,
                        user_id: s.user_id || 'guest',
                        is_active: s.is_active !== undefined ? s.is_active : true,
                        created_at: s.created_at || s.createdAt || new Date().toISOString()
                    };
                }) : [];

                // De-duplicate by URL to prevent UI glitches if storage somehow gets corrupted
                const uniqueMapped = Array.from(new Map(mapped.map(s => [s.url, s])).values());
                setSites(uniqueMapped);
                setLoading(false);
                return;
            }

            if (!user) {
                setSites([]);
                setLoading(false);
                return;
            }

            const { data, error: dbError } = await supabase
                .from('blocked_sites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;
            setSites(data ?? []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sites';
            setError(message);
        } finally {
            hasFetchedRef.current = true;
            setLoading(false);
        }
    }, [authLoading, isGuest, user]);

    const addSite = async (rawUrl: string): Promise<BlockedSite | null> => {
        const url = sanitizeUrl(rawUrl);

        if (!isValidDomain(url)) {
            setError('Invalid domain. Example: youtube.com');
            return null;
        }

        // Check for duplicates before hitting the DB
        if (sites.some(s => s.url === url)) {
            setError(`${url} is already in your block list`);
            return null;
        }

        try {
            setError(null);

            if (!isGuest) {
                if (!user) throw new Error('Not authenticated');

                const { data, error: dbError } = await supabase
                    .from('blocked_sites')
                    .insert([{ url, user_id: user.id, is_active: true }])
                    .select()
                    .single();

                if (dbError) throw dbError;
                setSites(prev => [data, ...prev]);
                
                // Notify the content script for immediate sync
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                return data;
            }

            // Guest Mode
            const newSite: BlockedSite = {
                id: getStableId(url),
                url,
                user_id: 'guest',
                is_active: true,
                created_at: new Date().toISOString()
            };
            const updatedSites = [newSite, ...sites];
            setSites(updatedSites);
            localStorage.setItem(SYNC_STORAGE_KEYS.guestSites, JSON.stringify(updatedSites));
            
            // Notify the content script for immediate sync
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            return newSite;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to add site';
            setError(message);
            return null;
        }
    };

    const deleteSite = async (id: string): Promise<void> => {
        try {
            setError(null);

            if (isGuest) {
                const updatedSites = sites.filter(s => s.id !== id);
                setSites(updatedSites);
                localStorage.setItem(SYNC_STORAGE_KEYS.guestSites, JSON.stringify(updatedSites));
            } else {
                const { error: dbError } = await supabase
                    .from('blocked_sites')
                    .delete()
                    .eq('id', id);

                if (dbError) throw dbError;
                setSites(prev => prev.filter(s => s.id !== id));
            }

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

            if (isGuest) {
                const updatedSites = sites.map(s =>
                    s.id === id ? { ...s, is_active: !currentStatus } : s
                );
                setSites(updatedSites);
                localStorage.setItem(SYNC_STORAGE_KEYS.guestSites, JSON.stringify(updatedSites));
            } else {
                const { error: dbError } = await supabase
                    .from('blocked_sites')
                    .update({ is_active: !currentStatus })
                    .eq('id', id);

                if (dbError) throw dbError;
                setSites(prev =>
                    prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)
                );
            }

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
            if (e.key === SYNC_STORAGE_KEYS.guestSites || e.key === SYNC_STORAGE_KEYS.guestFlag) {
                fetchSites();
            }
        };

        let cleanupRealtime = () => {};

        if (user && !isGuest) {
            const channel = supabase
                .channel(`blocked-sites-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'blocked_sites',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        fetchSites();
                    }
                )
                .subscribe();

            cleanupRealtime = () => {
                void supabase.removeChannel(channel);
            };
        }

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('ctrl-blck-sync', fetchSites as EventListener);
        
        return () => {
            cleanupRealtime();
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ctrl-blck-sync', fetchSites as EventListener);
        };
    }, [fetchSites, isGuest, user]);

    return { 
        sites, 
        loading: !isMounted || loading || (authLoading && sites.length === 0), 
        error, 
        addSite, 
        deleteSite, 
        toggleSite, 
        refresh: fetchSites 
    };
};
