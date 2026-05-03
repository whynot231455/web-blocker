/// <reference lib="webworker" />
// Load shared configuration (credentials, storage keys, message actions)
importScripts('../lib/sync-constants.js');

const syncConfig = globalThis.CTRL_BLCK_SYNC;
const SUPABASE_URL = syncConfig.supabaseUrl;
const SUPABASE_KEY = syncConfig.supabaseKey;
const normalizeHostname = syncConfig.normalizeHostname;

const STORAGE_KEYS = {
  supabaseSession: syncConfig.storageKeys.supabaseSession,
  dashboardOrigin: syncConfig.storageKeys.dashboardOrigin,
  blockedSites: syncConfig.storageKeys.blockedSites,
  guestFlag: syncConfig.storageKeys.guestFlag
};

const MESSAGE_ACTIONS = syncConfig.messageActions;

const DEFAULT_DASHBOARD_ORIGIN = syncConfig.defaultDashboardOrigin;
const DASHBOARD_PATHS = {
  login: syncConfig.dashboardPaths.login
};

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
        isGuest: false
      },
      () => {
        console.log('Session saved, triggering initial sync');
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
        console.log('Session cleared');
        await notifyDashboardToClearSession({ clearGuestData: !preserveGuestData });
      })
      .catch(error => {
        console.warn('Failed to clear session state:', error);
      });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncGuestStatus) {
    chrome.storage.local.set({ isGuest: message.isGuest }, () => {
      console.log('Guest status saved:', message.isGuest);
    });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncUrls) {
    const normalizedUrls = Array.isArray(message.urls)
      ? Array.from(new Set(message.urls.map(syncConfig.normalizeHostname).filter(Boolean)))
      : [];

    const storageData = { [STORAGE_KEYS.blockedSites]: normalizedUrls };
    if (message.activeSession !== undefined) {
        storageData.activeSession = message.activeSession;
    }

    chrome.storage.local.set(storageData, () => {
      console.log('URLs synced from dashboard:', normalizedUrls.length);
    });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.syncDashboardOrigin) {
    const origin = typeof message.origin === 'string' ? message.origin : DEFAULT_DASHBOARD_ORIGIN;
    chrome.storage.local.set({ [STORAGE_KEYS.dashboardOrigin]: origin });
    return;
  }

  if (message.action === MESSAGE_ACTIONS.triggerSync) {
    syncFromSupabase().then(res => sendResponse?.(res));
    return true;
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
});

/**
 * @typedef {Object} SupabaseSession
 * @property {string} access_token
 * @property {string} user_id
 * @property {number} [expires_at]
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
  }

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

async function syncFromSupabase() {
  try {
    const session = await getSession();
    if (!session || !session.access_token || !session.user_id) {
      console.log('No active session, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    // Check if the token is expired before making requests
    if (isTokenExpired(session.access_token)) {
      console.warn('Supabase token expired, clearing stale session');
      await clearExtensionSessionState();
      await notifyDashboardToClearSession({ clearGuestData: false });
      return { success: false, error: 'Token expired — re-sync from dashboard' };
    }

    // Fetch blocked sites
    const sitesPromise = fetch(
      `${SUPABASE_URL}/rest/v1/blocked_sites?select=url,is_active&user_id=eq.${session.user_id}`,
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
      console.warn('Supabase returned 401, clearing stale session');
      await clearExtensionSessionState();
      await notifyDashboardToClearSession({ clearGuestData: false });
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

    await chrome.storage.local.set({ 
        [STORAGE_KEYS.blockedSites]: allBlockedUrls,
        activeSession: activeSession
    });

    console.log(`Synced ${allBlockedUrls.length} blocked sites from Supabase`);
    if (activeSession) {
      console.log(`Active session found for: ${activeSession.url}`);
    }
    return { success: true, count: allBlockedUrls.length };
  } catch (error) {
    console.error('Error during syncFromSupabase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

/**
 * @param {string} url
 */
async function addSiteToSupabase(url) {
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
      const [{ id, is_active: isActive }] = existingRows;
      if (!isActive) {
        const reactivateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/blocked_sites?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: {
              ...buildHeaders(session.access_token),
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ is_active: true })
          }
        );

        if (!reactivateResponse.ok) {
          throw new Error(await reactivateResponse.text());
        }
      }

      await syncFromSupabase();
      await notifyDashboardForGuestSync();
      return { success: true, url: hostname, reactivated: !isActive };
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
        is_active: true
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
    await notifyDashboardForGuestSync();
    return { success: true, url: hostname };
  } catch (error) {
    console.error('Add to Supabase failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add site' };
  }
}


/**
 * Notify dashboard for guest mode
 */
async function notifyDashboardForGuestSync() {
  try {
    const result = await chrome.storage.local.get(['isGuest', STORAGE_KEYS.dashboardOrigin]);
    const dashboardOrigin = result[STORAGE_KEYS.dashboardOrigin];
    const origin = dashboardOrigin || DEFAULT_DASHBOARD_ORIGIN;
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });

    if (tabs[0] && tabs[0].id !== undefined) {
      chrome.tabs.sendMessage(tabs[0].id, { action: MESSAGE_ACTIONS.triggerSync });
    }
  } catch (error) {
    console.warn('Failed to notify dashboard for guest sync:', error);
  }
}

/**
 * @param {string} hostname
 */
async function deleteSiteFromSupabase(hostname) {
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
        method: 'DELETE',
        headers: buildHeaders(session.access_token)
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await syncFromSupabase();
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
      });
    }
  } catch (e) {
    console.warn('Failed to notify dashboard:', e);
  }
}

console.log('CTRL+BLCK Background Service Worker Started with Sync Logic');

