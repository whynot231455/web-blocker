/**
 * This script runs on the dashboard domain (localhost:3000)
 * It handles bidirectional synchronization between the website and the extension.
 */

/**
 * Sync from Website to Extension
 */
function syncDashboardToExtension() {
    try {
        // 1. Sync Supabase Session
        const storageKey = 'sb-laovgvktsxwiieuznnlm-auth-token';
        const sessionData = localStorage.getItem(storageKey);

        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session && session.access_token) {
                chrome.runtime.sendMessage({
                    action: 'syncSession',
                    session: {
                        access_token: session.access_token,
                        user_id: session.user.id,
                        expires_at: session.expires_at
                    }
                });
            }
        } else {
            chrome.runtime.sendMessage({ action: 'clearSession' });
        }

        // 2. Sync Guest Status
        const guestStatus = localStorage.getItem('ctrl_blck_guest') === 'true';
        chrome.runtime.sendMessage({
            action: 'syncGuestStatus',
            isGuest: guestStatus
        });
    } catch (error) {
        console.error('CTRL+BLCK: Error syncing dashboard to extension:', error);
    }
}

/**
 * Sync from Extension to Website (Guest Mode sites)
 */
async function syncExtensionToDashboard() {
    try {
        const { urls, isGuest } = await chrome.storage.local.get(['urls', 'isGuest']);
        
        // Only sync sites from extension to website when in Guest Mode
        // In authenticated mode, Supabase is the source of truth.
        if (isGuest && Array.isArray(urls)) {
            const websiteSites = urls.map(url => {
                try {
                    const cleanUrl = url.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];
                    return {
                        id: `local_${btoa(cleanUrl).substring(0, 10)}`, 
                        url: cleanUrl,
                        user_id: 'guest',
                        is_active: true,
                        created_at: new Date().toISOString()
                    };
                } catch (e) {
                    console.error('CTRL+BLCK: Mapping error for URL:', url, e);
                    return null;
                }
            }).filter(s => s !== null);

            const currentLocalSites = localStorage.getItem('ctrl_blck_sites');
            const newSitesString = JSON.stringify(websiteSites);

            if (currentLocalSites !== newSitesString) {
                console.log('CTRL+BLCK: Updating localStorage from extension:', websiteSites.length, 'sites');
                localStorage.setItem('ctrl_blck_sites', newSitesString);
                
                // Dispatch event so the website's useBlockedSites hook can see it
                // We use both 'storage' and a custom event to ensure compatibility
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'ctrl_blck_sites',
                    newValue: newSitesString,
                    storageArea: localStorage
                }));
                
                // Custom event for same-tab reactivity
                window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            }
        }
    } catch (error) {
        console.error('CTRL+BLCK: Error syncing extension to dashboard:', error);
    }
}

// Initial sync on load
syncDashboardToExtension();
syncExtensionToDashboard();

// Listen for website storage changes
window.addEventListener('storage', (event) => {
    if (event.key === 'ctrl_blck_guest') {
        syncDashboardToExtension();
    }
    if (event.key === 'auth-token') {
        syncDashboardToExtension();
    }
    if (event.key === 'ctrl_blck_sites') {
        const guestStatus = localStorage.getItem('ctrl_blck_guest') === 'true';
        if (guestStatus) {
            try {
                const sites = JSON.parse(event.newValue);
                if (Array.isArray(sites)) {
                    const urls = sites.map(s => s.url);
                    chrome.runtime.sendMessage({
                        action: 'syncUrls', // Need to handle this in background.js
                        urls: urls
                    });
                }
            } catch (e) {
                console.error('CTRL+BLCK: Error parsing sites from storage:', e);
            }
        }
    }
});

// Listen for extension storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.urls || changes.isGuest)) {
        syncExtensionToDashboard();
    }
});

// Periodically sync to ensure data stays consistent
setInterval(() => {
    syncDashboardToExtension();
    syncExtensionToDashboard();
}, 2000); // Check every 2 seconds for active dashboard use
