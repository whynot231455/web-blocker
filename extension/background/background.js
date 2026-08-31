/// <reference lib="webworker" />
// Load shared configuration (credentials, storage keys, message actions)
importScripts('../lib/config.js');
importScripts('../lib/url-utils.js');
importScripts('../lib/schedule-utils.js');
importScripts('../lib/sync-constants.js');
importScripts('../lib/guest-site-store.js');

const syncConfig = globalThis.CTRL_BLCK_SYNC;
const SUPABASE_URL = syncConfig.supabaseUrl;
const SUPABASE_KEY = syncConfig.supabaseKey;
const normalizeHostname = syncConfig.normalizeHostname;

const STORAGE_KEYS = {
  supabaseSession: syncConfig.storageKeys.supabaseSession,
  dashboardOrigin: syncConfig.storageKeys.dashboardOrigin,
  blockedSites: syncConfig.storageKeys.blockedSites,
  blockedSiteSchedules: syncConfig.storageKeys.blockedSiteSchedules,
  blockedSitesSignature: syncConfig.storageKeys.blockedSitesSignature,
  guestFlag: syncConfig.storageKeys.guestFlag,
  guestSiteRecords: syncConfig.storageKeys.guestSiteRecords,
  sitesUpdatedAt: syncConfig.storageKeys.sitesUpdatedAt,
  lastSyncStatus: 'lastSyncStatus'
};

const MESSAGE_ACTIONS = syncConfig.messageActions;
const guestSiteStore = globalThis.CTRL_BLCK_GUEST_SITE_STORE;

const DEFAULT_DASHBOARD_ORIGIN = syncConfig.defaultDashboardOrigin;
const DASHBOARD_PATHS = {
  login: syncConfig.dashboardPaths.login
};

/**
 * @param {string[]} urls
 * @param {Record<string, { enabled?: boolean; start?: string; end?: string } | null>} [schedules]
 */
function buildBlockedSitesSignature(urls, schedules = {}) {
  return guestSiteStore.project(guestSiteStore.fromLegacyUrls(urls, schedules)).signature;
}

async function replaceGuestSites(sites) {
  const projection = guestSiteStore.project(sites);
  await chrome.storage.local.set({
    [STORAGE_KEYS.guestSiteRecords]: projection.sites,
    [STORAGE_KEYS.blockedSites]: projection.urls,
    [STORAGE_KEYS.blockedSiteSchedules]: projection.schedules,
    [STORAGE_KEYS.blockedSitesSignature]: projection.signature,
    // Last-writer-wins marker: popup mutations must be able to win the
    // bidirectional sync against a dashboard tab holding an older list.
    [STORAGE_KEYS.sitesUpdatedAt]: Date.now(),
    isGuest: true,
    [STORAGE_KEYS.lastSyncStatus]: createSyncStatus('guest_local', {
      blockedSiteCount: projection.urls.length
    })
  });
  return { success: true, sites: projection.sites };
}

