const SUPABASE_URL = 'https://laovgvktsxwiieuznnlm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3Zndmt0c3h3aWlldXpubmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY0MDIsImV4cCI6MjA4NzE0MjQwMn0.ZZBc9I7QLAer9cb05okS2yKcB-m8WZgKqgdQtkCbfLI';

// Add message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id).catch(error => {
      console.warn('Could not close tab:', error);
    });
  }

  if (message.action === 'syncSession') {
    chrome.storage.local.set({ supabase_session: message.session }, () => {
      console.log('Session saved, triggering initial sync');
      syncFromSupabase();
    });
  }

  if (message.action === 'clearSession') {
    chrome.storage.local.remove(['supabase_session'], () => {
      console.log('Session cleared');
    });
  }

  if (message.action === 'syncGuestStatus') {
    chrome.storage.local.set({ isGuest: message.isGuest }, () => {
      console.log('Guest status saved:', message.isGuest);
    });
  }

  if (message.action === 'syncUrls') {
    chrome.storage.local.set({ urls: message.urls }, () => {
      console.log('URLs synced from dashboard:', message.urls.length);
    });
  }

  if (message.action === 'triggerSync') {
    syncFromSupabase().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.action === 'addSiteToSupabase') {
    addSiteToSupabase(message.url).then(sendResponse);
    return true;
  }

  if (message.action === 'deleteSiteFromSupabase') {
    deleteSiteFromSupabase(message.url).then(sendResponse);
    return true;
  }
});

/**
 * Fetches blocked sites from Supabase and merges them with local list.
 */
async function syncFromSupabase() {
  try {
    const { supabase_session } = await chrome.storage.local.get('supabase_session');
    if (!supabase_session || !supabase_session.access_token) {
      console.log('No active session, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/blocked_sites?user_id=eq.${supabase_session.user_id}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${supabase_session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    // The dashboard uses 'url' and 'is_active'
    const supabaseUrls = data.filter(site => site.is_active).map(site => site.url);

    // Update local storage
    await chrome.storage.local.set({ urls: supabaseUrls });

    console.log(`Synced ${supabaseUrls.length} sites from Supabase`);
    return { success: true, count: supabaseUrls.length };
  } catch (error) {
    console.error('Error during syncFromSupabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Adds a site to Supabase.
 */
async function addSiteToSupabase(url) {
  try {
    const { supabase_session } = await chrome.storage.local.get('supabase_session');
    if (!supabase_session) return { success: false, error: 'Not authenticated' };

    // Clean the URL to hostname only for consistency with dashboard
    let hostname = url.trim().toLowerCase();
    hostname = hostname.replace(/^https?:\/\//i, '').split('/')[0];

    const response = await fetch(`${SUPABASE_URL}/rest/v1/blocked_sites`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${supabase_session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        url: hostname,
        user_id: supabase_session.user_id,
        is_active: true
      })
    });

    if (!response.ok) throw new Error(await response.text());
    return { success: true };
  } catch (error) {
    console.error('Add to Supabase failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a site from Supabase.
 */
async function deleteSiteFromSupabase(hostname) {
  try {
    const { supabase_session } = await chrome.storage.local.get('supabase_session');
    if (!supabase_session) return { success: false, error: 'Not authenticated' };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/blocked_sites?user_id=eq.${supabase_session.user_id}&url=eq.${hostname}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${supabase_session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(await response.text());
    return { success: true };
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle extension installation - redirect to website for setup
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'http://localhost:3000/login' });
  }
});

// Initial sync on startup
chrome.runtime.onStartup.addListener(() => {
  syncFromSupabase();
});

// Periodic sync every 10 minutes
setInterval(syncFromSupabase, 10 * 60 * 1000);

console.log('🚀 CTRL+BLCK Background Service Worker Started with Sync Logic');