import { supabase } from './supabaseClient';

/**
 * Fetches the user's active blocked sites from Supabase and syncs
 * them into chrome.storage.local. Only active sites are synced.
 */
export const syncBlockedSites = async (userId: string): Promise<string[] | null> => {
    if (!userId) {
        console.warn('syncBlockedSites called without a userId');
        return null;
    }

    const { data, error } = await supabase
        .from('blocked_sites')
        .select('url, is_active')
        .eq('user_id', userId)
        .eq('is_active', true); // Only sync active rules

    if (error) {
        console.error('Error syncing blocked sites:', error.message);
        return null;
    }

    const sites = (data ?? []).map(site => site.url as string);

    try {
        await chrome.storage.local.set({ blockedSites: sites });
    } catch (storageErr) {
        console.error('Failed to update chrome.storage.local:', storageErr);
        return null;
    }

    return sites;
};