// Set to true to enable verbose sync logging. Mirrors debugMode in sync-constants.js.
const DEBUG_MODE = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeTab' && sender.tab?.id !== undefined) {
    chrome.tabs.remove(sender.tab.id).catch(error => {
      console.warn('Could not close tab:', error);
    });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncSession) {
    chrome.storage.local.set(
      {
        [STORAGE_KEYS.supabaseSession]: message.session,
        isGuest: false,
        [STORAGE_KEYS.lastSyncStatus]: createSyncStatus('synced')
      },
      () => {
        if (DEBUG_MODE) console.log('Session saved, triggering initial sync');
        void syncFromSupabase();
      }
    );
    return;
  }

  if (message.action === MESSAGE_ACTIONS.clearSession) {
    const preserveGuestData = Boolean(message.preserveGuestData);

    clearExtensionSessionState({
      clearGuestMode: !preserveGuestData,
      clearBlockedSites: !preserveGuestData
    })
      .then(async () => {
        if (DEBUG_MODE) console.log('Session cleared');
        await notifyDashboardToClearSession({ clearGuestData: !preserveGuestData });
      })
      .catch(error => {
        console.warn('Failed to clear session state:', error);
      });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncGuestStatus) {
    chrome.storage.local.set({
      isGuest: message.isGuest,
      [STORAGE_KEYS.lastSyncStatus]: createSyncStatus(message.isGuest ? 'guest_local' : 'not_authenticated')
    }, () => {
      if (DEBUG_MODE) console.log('Guest status saved:', message.isGuest);
    });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncUrls) {
    /** @type {Record<string, any>} */
    const storageData = {};
    
    if (Array.isArray(message.urls)) {
        const siteStates = message.siteStates && typeof message.siteStates === 'object'
            ? message.siteStates
            : {};
        const normalizedUrls = Array.from(
            new Set(message.urls.map(syncConfig.normalizeHostname).filter(Boolean))
        );
        // Toggled-off sites stay in the dashboard list and in Supabase (is_active
        // false), but must NOT go into chrome.storage.blockedSites — content.js
        // blocks anything in that list, so an inactive site has to be excluded
        // immediately. This is what actually stops the blocking, and it works in
        // guest mode too (the DB pull alone would be too late).
        const activeUrls = normalizedUrls.filter(url => siteStates[url] !== false);

        storageData[STORAGE_KEYS.blockedSites] = activeUrls;
        storageData[STORAGE_KEYS.blockedSiteSchedules] = message.siteSchedules && typeof message.siteSchedules === 'object'
          ? message.siteSchedules
          : {};
        const fullSites = Array.isArray(message.sites)
          ? message.sites
          : normalizedUrls.map(url => ({
              url,
              is_active: siteStates[url] !== false,
              access_window: storageData[STORAGE_KEYS.blockedSiteSchedules][url] || null
            }));
        const guestProjection = guestSiteStore.project(fullSites);
        storageData[STORAGE_KEYS.blockedSitesSignature] = message.isGuest
          ? guestProjection.signature
          : buildBlockedSitesSignature(activeUrls, storageData[STORAGE_KEYS.blockedSiteSchedules]);
        storageData[STORAGE_KEYS.guestSiteRecords] = guestProjection.sites;
        // Persist dashboard add/remove/toggle actions to Supabase when authenticated.
        // Pass the FULL list (incl. toggled-off sites) so reconcile patches
        // is_active instead of deleting the rows. No-op in guest mode (no session)
        // — local-only is the intended behavior.
        void reconcileBlockedSitesWithSupabase(normalizedUrls, siteStates);
    }

    if (message.activeSession !== undefined) {
        storageData.activeSession = message.activeSession;
    }

    if (Object.keys(storageData).length > 0) {
        storageData[STORAGE_KEYS.lastSyncStatus] = createSyncStatus(
          message.isGuest ? 'guest_local' : 'synced',
          {
            blockedSiteCount: Array.isArray(storageData[STORAGE_KEYS.blockedSites])
              ? storageData[STORAGE_KEYS.blockedSites].length
              : undefined
          }
        );
        chrome.storage.local.set(storageData, () => {
            if (DEBUG_MODE) console.log('URLs/Session synced from dashboard');
        });
    }
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncDashboardOrigin) {
    const origin = typeof message.origin === 'string' ? message.origin : DEFAULT_DASHBOARD_ORIGIN;
    chrome.storage.local.set({ [STORAGE_KEYS.dashboardOrigin]: origin });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncSettings) {
    /** @type {Record<string, any>} */
    const settingsObj = {};
    if (message.dailyUnlockLimit !== undefined) {
      settingsObj.dailyUnlockLimit = message.dailyUnlockLimit;
    }
    if (message.tempAccessDuration !== undefined) {
      settingsObj.tempAccessDuration = message.tempAccessDuration;
    }
    
    if (Object.keys(settingsObj).length > 0) {
      chrome.storage.local.set(settingsObj, () => {
        if (DEBUG_MODE) console.log('Settings synced from dashboard:', settingsObj);
      });
    }
    return;
  }

  if (message.action === MESSAGE_ACTIONS.triggerSync) {
    syncFromSupabase().then(res => sendResponse?.(res));
    return true;
  }

  if (message.action === MESSAGE_ACTIONS.getSyncStatus) {
    getSyncStatus().then(res => sendResponse?.(res));
    return true;
  }

  if (message.action === MESSAGE_ACTIONS.requestDashboardSync) {
    handleRequestDashboardSync();
    return;
  }

  if (message.action === MESSAGE_ACTIONS.addSiteToSupabase) {
    addSiteToSupabase(message.url).then(res => sendResponse?.(res));
    return true;
  }

  if (message.action === MESSAGE_ACTIONS.deleteSiteFromSupabase) {
    deleteSiteFromSupabase(message.url).then(res => sendResponse?.(res));
    return true;
  }

  if (message.action === MESSAGE_ACTIONS.clearSitesFromSupabase) {
    clearSitesFromSupabase().then(res => sendResponse?.(res));
    return true;
  }

  if (message.action === MESSAGE_ACTIONS.replaceGuestSites) {
    replaceGuestSites(message.sites)
      .then(res => sendResponse?.(res))
      .catch(error => sendResponse?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update guest sites'
      }));
    return true;
  }
});

