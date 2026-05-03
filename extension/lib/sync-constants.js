globalThis.CTRL_BLCK_SYNC = {
    supabaseUrl: 'https://laovgvktsxwiieuznnlm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3Zndmt0c3h3aWlldXpubmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY0MDIsImV4cCI6MjA4NzE0MjQwMn0.ZZBc9I7QLAer9cb05okS2yKcB-m8WZgKqgdQtkCbfLI',
    dashboardMetaName: 'ctrl-blck-dashboard',
    dashboardOrigins: ['http://localhost:3000', 'https://ctrl-blck.vercel.app'],
    defaultDashboardOrigin: 'http://localhost:3000',
    dashboardPaths: {
        login: '/login',
        dashboard: '/dashboard'
    },
    storageKeys: {
        supabaseAuthToken: 'sb-laovgvktsxwiieuznnlm-auth-token',
        supabaseSession: 'supabase_session',
        dashboardOrigin: 'dashboard_origin',
        blockedSites: 'urls',
        guestFlag: 'ctrl_blck_guest',
        guestSites: 'ctrl_blck_sites'
    },
    messageActions: {
        syncSession: 'syncSession',
        clearSession: 'clearSession',
        syncGuestStatus: 'syncGuestStatus',
        syncUrls: 'syncUrls',
        syncDashboardOrigin: 'syncDashboardOrigin',
        triggerSync: 'triggerSync',
        addSiteToSupabase: 'addSiteToSupabase',
        deleteSiteFromSupabase: 'deleteSiteFromSupabase',
        clearSitesFromSupabase: 'clearSitesFromSupabase'
    },
    /**
     * @param {string} url
     */
    normalizeHostname: function (url) {
        if (!url || typeof url !== 'string') return null;
        try {
            let cleaned = url.trim().toLowerCase();
            // Remove protocol
            cleaned = cleaned.replace(/^https?:\/\//i, '');
            // Remove path and query
            cleaned = cleaned.split('/')[0].split('?')[0];
            // Remove leading www.
            if (cleaned.startsWith('www.')) {
                cleaned = cleaned.substring(4);
            }
            return cleaned || null;
        } catch (error) {
            return null;
        }
    }
};
