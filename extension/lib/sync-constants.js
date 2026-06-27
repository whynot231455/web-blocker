globalThis.CTRL_BLCK_SYNC = {
    debugMode: false, // Set to true to enable verbose console logging across all content scripts
    supabaseUrl: globalThis.CTRL_BLCK_CONFIG?.supabaseUrl || 'https://laovgvktsxwiieuznnlm.supabase.co',
    supabaseKey: globalThis.CTRL_BLCK_CONFIG?.supabaseKey || '',
    dashboardMetaName: 'ctrl-blck-dashboard',
    dashboardOrigins: ['https://ctrl-blck.vercel.app', 'http://localhost:3000'],
    defaultDashboardOrigin: 'https://ctrl-blck.vercel.app',
    dashboardPaths: {
        login: '/login',
        dashboard: '/dashboard'
    },
    storageKeys: {
        supabaseAuthToken: 'sb-laovgvktsxwiieuznnlm-auth-token',
        supabaseSession: 'supabase_session',
        dashboardOrigin: 'dashboard_origin',
        blockedSites: 'urls',
        blockedSiteSchedules: 'blocked_site_schedules',
        blockedSitesSignature: 'ctrl_blck_sites_signature',
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
        syncSettings: 'syncSettings',
        getSyncStatus: 'getSyncStatus',
        syncStatusUpdated: 'syncStatusUpdated',
        requestDashboardSync: 'requestDashboardSync'
    },
    /**
     * @param {string} url
     */
    normalizeHostname: function (url) {
        return globalThis.CTRL_BLCK_URL_UTILS ? globalThis.CTRL_BLCK_URL_UTILS.normalizeHostname(url) : null;
    }
};
