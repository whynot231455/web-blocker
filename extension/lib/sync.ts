import { supabase } from './supabaseClient';

export const syncBlockedSites = async (userId: string) => {
    const { data, error } = await supabase
        .from('blocked_sites')
        .select('url, is_active')
        .eq('user_id', userId);

    if (error) {
        console.error('Error syncing blocked sites:', error);
        return null;
    }

    // Update chrome.storage.local with synced data
    const sites = data.map(site => site.url);
    await chrome.storage.local.set({ blockedSites: sites });

    return sites;
};