/**
 * Handles external messages from the CTRL+BLCK website (ctrl-blck.vercel.app).
 * Used for extension detection — the website sends a 'ping' to verify the
 * extension is installed, regardless of the extension's assigned ID.
 * @param {any} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {function} sendResponse
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message?.action === 'ping') {
    sendResponse({ installed: true });
    return;
  }

  // The website's supabase-js storage adapter asks for the session the
  // extension holds — the extension may have refreshed the token while the
  // dashboard was closed, so its copy can be newer than the site's.
  if (message?.action === 'getSupabaseSession') {
    getSession().then(session => sendResponse({ session: session || null }));
    return true;
  }

  // The website hands us its latest session (e.g. right after supabase-js
  // refreshed the token) so our snapshot stays on the same refresh-token chain.
  if (message?.action === 'setSupabaseSession') {
    const incoming = message.session;
    if (incoming && incoming.access_token) {
      const normalized = {
        ...incoming,
        user_id: (incoming.user && incoming.user.id) || incoming.user_id
      };
      chrome.storage.local.set(
        { [STORAGE_KEYS.supabaseSession]: normalized, isGuest: false },
        () => sendResponse({ ok: true })
      );
      return true;
    }
    sendResponse({ ok: false });
    return;
  }
});

/**
 * @typedef {Object} SupabaseSession
 * @property {string} access_token
 * @property {string} [refresh_token]
 * @property {string} user_id
 * @property {number} [expires_at]
 * @property {number} [expires_in]
 * @property {{ id?: string } | undefined} [user]
 */

/**
 * @typedef {Object} ActiveSession
 * @property {string} url
 * @property {string} [start_time]
 * @property {number} [target_duration]
 * @property {string} [status]
 */

/**
 * @typedef {Object} SyncStatus
 * @property {'synced' | 'guest_local' | 'not_authenticated' | 'error'} [state]
 * @property {string | null} [lastSyncedAt]
 * @property {string | null} [error]
 * @property {number} [blockedSiteCount]
 */

/**
 * @param {string} accessToken
 */
function buildHeaders(accessToken) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
}

/**
 * @returns {Promise<SupabaseSession | null>}
 */
async function getSession() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.supabaseSession);
  const session = result[STORAGE_KEYS.supabaseSession];
  return /** @type {SupabaseSession | null} */ (session || null);
}

/**
 * @param {'synced' | 'guest_local' | 'not_authenticated' | 'error'} state
 * @param {{ error?: string | null; blockedSiteCount?: number }} [options]
 */
function createSyncStatus(state, options = {}) {
  return {
    state,
    lastSyncedAt: new Date().toISOString(),
    error: options.error || null,
    blockedSiteCount: options.blockedSiteCount
  };
}

