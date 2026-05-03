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
        let lastDashboardUpdate = 0;

        function syncDashboardToExtension() {
            try {
                lastDashboardUpdate = Date.now();

                chrome.runtime.sendMessage({
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
                        chrome.runtime.sendMessage({
                            action: messageActions.syncSession,
                            session: {
                                access_token: session.access_token,
                                user_id: session.user.id,
                                expires_at: session.expires_at
                            }
                        });
                    }
                } else {
                    chrome.runtime.sendMessage({
                        action: messageActions.clearSession,
                        preserveGuestData: effectiveGuestStatus
                    });
                }

                chrome.runtime.sendMessage({
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
                    chrome.runtime.sendMessage({
                        action: messageActions.syncUrls,
                        urls: Array.from(new Set(urls)),
                        activeSession: normalizedActiveSession
                    });
                } else if (!sessionData) {
                    chrome.runtime.sendMessage({
                        action: messageActions.syncUrls,
                        urls: [],
                        activeSession: null
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

                    const sessionUrl = session ? session.url : null;
                    const persistentUrls = sessionUrl 
                        ? urls.filter(u => syncConfig.normalizeHostname(u) !== syncConfig.normalizeHostname(sessionUrl)) 
                        : urls;

                    /** @type {Map<string, LocalSite>} */
                    const uniqueSitesMap = new Map();

                    persistentUrls.forEach((/** @type {string} */ url) => {
                        const cleanUrl = syncConfig.normalizeHostname(url);
                        if (!cleanUrl) return;

                        const id = `local_${btoa(cleanUrl).substring(0, 40)}`;
                        const existingSite = currentSites.find((/** @type {LocalSite} */ site) => site.id === id || site.url === cleanUrl);

                        // Only add if not already in the map to prevent duplicates in dashboard
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
                        window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
                    }
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
                event.key === storageKeys.guestSites
            ) {
                syncDashboardToExtension();
            }
        });

        window.addEventListener('ctrl-blck-sync', () => {
            const guestStatus = localStorage.getItem(storageKeys.guestFlag) === 'true' ||
                parseStoredArray(localStorage.getItem(storageKeys.guestSites), 'sites').length > 0 ||
                parseStoredArray(localStorage.getItem(GUEST_FOCUS_SESSIONS_KEY), 'focus sessions').some(session => session?.status === 'active');

            if (guestStatus) {
                syncDashboardToExtension();
            } else {
                chrome.runtime.sendMessage({ action: messageActions.triggerSync });
            }
        });

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
