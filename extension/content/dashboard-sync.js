/**
 * @typedef {Object} LocalSite
 * @property {string} id
 * @property {string} url
 * @property {string} [user_id]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 * @property {{ enabled: boolean; start: string; end: string } | null} [access_window]
 */
/**
 * @typedef {Object} ActiveSession
 * @property {string} url
 * @property {string} start_time
 * @property {number} target_duration
 * @property {string} [status]
 */
const syncConfig = globalThis.CTRL_BLCK_SYNC;
const scheduleUtils = globalThis.CTRL_BLCK_SCHEDULE_UTILS;

if (!syncConfig) {
    console.error('CTRL+BLCK: Missing sync constants');
} else {
    const {
        dashboardMetaName,
        dashboardOrigins,
        storageKeys,
        messageActions
    } = syncConfig;
    const GUEST_FOCUS_SESSIONS_KEY = 'guest_focus_sessions';
    const LAST_SYNC_STATUS_KEY = 'lastSyncStatus';
    const SYNC_STATUS_REQUEST_EVENT = 'ctrl-blck-sync-status-request';
    const SYNC_STATUS_RESPONSE_EVENT = 'ctrl-blck-sync-status-response';
    const BLOCKED_SITES_SIGNATURE_KEY = storageKeys.blockedSitesSignature;
    const BLOCKED_SITE_SCHEDULES_KEY = storageKeys.blockedSiteSchedules || 'blocked_site_schedules';

    const isKnownOrigin = dashboardOrigins.includes(window.location.origin);
    const hasDashboardMarker = Boolean(document.querySelector(`meta[name="${dashboardMetaName}"]`));

    if (isKnownOrigin || hasDashboardMarker) {
        // Set DOM dataset marker to signal that the extension is installed
        document.documentElement.dataset.ctrlBlckInstalled = 'true';

        // Notify webpage via custom event in case it is already listening
        window.dispatchEvent(new CustomEvent('ctrl-blck-pong', { detail: { installed: true } }));

        // Listen for ping events from the webpage and reply with pong
        window.addEventListener('ctrl-blck-ping', () => {
            window.dispatchEvent(new CustomEvent('ctrl-blck-pong', { detail: { installed: true } }));
        });

        let lastDashboardUpdate = 0;
        const DEBUG = syncConfig.debugMode;

        // Debounce wrapper for syncDashboardToExtension — prevents burst re-entry
        // from rapid storage events or multiple ctrl-blck-sync dispatches.
        /** @type {number | null} */
        let syncDashboardDebounceTimer = null;
        function scheduleDashboardSync() {
            if (syncDashboardDebounceTimer !== null) clearTimeout(syncDashboardDebounceTimer);
            syncDashboardDebounceTimer = setTimeout(() => {
                syncDashboardDebounceTimer = null;
                syncDashboardToExtension();
            }, 300);
        }

        /** @type {number | null} */
        let publishStatusDebounceTimer = null;
        function schedulePublishStatus() {
            if (publishStatusDebounceTimer !== null) clearTimeout(publishStatusDebounceTimer);
            publishStatusDebounceTimer = setTimeout(() => {
                publishStatusDebounceTimer = null;
                void publishSyncStatus();
            }, 100);
        }

        /**
         * @param {unknown} value
         * @returns {string}
         */
        function readBlockedSitesSignature(value) {
            return typeof value === 'string' ? value : '';
        }

        /**
         * Determine whether this tab is allowed to authoritatively sync dashboard state.
         * The first known dashboard origin claims the slot; other origins become read-only.
         * @returns {Promise<boolean>}
         */
        async function isActiveDashboardOrigin() {
            const currentOrigin = window.location.origin;
            if (!dashboardOrigins.includes(currentOrigin)) {
                return false;
            }

            const result = await chrome.storage.local.get(storageKeys.dashboardOrigin);
            const storedOrigin = result[storageKeys.dashboardOrigin];

            if (typeof storedOrigin !== 'string' || !storedOrigin) {
                safeSend({
                    action: messageActions.syncDashboardOrigin,
                    origin: currentOrigin
                });
                return true;
            }

            if (storedOrigin === currentOrigin) {
                return true;
            }

            return false;
        }

        /**
         * @param {unknown} site
         * @returns {LocalSite | null}
         */
        function normalizeLocalSite(site) {
            const cleanUrl = syncConfig.normalizeHostname(site && site.url);
            if (!cleanUrl) return null;

            const accessWindow = scheduleUtils?.normalizeAccessWindow
                ? scheduleUtils.normalizeAccessWindow(site?.access_window || null)
                : null;

            return {
                id: site?.id || `local_${btoa(cleanUrl).substring(0, 40)}`,
                url: cleanUrl,
                user_id: site?.user_id || 'guest',
                is_active: site?.is_active !== false,
                created_at: site?.created_at || new Date().toISOString(),
                access_window: accessWindow
            };
        }

        /**
         * @param {LocalSite[]} sites
         */
        function writeLocalGuestSites(sites) {
            const normalizedSites = Array.isArray(sites)
                ? sites.map((site) => normalizeLocalSite(site)).filter(Boolean)
                : [];

            localStorage.setItem(storageKeys.guestSites, JSON.stringify(normalizedSites));
            localStorage.setItem(
                BLOCKED_SITES_SIGNATURE_KEY,
                scheduleUtils?.buildBlockedSitesSignature
                    ? scheduleUtils.buildBlockedSitesSignature(normalizedSites)
                    : ''
            );
        }

        /**
         * @returns {Promise<{ sites: LocalSite[]; signature: string }>}
         */
        async function readExtensionBlockedSites() {
            const result = await chrome.storage.local.get([
                storageKeys.blockedSites,
                BLOCKED_SITE_SCHEDULES_KEY,
                BLOCKED_SITES_SIGNATURE_KEY
            ]);
            const urls = Array.isArray(result[storageKeys.blockedSites])
                ? result[storageKeys.blockedSites]
                : [];
            const schedules = result[BLOCKED_SITE_SCHEDULES_KEY] && typeof result[BLOCKED_SITE_SCHEDULES_KEY] === 'object'
                ? result[BLOCKED_SITE_SCHEDULES_KEY]
                : {};

            const sites = urls.map((url) => {
                const cleanUrl = syncConfig.normalizeHostname(url);
                if (!cleanUrl) return null;
                return normalizeLocalSite({
                    id: `local_${btoa(cleanUrl).substring(0, 40)}`,
                    url: cleanUrl,
                    user_id: 'guest',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    access_window: schedules[cleanUrl] || null
                });
            }).filter(Boolean);

            return {
                sites,
                signature: readBlockedSitesSignature(result[BLOCKED_SITES_SIGNATURE_KEY]) || (scheduleUtils?.buildBlockedSitesSignature ? scheduleUtils.buildBlockedSitesSignature(sites) : '')
            };
        }

        /**
         * @returns {{ sites: LocalSite[]; signature: string }}
         */
        function readDashboardBlockedSites() {
            const parsedSites = parseStoredArray(localStorage.getItem(storageKeys.guestSites), 'sites');
            const sites = Array.isArray(parsedSites)
                ? parsedSites.map((site) => normalizeLocalSite(site)).filter(Boolean)
                : [];
            return {
                sites,
                signature: readBlockedSitesSignature(localStorage.getItem(BLOCKED_SITES_SIGNATURE_KEY)) || (scheduleUtils?.buildBlockedSitesSignature ? scheduleUtils.buildBlockedSitesSignature(sites) : '')
            };
        }

        /** Returns false if the extension has been reloaded/invalidated */
        function isExtensionAlive() {
            try {
                // Accessing chrome.runtime.id throws if the context is invalidated
                return Boolean(chrome.runtime?.id);
            } catch {
                return false;
            }
        }

        /**
         * Safe wrapper around chrome.runtime.sendMessage.
         * Silently swallows "context invalidated" and "receiving end does not exist" errors.
         * @param {any} payload
         */
        function safeSend(payload) {
            if (!isExtensionAlive()) return;
            try {
                chrome.runtime.sendMessage(payload).catch(() => {
                    // Swallow "Receiving end does not exist" — happens when the
                    // background worker is not yet ready or was reloaded.
                });
            } catch {
                // Swallow "Extension context invalidated" errors
            }
        }

        async function syncDashboardToExtension() {
            try {
                lastDashboardUpdate = Date.now();

                const canSync = await isActiveDashboardOrigin();
                if (!canSync) {
                    return;
                }

                const sessionData = localStorage.getItem(storageKeys.supabaseAuthToken);
                const localSites = localStorage.getItem(storageKeys.guestSites);
                const localSessions = localStorage.getItem(GUEST_FOCUS_SESSIONS_KEY);
                const sites = parseStoredArray(localSites, 'sites');
                const sessions = parseStoredArray(localSessions, 'focus sessions');
                const activeSession = Array.isArray(sessions)
                    ? sessions.find(session => session?.status === 'active') || null
                    : null;
                const hasGuestData = (Array.isArray(sites) && sites.length > 0) || Boolean(activeSession);
                const storedGuestStatus = localStorage.getItem(storageKeys.guestFlag) === 'true';
                const effectiveGuestStatus = storedGuestStatus || hasGuestData;

                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session && session.access_token && session.user?.id) {
                        safeSend({
                            action: messageActions.syncSession,
                            session: {
                                access_token: session.access_token,
                                user_id: session.user.id,
                                expires_at: session.expires_at
                            }
                        });
                    }
                } else {
                    safeSend({
                        action: messageActions.clearSession,
                        preserveGuestData: effectiveGuestStatus
                    });
                }

                safeSend({
                    action: messageActions.syncGuestStatus,
                    isGuest: effectiveGuestStatus
                });

                const normalizedSites = Array.isArray(sites)
                    ? sites.map((site) => normalizeLocalSite(site)).filter(Boolean)
                    : [];
                const urls = normalizedSites.map((site) => site.url);
                const siteSchedules = {};
                normalizedSites.forEach((site) => {
                    if (site?.url) {
                        // If the site is inactive (toggled OFF), send null schedule →
                        // content.js will keep it in the blocked list and block it
                        // always (no valid window). If active, use its saved window.
                        siteSchedules[site.url] = site.is_active !== false
                            ? (site.access_window || null)
                            : null;
                    }
                });
                const localSignature = readDashboardBlockedSites().signature;

                let normalizedActiveSession = activeSession;
                if (normalizedActiveSession?.url) {
                    const normalizedSessionUrl = syncConfig.normalizeHostname(normalizedActiveSession.url);
                    if (normalizedSessionUrl) {
                        // Do NOT push to urls array. Active sessions are for allowing access to blocked sites.
                        normalizedActiveSession = {
                            ...normalizedActiveSession,
                            url: normalizedSessionUrl
                        };
                    } else {
                        normalizedActiveSession = null;
                    }
                }

                const extensionState = await readExtensionBlockedSites();
                const shouldPushUrls = localSignature !== extensionState.signature || Boolean(normalizedActiveSession);

                if ((effectiveGuestStatus || urls.length > 0 || normalizedActiveSession) && shouldPushUrls) {
                    safeSend({
                        action: messageActions.syncUrls,
                        urls: Array.from(new Set(urls)),
                        siteSchedules,
                        activeSession: normalizedActiveSession,
                        isGuest: effectiveGuestStatus
                    });
                } else if (!sessionData && shouldPushUrls) {
                    safeSend({
                        action: messageActions.syncUrls,
                        urls: [],
                        siteSchedules: {},
                        activeSession: null
                    });
                }
            } catch (error) {
                // Suppress "extension context invalidated" errors — they're expected
                // when the extension is reloaded while the dashboard page is open.
                if (String(error).includes('context invalidated') || String(error).includes('Extension context')) {
                    return;
                }
                console.error('CTRL+BLCK: Error syncing dashboard to extension:', error);
            }
        }

        async function publishSyncStatus() {
            try {
                const {
                    [storageKeys.blockedSites]: urls,
                    [storageKeys.supabaseSession]: supabaseSession,
                    [LAST_SYNC_STATUS_KEY]: lastSyncStatus,
                    [BLOCKED_SITES_SIGNATURE_KEY]: storedSignature,
                    isGuest,
                    activeSession
                } = await chrome.storage.local.get([
                    storageKeys.blockedSites,
                    storageKeys.supabaseSession,
                    LAST_SYNC_STATUS_KEY,
                    BLOCKED_SITES_SIGNATURE_KEY,
                    'isGuest',
                    'activeSession'
                ]);

                const blockedSiteCount = Array.isArray(urls) ? urls.length : 0;
                const state = lastSyncStatus?.state || (supabaseSession ? 'synced' : isGuest ? 'guest_local' : 'not_authenticated');
                const signature = readBlockedSitesSignature(storedSignature) || buildBlockedSitesSignature(Array.isArray(urls) ? urls : []);

                window.dispatchEvent(new CustomEvent(SYNC_STATUS_RESPONSE_EVENT, {
                    detail: {
                        installed: true,
                        state,
                        isGuest: isGuest === true,
                        hasSession: Boolean(supabaseSession),
                        blockedSiteCount,
                        lastSyncedAt: lastSyncStatus?.lastSyncedAt || null,
                        error: lastSyncStatus?.error || null,
                        blockedSitesSignature: signature,
                        activeSession: activeSession?.url
                            ? {
                                url: syncConfig.normalizeHostname(activeSession.url) || activeSession.url,
                                start_time: activeSession.start_time || null,
                                target_duration: activeSession.target_duration || null
                            }
                            : null
                    }
                }));
            } catch (error) {
                window.dispatchEvent(new CustomEvent(SYNC_STATUS_RESPONSE_EVENT, {
                    detail: {
                        installed: true,
                        state: 'error',
                        isGuest: false,
                        hasSession: false,
                        blockedSiteCount: 0,
                        lastSyncedAt: null,
                        error: error instanceof Error ? error.message : 'Unable to read extension sync status',
                        activeSession: null
                    }
                }));
            }
        }

        async function syncExtensionToDashboard() {
            try {
                if (Date.now() - lastDashboardUpdate < 1000) {
                    return;
                }

                const {
                    [storageKeys.blockedSites]: urls,
                    [BLOCKED_SITE_SCHEDULES_KEY]: schedules,
                    [BLOCKED_SITES_SIGNATURE_KEY]: storedSignature,
                    isGuest,
                    activeSession
                } = await chrome.storage.local.get([
                    storageKeys.blockedSites,
                    BLOCKED_SITE_SCHEDULES_KEY,
                    BLOCKED_SITES_SIGNATURE_KEY,
                    'isGuest',
                    'activeSession'
                ]);

                if (Array.isArray(urls)) {
                    const normalizedSites = urls
                        .map((/** @type {string} */ url) => {
                            const cleanUrl = syncConfig.normalizeHostname(url);
                            if (!cleanUrl) return null;
                            return normalizeLocalSite({
                                id: `local_${btoa(cleanUrl).substring(0, 40)}`,
                                url: cleanUrl,
                                user_id: 'guest',
                                is_active: true,
                                created_at: new Date().toISOString(),
                                access_window: schedules && typeof schedules === 'object' ? schedules[cleanUrl] || null : null
                            });
                        })
                        .filter(Boolean);
                    const localState = readDashboardBlockedSites();
                    const extensionSignature = readBlockedSitesSignature(storedSignature) || (scheduleUtils?.buildBlockedSitesSignature ? scheduleUtils.buildBlockedSitesSignature(normalizedSites) : '');

                    if (extensionSignature !== localState.signature) {
                        writeLocalGuestSites(normalizedSites);
                        // Use ctrl-blck-ui-refresh (not ctrl-blck-sync) so the dashboard UI
                        // updates without triggering another full extension sync cycle.
                        window.dispatchEvent(new CustomEvent('ctrl-blck-ui-refresh'));
                    }
                }
            } catch (error) {
                console.error('CTRL+BLCK: Error syncing extension to dashboard:', error);
            }
        }

        syncDashboardToExtension();
        void syncExtensionToDashboard();
        schedulePublishStatus();

        window.addEventListener('storage', event => {
            if (
                event.key === storageKeys.guestFlag ||
                event.key === storageKeys.supabaseAuthToken ||
                event.key === storageKeys.guestSites ||
                event.key === BLOCKED_SITE_SCHEDULES_KEY ||
                event.key === BLOCKED_SITES_SIGNATURE_KEY ||
                event.key === 'activeSession'
            ) {
                // Use debounced wrapper to prevent burst re-entry from rapid storage events
                scheduleDashboardSync();
            }
        });

        // ctrl-blck-sync: fired by user-initiated actions (add/delete site, login, settings change).
        // Always triggers a full sync to the extension.
        window.addEventListener('ctrl-blck-sync', (event) => {
            if (!isExtensionAlive()) return;

            const detail = /** @type {any} */ (event).detail;
            const manualActiveSession = detail?.activeSession || null;

            // If we have manual session data, trigger an immediate sync bypass
            if (manualActiveSession) {
                // We still want to do a full sync eventually, but let's push the session NOW
                lastDashboardUpdate = Date.now();
                const sessionUrl = manualActiveSession.url ? syncConfig.normalizeHostname(manualActiveSession.url) : null;
                
                safeSend({
                    action: messageActions.syncUrls,
                    // We don't have the full list of URLs here easily without re-reading storage, 
                    // but for a session start, the most important thing is the activeSession.
                    // Background script will merge or we can trigger a full sync after.
                    activeSession: sessionUrl ? { ...manualActiveSession, url: sessionUrl } : null,
                    isOptimistic: true // Flag for background to handle differently if needed
                });
            }

            const guestStatus = localStorage.getItem(storageKeys.guestFlag) === 'true' ||
                parseStoredArray(localStorage.getItem(storageKeys.guestSites), 'sites').length > 0 ||
                parseStoredArray(localStorage.getItem(GUEST_FOCUS_SESSIONS_KEY), 'focus sessions').some(session => session?.status === 'active');

            if (guestStatus) {
                // Debounced — prevents multiple user actions in quick succession from spamming the extension
                scheduleDashboardSync();
            } else {
                safeSend({ action: messageActions.triggerSync });
            }
        });

        window.addEventListener(SYNC_STATUS_REQUEST_EVENT, () => {
            schedulePublishStatus();
        });

        // ctrl-blck-ui-refresh: fired internally by syncExtensionToDashboard() when extension
        // state changes. Only refreshes the dashboard UI — does NOT re-sync to the extension,
        // which would restart the loop.
        // window.addEventListener('ctrl-blck-ui-refresh', () => {
        //     void syncExtensionToDashboard();
        // });

        /**
         * @param {Object.<string, chrome.storage.StorageChange>} changes
         * @param {string} namespace
         */
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && (changes[storageKeys.blockedSites] || changes.isGuest)) {
                void syncExtensionToDashboard();
            }
            if (
                namespace === 'local' &&
                (
                    changes[storageKeys.blockedSites] ||
                    changes[BLOCKED_SITE_SCHEDULES_KEY] ||
                    changes[BLOCKED_SITES_SIGNATURE_KEY] ||
                    changes[storageKeys.supabaseSession] ||
                    changes[LAST_SYNC_STATUS_KEY] ||
                    changes.isGuest ||
                    changes.activeSession
                )
            ) {
                schedulePublishStatus();
            }
        });

        /**
         * @param {any} message
         * @param {chrome.runtime.MessageSender} sender
         * @param {function} sendResponse
         */
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === messageActions.triggerSync) {
                syncExtensionToDashboard();
            }
            if (message.action === messageActions.requestDashboardSync) {
                syncDashboardToExtension();
            }
            if (message.action === 'clearLocalStorage') {
                localStorage.removeItem(storageKeys.supabaseAuthToken);
                localStorage.removeItem(storageKeys.supabaseSession);
                if (message.clearGuestData) {
                    localStorage.removeItem(storageKeys.guestFlag);
                    localStorage.removeItem(storageKeys.guestSites);
                    localStorage.removeItem(BLOCKED_SITE_SCHEDULES_KEY);
                    localStorage.removeItem(GUEST_FOCUS_SESSIONS_KEY);
                }
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            }
            if (message.action === messageActions.triggerDashboardRefresh) {
                // Background completed a Supabase mutation — tell the website to re-fetch
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            }
        });

        // Periodic fallback sync removed to prevent excessive polling and performance bottlenecks
        // Event-driven sync (storage events + custom events) handles immediate changes.
    }
}

/**
 * @param {string | null} rawValue
 * @param {string} label
 */
function parseStoredArray(rawValue, label) {
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`CTRL+BLCK: Error parsing ${label} from storage:`, error);
        return [];
    }
}