/**
 * @param {'synced' | 'guest_local' | 'not_authenticated' | 'error'} state
 * @param {{ error?: string | null; blockedSiteCount?: number }} [options]
 */
async function saveSyncStatus(state, options = {}) {
  const nextStatus = createSyncStatus(state, options);
  await chrome.storage.local.set({ [STORAGE_KEYS.lastSyncStatus]: nextStatus });
  return nextStatus;
}

async function getSyncStatus() {
  /** @type {Record<string, any>} */
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.blockedSites,
    STORAGE_KEYS.supabaseSession,
    STORAGE_KEYS.lastSyncStatus,
    'isGuest',
    'activeSession'
  ]);

  /** @type {string[]} */
  const urls = Array.isArray(result[STORAGE_KEYS.blockedSites]) ? result[STORAGE_KEYS.blockedSites] : [];
  /** @type {SyncStatus | null} */
  const lastStatus = result[STORAGE_KEYS.lastSyncStatus] || null;
  const isGuest = result.isGuest === true;
  const hasSession = Boolean(result[STORAGE_KEYS.supabaseSession]);
  /** @type {ActiveSession | null} */
  const activeSession = result.activeSession || null;
  const state = lastStatus?.state || (hasSession ? 'synced' : isGuest ? 'guest_local' : 'not_authenticated');

  return {
    installed: true,
    state,
    isGuest,
    hasSession,
    blockedSiteCount: urls.length,
    lastSyncedAt: lastStatus?.lastSyncedAt || null,
    error: lastStatus?.error || null,
    activeSession: activeSession?.url
      ? {
          url: normalizeHostname(activeSession.url) || activeSession.url,
          start_time: activeSession.start_time || null,
          target_duration: activeSession.target_duration || null
        }
      : null
  };
}

/**
 * Called by the popup when it opens. Queries all open dashboard tabs
 * and asks them to push their latest site data to chrome.storage.local,
 * so the popup can read fresh data even if the periodic sync missed it.
 */
async function handleRequestDashboardSync() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.dashboardOrigin);
  const origin = result[STORAGE_KEYS.dashboardOrigin] || DEFAULT_DASHBOARD_ORIGIN;
  try {
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    for (const tab of tabs) {
      if (typeof tab.id === 'number') {
        chrome.tabs.sendMessage(tab.id, { action: MESSAGE_ACTIONS.requestDashboardSync }).catch(() => {
          // Tab may have navigated away — ignore silently
        });
      }
    }
  } catch {
    // No tabs match or permission denied — dashboard just isn't open
  }
}

/**
 * @param {Object} [options]
 * @param {boolean} [options.clearGuestMode]
 * @param {boolean} [options.clearBlockedSites]
 */
async function clearExtensionSessionState(options = {}) {
  const {
    clearGuestMode = false,
    clearBlockedSites = false
  } = options;

  await chrome.storage.local.remove([STORAGE_KEYS.supabaseSession, 'activeSession']);
  
  /** @type {Record<string, any>} */
  const nextState = {};

  if (clearGuestMode) {
    nextState.isGuest = false;
  }

  if (clearBlockedSites) {
    nextState[STORAGE_KEYS.blockedSites] = [];
    nextState[STORAGE_KEYS.blockedSiteSchedules] = {};
    nextState[STORAGE_KEYS.blockedSitesSignature] = '';
    nextState[STORAGE_KEYS.guestSiteRecords] = [];
  }

  nextState[STORAGE_KEYS.lastSyncStatus] = createSyncStatus(
    clearGuestMode ? 'not_authenticated' : 'guest_local',
    { blockedSiteCount: clearBlockedSites ? 0 : undefined }
  );

  if (Object.keys(nextState).length > 0) {
    await chrome.storage.local.set(nextState);
  }
}

/** 
 * Check if a JWT access_token is expired 
 * @param {string} accessToken
 */
