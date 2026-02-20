'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BlockedSite } from '@/types/blockedSite';

export const useBlockedSites = () => {
    const [sites, setSites] = useState<BlockedSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSites = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('blocked_sites')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSites(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addSite = async (url: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('blocked_sites')
                .insert([{ url, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setSites([data, ...sites]);
            return data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const deleteSite = async (id: string) => {
        try {
            const { error } = await supabase
                .from('blocked_sites')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSites(sites.filter(s => s.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const toggleSite = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('blocked_sites')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setSites(sites.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    return { sites, loading, error, addSite, deleteSite, toggleSite, refresh: fetchSites };
};
