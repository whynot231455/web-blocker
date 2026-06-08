/**
 * @typedef {Object} LocalSite
 * @property {string} id
 * @property {string} url
 * @property {string} [user_id]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 */
/**
 * @typedef {Object} ActiveSession
 * @property {string} url
 * @property {string} start_time
 * @property {number} target_duration
 * @property {string} [status]
 */
const syncConfig = globalThis.CTRL_BLCK_SYNC;

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

        function syncDashboardToExtension() {
            try {
                lastDashboardUpdate = Date.now();

                safeSend({
                    action: messageActions.syncDashboardOrigin,
                    origin: window.location.origin
                });

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

                const urls = Array.isArray(sites)
                    ? sites
                        .filter(site => site?.is_active !== false)
                        .map(site => syncConfig.normalizeHostname(site.url))
                        .filter(Boolean)
                    : [];

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

                if (effectiveGuestStatus || urls.length > 0 || normalizedActiveSession) {
                    safeSend({
                        action: messageActions.syncUrls,
                        urls: Array.from(new Set(urls)),
                        activeSession: normalizedActiveSession
                    });
                } else if (!sessionData) {
                    safeSend({
                        action: messageActions.syncUrls,
                        urls: [],
                        activeSession: null
                    });
                }

                const rawLimit = localStorage.getItem('dailyUnlockLimit');
                const rawDuration = localStorage.getItem('tempAccessDuration');
                
                if (rawLimit || rawDuration) {
                    const settingsPayload = {};
                    if (rawLimit) settingsPayload.dailyUnlockLimit = parseInt(rawLimit, 10);
                    if (rawDuration) settingsPayload.tempAccessDuration = parseInt(rawDuration, 10);
                    
                    safeSend({
                        action: messageActions.syncSettings,
                        ...settingsPayload
                    });
                }
            } catch (error) {
                console.error('CTRL+BLCK: Error syncing dashboard to extension:', error);
            }
        }

        async function syncExtensionToDashboard() {
            try {
                if (Date.now() - lastDashboardUpdate < 1000) {
                    return;
                }

                const { [storageKeys.blockedSites]: urls, isGuest, activeSession } = await chrome.storage.local.get([
                    storageKeys.blockedSites,
                    'isGuest',
                    'activeSession'
                ]);
                
                /** @type {ActiveSession | null} */
                const session = /** @type {any} */ (activeSession);

                if (isGuest && Array.isArray(urls)) {
                    const currentLocalData = localStorage.getItem(storageKeys.guestSites);
                    /** @type {LocalSite[]} */
                    let currentSites = [];

                    try {
                        currentSites = currentLocalData ? JSON.parse(currentLocalData) : [];
                    } catch (error) {
                        console.error('CTRL+BLCK: Error parsing current local sites:', error);
                    }

                    // Use all urls from storage for comparison — do NOT strip the active session URL.
                    // The session URL stays in the block list; content.js checkBlocking() handles the allow-override.
                    /** @type {Map<string, LocalSite>} */
                    const uniqueSitesMap = new Map();

                    urls.forEach((/** @type {string} */ url) => {
                        const cleanUrl = syncConfig.normalizeHostname(url);
                        if (!cleanUrl) return;

                        const id = `local_${btoa(cleanUrl).substring(0, 40)}`;
                        const existingSite = currentSites.find((/** @type {LocalSite} */ site) => site.id === id || site.url === cleanUrl);

                        if (!uniqueSitesMap.has(cleanUrl)) {
                            uniqueSitesMap.set(cleanUrl, {
                                id,
                                url: cleanUrl,
                                user_id: 'guest',
                                is_active: true,
                                created_at: existingSite?.created_at || new Date().toISOString()
                            });
                        }
                    });

                    const websiteSites = Array.from(uniqueSitesMap.values());

                    const currentUrls = [...currentSites]
                        .filter(site => site?.is_active !== false)
                        .map(site => site.url)
                        .sort()
                        .join('|');

                    const newUrls = [...websiteSites]
                        .filter((s) => s !== null)
                        .map((/** @type {LocalSite} */ site) => site.url)
                        .sort()
                        .join('|');

                    if (currentUrls !== newUrls) {
                        localStorage.setItem(storageKeys.guestSites, JSON.stringify(websiteSites));
                        // Use ctrl-blck-ui-refresh (not ctrl-blck-sync) so the dashboard UI
                        // updates without triggering another full extension sync cycle.
                        window.dispatchEvent(new CustomEvent('ctrl-blck-ui-refresh'));
                    }
                } else if (!isGuest && Array.isArray(urls)) {
                    // Authenticated user — dashboard uses Supabase realtime, no dispatch needed.
                }
            } catch (error) {
                console.error('CTRL+BLCK: Error syncing extension to dashboard:', error);
            }
        }

        syncDashboardToExtension();
        void syncExtensionToDashboard();

        window.addEventListener('storage', event => {
            if (
                event.key === storageKeys.guestFlag ||
                event.key === storageKeys.supabaseAuthToken ||
                event.key === storageKeys.guestSites ||
                event.key === 'dailyUnlockLimit' ||
                event.key === 'tempAccessDuration'
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
            if (message.action === 'clearLocalStorage') {
                localStorage.removeItem(storageKeys.supabaseAuthToken);
                localStorage.removeItem(storageKeys.supabaseSession);
                if (message.clearGuestData) {
                    localStorage.removeItem(storageKeys.guestFlag);
                    localStorage.removeItem(storageKeys.guestSites);
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