function isTokenExpired(accessToken) {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || typeof payload.exp !== 'number') return true;
    // Add 30-second buffer to account for clock skew
    return (payload.exp * 1000) < (Date.now() - 30000);
  } catch {
    return true; // If we can't parse it, treat as expired
  }
}

/**
 * @returns {Promise<boolean>} true when at least one dashboard tab is open. When
 * one is, the website's supabase-js owns token refresh and the extension must
 * not refresh in parallel — that would fork Supabase's rotating refresh-token
 * chain and can revoke the whole session.
 */
async function hasOpenDashboardTab() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.dashboardOrigin);
    const origin = result[STORAGE_KEYS.dashboardOrigin] || DEFAULT_DASHBOARD_ORIGIN;
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    return Array.isArray(tabs) && tabs.length > 0;
  } catch {
    return false;
  }
}

/**
 * Exchange the stored refresh token for a fresh access token, directly against
 * Supabase's auth endpoint. This is what lets the extension keep syncing (and
 * therefore blocking newly-added sites) when no dashboard tab is open to do the
 * refresh for us. The new tokens are merged into the stored snapshot so the
 * website adopts the same chain the next time it opens.
 * @returns {Promise<SupabaseSession | null>} the updated snapshot, or null when
 *   there is no refresh token or Supabase rejects it.
 */
async function refreshSupabaseSession() {
  const session = await getSession();
  if (!session || !session.refresh_token) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (!response.ok) {
      if (DEBUG_MODE) console.warn('Extension token refresh rejected:', response.status);
      return null;
    }
    const data = await response.json();
    if (!data || !data.access_token) return null;
    const nowSeconds = Math.floor(Date.now() / 1000);
    /** @type {SupabaseSession} */
    const next = {
      ...session,
      access_token: data.access_token,
      refresh_token: data.refresh_token || session.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at || (nowSeconds + (data.expires_in || 3600)),
      user: data.user || session.user,
      user_id: (data.user && data.user.id) || session.user_id
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.supabaseSession]: next });
    if (DEBUG_MODE) console.log('Extension refreshed the Supabase session directly');
    return next;
  } catch (error) {
    console.warn('Extension token refresh failed:', error);
    return null;
  }
}

