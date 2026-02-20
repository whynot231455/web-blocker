'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

    const fetchSites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
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
    }, []);

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
            const { data: { user } } = await supabase.auth.getUser();
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
        fetchSites();
    }, [fetchSites]);

    return { sites, loading, error, addSite, deleteSite, toggleSite, refresh: fetchSites };
};
