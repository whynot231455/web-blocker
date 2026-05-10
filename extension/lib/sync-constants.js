globalThis.CTRL_BLCK_SYNC = {
    debugMode: false, // Set to true to enable verbose console logging across all content scripts
    supabaseUrl: globalThis.CTRL_BLCK_CONFIG?.supabaseUrl || 'https://laovgvktsxwiieuznnlm.supabase.co',
    supabaseKey: globalThis.CTRL_BLCK_CONFIG?.supabaseKey || '',
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
        clearSitesFromSupabase: 'clearSitesFromSupabase',
        triggerDashboardRefresh: 'triggerDashboardRefresh',
        syncSettings: 'syncSettings'
    },
    /**
     * @param {string} url
     */
    normalizeHostname: function (url) {
        return globalThis.CTRL_BLCK_URL_UTILS ? globalThis.CTRL_BLCK_URL_UTILS.normalizeHostname(url) : null;
    }
};