async function syncFromSupabase() {
  try {
    let session = await getSession();
    if (!session || !session.access_token || !session.user_id) {
      if (DEBUG_MODE) console.log('No active session, skipping sync');
      await saveSyncStatus('not_authenticated', { error: 'Not authenticated' });
      return { success: false, error: 'Not authenticated' };
    }

    // An expired *access* token is normal — they live ~1 hour.
    if (isTokenExpired(session.access_token)) {
      if (await hasOpenDashboardTab()) {
        // A dashboard tab is open: let the website's supabase-js refresh and
        // push the new token. Refreshing here too would fork the rotating
        // refresh-token chain and can revoke the whole session.
        if (DEBUG_MODE) console.log('Token stale; asking the open dashboard to refresh');
        await saveSyncStatus('error', { error: 'Access token stale — refreshing from dashboard' });
        await handleRequestDashboardSync();
        return { success: false, error: 'Access token stale — awaiting refresh from dashboard' };
      }
      // No dashboard open — nothing else can refresh, so the extension does it
      // itself and keeps tracking newly-added sites.
      const refreshed = await refreshSupabaseSession();
      if (!refreshed) {
        await clearExtensionSessionState();
        await saveSyncStatus('error', { error: 'Session expired — sign in from the dashboard' });
        return { success: false, error: 'Session expired — re-authenticate from the dashboard' };
      }
      session = refreshed;
    }

    // Fetch blocked sites
    const sitesPromise = fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?select=url,is_active,access_window&user_id=eq.${session.user_id}`,
      { headers: buildHeaders(session.access_token) }
    );

    // Fetch active sessions
    const sessionsPromise = fetch(
      `${SUPABASE_URL}/rest/v1/focus_sessions?select=url,start_time,target_duration&user_id=eq.${session.user_id}&status=eq.active`,
      { headers: buildHeaders(session.access_token) }
    );

    const [sitesResponse, sessionsResponse] = await Promise.all([sitesPromise, sessionsPromise]);

    // Handle 401 — token was rejected by server
    if (sitesResponse.status === 401 || sessionsResponse.status === 401) {
      console.warn('Supabase returned 401; dropping the extension session snapshot and asking the dashboard to re-sync');
      // Only the extension's own chrome.storage copy is cleared here. The
      // website keeps its session and refresh token — a still-valid session
      // will re-push a working token on the next dashboard sync.
      await clearExtensionSessionState();
      await saveSyncStatus('error', { error: 'Token rejected - re-sync from dashboard' });
      await handleRequestDashboardSync();
      return { success: false, error: 'Token rejected — re-sync from dashboard' };
    }

    if (!sitesResponse.ok || !sessionsResponse.ok) {
      throw new Error(`Supabase sync failed`);
    }

    const sitesData = await sitesResponse.json();
    const sessionsData = await sessionsResponse.json();

    const blockedSitesUrls = (Array.isArray(sitesData) ? sitesData : [])
      .filter(site => site && site.is_active)
      .map(site => normalizeHostname(site.url))
      .filter(u => u !== null);

    // Get the first active session to display in popup
    const activeSession = Array.isArray(sessionsData) && sessionsData.length > 0 ? sessionsData[0] : null;

    // Keep blocked sites as they are in the permanent list
    // Active sessions will be handled as an override in content.js
    const allBlockedUrls = Array.from(new Set(blockedSitesUrls))
      .filter(u => u !== null);

    // Carry each site's block window so content.js can enforce schedules.
    /** @type {Record<string, { enabled?: boolean; start?: string; end?: string } | null>} */
    const schedules = {};
    for (const site of (Array.isArray(sitesData) ? sitesData : [])) {
      const url = site && site.url ? normalizeHostname(site.url) : null;
      if (url) schedules[url] = (site && site.access_window) || null;
    }

    const guestProjection = guestSiteStore.project(
      (Array.isArray(sitesData) ? sitesData : []).map(site => ({
        url: site?.url,
        is_active: site?.is_active,
        access_window: site?.access_window || null
      }))
    );

    await chrome.storage.local.set({ 
        [STORAGE_KEYS.blockedSites]: allBlockedUrls,
        [STORAGE_KEYS.blockedSiteSchedules]: schedules,
        [STORAGE_KEYS.blockedSitesSignature]: buildBlockedSitesSignature(allBlockedUrls, schedules),
        [STORAGE_KEYS.guestSiteRecords]: guestProjection.sites,
        activeSession: activeSession,
        [STORAGE_KEYS.lastSyncStatus]: createSyncStatus('synced', {
          blockedSiteCount: allBlockedUrls.length
        })
    });

    if (DEBUG_MODE) console.log(`Synced ${allBlockedUrls.length} blocked sites from Supabase`);
    if (activeSession && DEBUG_MODE) {
      console.log(`Active session found for: ${activeSession.url} (session active)`);
    }
    return { success: true, count: allBlockedUrls.length };
  } catch (error) {
    console.error('Error during syncFromSupabase:', error);
    await saveSyncStatus('error', {
      error: error instanceof Error ? error.message : 'Sync failed'
    });
    return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

/**
 * @param {string} url
 * @param {boolean} [isActive]
 */
async function addSiteToSupabase(url, isActive = true) {
  try {
    const session = await getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    const hostname = normalizeHostname(url);
    if (!hostname) {
      return { success: false, error: 'Invalid hostname' };
    }

    const existingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?select=id,is_active&user_id=eq.${session.user_id}&url=eq.${hostname}`,
      {
        headers: buildHeaders(session.access_token)
      }
    );

    if (!existingResponse.ok) {
      throw new Error(await existingResponse.text());
    }

    const existingRows = await existingResponse.json();

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const [{ id, is_active: existingActive }] = existingRows;
      if (existingActive !== isActive) {
        const patchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/blocked_sites?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: {
              ...buildHeaders(session.access_token),
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ is_active: isActive })
          }
        );

        if (!patchResponse.ok) {
          throw new Error(await patchResponse.text());
        }
      }

      await syncFromSupabase();
      await notifyDashboardToRefresh();
      return { success: true, url: hostname, reactivated: !existingActive };
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/blocked_sites`, {
      method: 'POST',
      headers: {
        ...buildHeaders(session.access_token),
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        url: hostname,
        user_id: session.user_id,
        is_active: isActive
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
    await notifyDashboardToRefresh();
    return { success: true, url: hostname, is_active: isActive };
  } catch (error) {
    console.error('Add to Supabase failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add site' };
  }
}

/**
 * PATCHes a site's is_active flag in Supabase — used to persist dashboard
 * on/off toggles (a toggled-off site stays in the list but stops blocking).
 * @param {string} hostname
 * @param {boolean} isActive
 */
async function setSiteActiveState(hostname, isActive) {
  try {
    const session = await getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    const normalizedHostname = normalizeHostname(hostname);
    if (!normalizedHostname) {
      return { success: false, error: 'Invalid hostname' };
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?user_id=eq.${session.user_id}&url=eq.${normalizedHostname}`,
      {
        method: 'PATCH',
        headers: {
          ...buildHeaders(session.access_token),
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ is_active: isActive })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
    await notifyDashboardToRefresh();
    return { success: true, url: normalizedHostname, is_active: isActive };
  } catch (error) {
    console.error('Set site active state failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update site' };
  }
}

