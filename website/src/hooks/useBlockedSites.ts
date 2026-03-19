'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { BlockedSite } from '@/types/blockedSite';

/** Sanitize a URL string into a clean hostname */
function sanitizeUrl(raw: string): string {
    let url = raw.trim().toLowerCase();
    // Strip protocol if present
    url = url.replace(/^https?:\/\//i, '');
    // Strip trailing slashes and paths — we only block the hostname
    url = url.split('/')[0];
    return url;
}

/** Basic hostname validation */
function isValidDomain(domain: string): boolean {
    // Must have at least one dot and valid chars
    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    return domainRegex.test(domain);
}

export const useBlockedSites = () => {
    const [sites, setSites] = useState<BlockedSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { user, isGuest, loading: authLoading } = useAuth();

    const fetchSites = useCallback(async () => {
        // Wait for auth to initialize, but don't return if we are already showing sites 
        // (to allow refreshes even if auth is "loading" briefly during session refresh)
        if (authLoading && sites.length === 0) return;
        
        try {
            setLoading(true);
            setError(null);

            if (isGuest) {
                const localData = localStorage.getItem('ctrl_blck_sites');
                const parsed = localData ? JSON.parse(localData) : [];
                
                // Map to ensure it follows the BlockedSite interface
                const mapped: BlockedSite[] = Array.isArray(parsed) ? parsed.map((s: any) => ({
                    id: s.id || Date.now().toString(),
                    url: s.url || '',
                    user_id: s.user_id || 'guest',
                    is_active: s.is_active !== undefined ? s.is_active : true,
                    created_at: s.created_at || s.createdAt || new Date().toISOString()
                })) : [];

                setSites(mapped);
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
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;
            setSites(data ?? []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sites';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [isGuest, authLoading, supabase, user, sites.length]);

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

            if (isGuest) {
                const newSite: BlockedSite = {
                    id: Math.random().toString(36).substring(2, 11),
                    url,
                    user_id: 'guest',
                    is_active: true,
                    created_at: new Date().toISOString()
                };
                const updatedSites = [newSite, ...sites];
                setSites(updatedSites);
                localStorage.setItem('ctrl_blck_sites', JSON.stringify(updatedSites));
                return newSite;
            }

            if (!user) throw new Error('Not authenticated');

            const { data, error: dbError } = await supabase
                .from('blocked_sites')
                .insert([{ url, user_id: user.id, is_active: true }])
                .select()
                .single();

            if (dbError) throw dbError;
            setSites(prev => [data, ...prev]);
            return data;
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
                localStorage.setItem('ctrl_blck_sites', JSON.stringify(updatedSites));
                return;
            }

            const { error: dbError } = await supabase
                .from('blocked_sites')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;
            setSites(prev => prev.filter(s => s.id !== id));
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
                localStorage.setItem('ctrl_blck_sites', JSON.stringify(updatedSites));
                return;
            }

            const { error: dbError } = await supabase
                .from('blocked_sites')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (dbError) throw dbError;
            setSites(prev =>
                prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)
            );
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
            if (e.key === 'ctrl_blck_sites' || e.key === 'ctrl_blck_guest') {
                fetchSites();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('ctrl-blck-sync', fetchSites as EventListener);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ctrl-blck-sync', fetchSites as EventListener);
        };
    }, [fetchSites]);

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
