/**
 * Canonical guest-mode site records and their blocking projection.
 * This is loaded after url-utils.js and schedule-utils.js in extension contexts.
 */
if (!globalThis.CTRL_BLCK_GUEST_SITE_STORE) {
    const syncConfig = globalThis.CTRL_BLCK_SYNC;
    const scheduleUtils = globalThis.CTRL_BLCK_SCHEDULE_UTILS;

    function stableId(url) {
        return `local_${btoa(url).substring(0, 40)}`;
    }

    function normalizeSite(site) {
        const url = syncConfig?.normalizeHostname(site?.url);
        if (!url) return null;
        return {
            id: typeof site?.id === 'string' && site.id ? site.id : stableId(url),
            url,
            user_id: 'guest',
            is_active: site?.is_active !== false,
            created_at: typeof site?.created_at === 'string' ? site.created_at : new Date().toISOString(),
            access_window: scheduleUtils?.normalizeAccessWindow
                ? scheduleUtils.normalizeAccessWindow(site?.access_window || null)
                : null
        };
    }

    function normalizeSites(sites) {
        const byUrl = new Map();
        (Array.isArray(sites) ? sites : []).forEach((site) => {
            const normalized = normalizeSite(site);
            if (normalized) byUrl.set(normalized.url, normalized);
        });
        return [...byUrl.values()];
    }

    function fromLegacyUrls(urls, schedules = {}) {
        return normalizeSites((Array.isArray(urls) ? urls : []).map((url) => ({
            url,
            is_active: true,
            access_window: schedules && typeof schedules === 'object'
                ? schedules[syncConfig.normalizeHostname(url)] || null
                : null
        })));
    }

    function project(records) {
        const sites = normalizeSites(records);
        const activeSites = sites.filter((site) => site.is_active !== false);
        return {
            sites,
            urls: activeSites.map((site) => site.url),
            schedules: Object.fromEntries(activeSites.map((site) => [site.url, site.access_window])),
            signature: scheduleUtils?.buildBlockedSitesSignature
                ? scheduleUtils.buildBlockedSitesSignature(sites)
                : ''
        };
    }

    globalThis.CTRL_BLCK_GUEST_SITE_STORE = { normalizeSite, normalizeSites, fromLegacyUrls, project };
}