/**
 * Reconciles the dashboard's current blocked-site list against the user's
 * Supabase `blocked_sites` table. URLs present locally but missing from the
 * database are inserted; database rows no longer present locally are deleted;
 * rows whose is_active flag differs are patched (dashboard on/off toggles).
 * This is what makes dashboard add/remove/toggle actions persist to the cloud.
 * No-op when the user is not authenticated (guest mode stays local-only).
 * @param {string[]} urls
 * @param {Record<string, boolean>} [siteStates]
 */
async function reconcileBlockedSitesWithSupabase(urls, siteStates = {}) {
  const session = await getSession();
  if (!session?.access_token || !session.user_id) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?select=url,is_active&user_id=eq.${session.user_id}`,
      { headers: buildHeaders(session.access_token) }
    );
    if (!response.ok) return;

    const rows = await response.json();
    const dbMap = new Map();
    if (Array.isArray(rows)) {
      for (const row of rows) {
        const normalized = normalizeHostname(row && row.url);
        if (normalized !== null) {
          dbMap.set(normalized, row && row.is_active !== false);
        }
      }
    }
    const incomingUrls = new Set(
      (Array.isArray(urls) ? urls : [])
        .map(normalizeHostname)
        .filter(url => url !== null)
    );

    const toAdd = [...incomingUrls].filter(url => !dbMap.has(url));
    const toRemove = [...dbMap.keys()].filter(url => !incomingUrls.has(url));
    const toPatch = [...incomingUrls]
      .filter(url => dbMap.has(url))
      .filter(url => dbMap.get(url) !== (siteStates[url] !== false));

    for (const url of toAdd) {
      await addSiteToSupabase(url, siteStates[url] !== false);
    }
    for (const url of toPatch) {
      await setSiteActiveState(url, siteStates[url] !== false);
    }
    for (const url of toRemove) {
      await deleteSiteFromSupabase(url);
    }
  } catch (error) {
    console.error('Reconcile blocked sites with Supabase failed:', error);
  }
}

/**
 * Notify all open dashboard tabs to refresh their UI immediately.
 * Sends triggerDashboardRefresh which dashboard-sync.js translates
 * into a ctrl-blck-sync window event, causing useBlockedSites to re-fetch.
 */
async function notifyDashboardToRefresh() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.dashboardOrigin);
    const dashboardOrigin = result[STORAGE_KEYS.dashboardOrigin];
    const origin = dashboardOrigin || DEFAULT_DASHBOARD_ORIGIN;
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });

    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: MESSAGE_ACTIONS.triggerDashboardRefresh }).catch(() => {
          // Tab may not have the content script loaded yet — safe to ignore
        });
      }
    }
  } catch (error) {
    console.warn('Failed to notify dashboard tabs:', error);
  }
}

/**
 * Ask all open dashboard tabs to reconcile their guest localStorage from the
 * extension's current chrome.storage state (runs syncExtensionToDashboard in
 * dashboard-sync.js). Used after extension-side mutations in guest mode so the
 * dashboard copy isn't stale enough to re-push deleted sites back.
 */
async function notifyDashboardToReconcileFromExtension() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.dashboardOrigin);
    const origin = result[STORAGE_KEYS.dashboardOrigin] || DEFAULT_DASHBOARD_ORIGIN;
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });

    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: MESSAGE_ACTIONS.triggerSync }).catch(() => {
          // Tab may not have the content script loaded yet — safe to ignore
        });
      }
    }
  } catch (error) {
    console.warn('Failed to notify dashboard to reconcile:', error);
  }
}

/**
 * @param {string} hostname
 */
async function deleteSiteFromSupabase(hostname) {
  try {
    const session = await getSession();
    if (!session?.access_token) {
      // Guest mode — the popup already removed the site from chrome.storage.local.
      // Ask any open dashboard tabs to reconcile their guest localStorage from the
      // extension, so the deleted site isn't re-pushed back on the next sync.
      await notifyDashboardToReconcileFromExtension();
      return { success: false, error: 'Not authenticated' };
    }

    const normalizedHostname = normalizeHostname(hostname);
    if (!normalizedHostname) {
      return { success: false, error: 'Invalid hostname' };
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?user_id=eq.${session.user_id}&url=eq.${normalizedHostname}`,
      {
        method: 'DELETE',
        headers: buildHeaders(session.access_token)
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
    await notifyDashboardToRefresh();
    return { success: true, url: normalizedHostname };
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete site' };
  }
}

async function clearSitesFromSupabase() {
  try {
    const session = await getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?user_id=eq.${session.user_id}`,
      {
        method: 'DELETE',
        headers: buildHeaders(session.access_token)
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
    await notifyDashboardToRefresh();
    return { success: true };
  } catch (error) {
    console.error('Clear from Supabase failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear sites' };
  }
}

/** @param {chrome.runtime.InstalledDetails} details */
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: `${DEFAULT_DASHBOARD_ORIGIN}${DASHBOARD_PATHS.login}` });
  }
});

chrome.runtime.onStartup.addListener(() => {
  void syncFromSupabase();
});

// Note: Supabase real-time is not directly available in background scripts via fetch,
// but the website notifies us via messages or we poll. 
// For production MV3, we use chrome.alarms instead of setInterval.
chrome.alarms.create('syncSupabase', { periodInMinutes: 2 });
/** @param {chrome.alarms.Alarm} alarm */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncSupabase') {
    void syncFromSupabase();
  }
});

/**
 * @param {Object} [options]
 * @param {boolean} [options.clearGuestData]
 */
async function notifyDashboardToClearSession(options = {}) {
  try {
    const { clearGuestData = false } = options;
    const result = await chrome.storage.local.get(STORAGE_KEYS.dashboardOrigin);
    const dashboardOrigin = result[STORAGE_KEYS.dashboardOrigin];
    const origin = dashboardOrigin || DEFAULT_DASHBOARD_ORIGIN;
    
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    if (tabs && tabs[0] && tabs[0].id !== undefined) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'clearLocalStorage',
        clearGuestData
      }).catch(() => {
        // Tab may not have the content script loaded yet — safe to ignore
      });
    }
  } catch (e) {
    console.warn('Failed to notify dashboard:', e);
  }
}

if (DEBUG_MODE) console.log('CTRL+BLCK Background Service Worker Started with Sync Logic');

