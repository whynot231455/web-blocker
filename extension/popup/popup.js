const syncConfig = globalThis.CTRL_BLCK_SYNC;
const storageKeys = syncConfig.storageKeys;
const messageActions = syncConfig.messageActions;

/** @param {string} url */
function extractHostname(url) {
    return syncConfig.normalizeHostname(url);
}

// Check if URL is an internal browser page
/** @param {string} url */
function isInternalPage(url) {
    if (!url) return true;

    return url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url.startsWith('file://') ||
        url.startsWith('chrome-search://') ||
        url.startsWith('chrome-devtools://');
}

// Get internal page type for user-friendly message
/** @param {string} url */
function getInternalPageType(url) {
    if (!url) return 'unknown page';

    if (url.startsWith('chrome://')) return 'Chrome internal page';
    if (url.startsWith('chrome-extension://')) return 'browser extension page';
    if (url.startsWith('moz-extension://')) return 'Firefox extension page';
    if (url.startsWith('edge://')) return 'Edge internal page';
    if (url.startsWith('about:')) return 'browser about page';
    if (url.startsWith('file://')) return 'local file';
    if (url.startsWith('chrome-search://')) return 'Chrome search page';
    if (url.startsWith('chrome-devtools://')) return 'Chrome Developer Tools';

    return 'internal browser page';
}

const defaultDashboardOrigin = syncConfig.defaultDashboardOrigin;
const dashboardPaths = syncConfig.dashboardPaths;

// Global variables
/** @type {HTMLElement | null} */
let add_button;
/** @type {HTMLElement | null} */
let list_table;
/** @type {HTMLElement | null} */
let clear_button;
/** @type {HTMLElement | null} */
let reloadButton;
/** @type {HTMLAnchorElement | null} */
let dashboardLink;
/** @type {number | null | ReturnType<typeof setTimeout>} */
let storageUpdateTimeout = null;
/** @type {number | null | ReturnType<typeof setInterval>} */
let timerInterval = null;

// DOM Elements for timer
/** @type {HTMLElement | null} */
let sessionContainer = null;
/** @type {HTMLElement | null} */
let sessionUrlEl = null;
/** @type {HTMLElement | null} */
let sessionTimerEl = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    add_button = document.querySelector('.add_button');
    list_table = document.querySelector('.list_table');
    clear_button = document.querySelector('.clear_button');
    reloadButton = document.querySelector('.reload_button');
    dashboardLink = document.querySelector('#dashboardLink');
    sessionContainer = document.querySelector('#active-session-container');
    sessionUrlEl = document.querySelector('#active-session-url');
    sessionTimerEl = document.querySelector('#active-session-timer');

    // Check if we're on the confirmation screen
    const isConfirmationScreen = !!document.querySelector('.confirmation-screen');

    // Initialize the popup
    void initializePopup(isConfirmationScreen);
    void updateSyncStatus();
    void startTimerLoop();

    // Event listener for delete functionality
    document.addEventListener("click", async function (event) {
        const target = /** @type {HTMLElement} */ (event.target);
        if (target && target.classList.contains('delete-icon')) {
            try {
                const listItem = target.closest('li');
                if (!listItem) return;

                const hostname = listItem.getAttribute('data-hostname');
                if (!hostname) return;

                // Remove from DOM
                listItem.remove();

                // Remove from storage - compare by hostname
                const urls = await getURLs();
                const updatedURLs = urls.filter((/** @type {string} */ url) => syncConfig.normalizeHostname(url) !== hostname);
                await chrome.storage.local.set({ [storageKeys.blockedSites]: updatedURLs });

                // Notify website to sync display
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: messageActions.triggerSync });
                    }
                });

                // Sync with Supabase if authenticated
                chrome.runtime.sendMessage({ action: messageActions.deleteSiteFromSupabase, url: hostname });
            } catch (error) {
                console.error('Error deleting URL:', error);
            }
        }
    });
});

async function updateSyncStatus() {
    const { [storageKeys.supabaseSession]: supabaseSession, isGuest } = await chrome.storage.local.get([
        storageKeys.supabaseSession,
        'isGuest'
    ]);
    const subHeading = document.querySelector('.sub_heading');
    if (subHeading) {
        // Clear existing sync-status if any
        const existingStatus = subHeading.querySelector('.sync-status');
        if (existingStatus) existingStatus.remove();

        const statusDiv = document.createElement('div');
        statusDiv.className = 'sync-status';
        statusDiv.style.fontSize = '8px';
        statusDiv.style.marginTop = '8px';

        if (supabaseSession) {
            statusDiv.style.color = '#4CAF50';
            statusDiv.textContent = '● Synced with Dashboard';
        } else if (isGuest) {
            statusDiv.className = 'sync-status guest-mode';
            statusDiv.style.color = '#777';
            statusDiv.textContent = '● Guest Mode (Local Storage)';
        } else {
            statusDiv.style.color = '#f44336';
            statusDiv.textContent = '● Not Synchronized';
        }
        subHeading.appendChild(statusDiv);
    }
}

async function getDashboardOrigin() {
    try {
        const { [storageKeys.dashboardOrigin]: storedOrigin } = await chrome.storage.local.get(storageKeys.dashboardOrigin);
        return typeof storedOrigin === 'string' && storedOrigin ? storedOrigin : defaultDashboardOrigin;
    } catch (error) {
        console.error('Error getting dashboard origin:', error);
        return defaultDashboardOrigin;
    }
}

/** @param {string} path */
async function buildDashboardUrl(path) {
    const origin = await getDashboardOrigin();
    return new URL(path, origin).toString();
}

async function configureDashboardLink() {
    if (!dashboardLink) {
        return;
    }

    const { [storageKeys.supabaseSession]: supabaseSession, isGuest } = await chrome.storage.local.get([
        storageKeys.supabaseSession,
        'isGuest'
    ]);
    const destinationPath = supabaseSession || isGuest ? dashboardPaths.dashboard : dashboardPaths.login;
    const destinationUrl = await buildDashboardUrl(destinationPath);

    dashboardLink.href = destinationUrl;
    dashboardLink.addEventListener('click', async function (event) {
        event.preventDefault();
        await chrome.tabs.create({ url: destinationUrl });
        window.close();
    });
}

/** @param {boolean} isConfirmationScreen */
async function initializePopup(isConfirmationScreen) {
    try {
        await configureDashboardLink();

        if (!isConfirmationScreen) {
            const { [storageKeys.supabaseSession]: supabaseSession, isGuest } = await chrome.storage.local.get([
                storageKeys.supabaseSession,
                'isGuest'
            ]);
            
            if (!supabaseSession && !isGuest) {
                const loginUrl = await buildDashboardUrl(dashboardPaths.login);
                await chrome.tabs.create({ url: loginUrl });
                window.close();
                return;
            }

            const currentTabURL = await getCurrentTabURL();

            if (currentTabURL && isInternalPage(currentTabURL)) {
                showInternalPageMessage(currentTabURL);
            } else if (currentTabURL) {
                if (add_button) {
                    add_button.addEventListener("click", add_elements);
                }
                if (clear_button) {
                    clear_button.addEventListener("click", removeAll_elements);
                }
                loadURL();
            }
        }
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
}

/** @param {string | null} url */
function showInternalPageMessage(url) {
    const pageType = getInternalPageType(url || '');
    const popup = document.querySelector('.popup');

    if (popup) {
        const header = /** @type {HTMLElement | null} */ (document.querySelector('.header'));
        const tagline = /** @type {HTMLElement | null} */ (document.querySelector('.tagline'));
        const currentSite = /** @type {HTMLElement | null} */ (document.querySelector('.current-site'));
        const urlListSection = /** @type {HTMLElement | null} */ (document.querySelector('.url-list-section'));
        const addButton = /** @type {HTMLElement | null} */ (document.querySelector('.add_button'));
        const clearButton = /** @type {HTMLElement | null} */ (document.querySelector('.clear_button'));
        const urlList = /** @type {HTMLElement | null} */ (document.querySelector('#urlList, .list_table'));

        if (header) header.style.display = 'none';
        if (tagline) tagline.style.display = 'none';
        if (currentSite) currentSite.style.display = 'none';
        if (urlListSection) urlListSection.style.display = 'none';
        if (addButton) addButton.style.display = 'none';
        if (clearButton) clearButton.style.display = 'none';
        if (urlList) urlList.style.display = 'none';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'internal-page-message';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'message-icon';
        iconDiv.textContent = '🚫';
        messageDiv.appendChild(iconDiv);

        const title = document.createElement('h3');
        title.textContent = 'Cannot Block This Page';
        messageDiv.appendChild(title);

        const p1 = document.createElement('p');
        p1.textContent = 'This is a ';
        const strong = document.createElement('strong');
        strong.textContent = pageType;
        p1.appendChild(strong);
        p1.appendChild(document.createTextNode(' and cannot be blocked for security reasons.'));
        messageDiv.appendChild(p1);

        const p2 = document.createElement('p');
        p2.className = 'message-hint';
        p2.textContent = 'Try navigating to a regular website to use CTRL+BLCK.';
        messageDiv.appendChild(p2);

        const editButton = document.createElement('button');
        editButton.className = 'edit-url-button';
        editButton.textContent = 'Edit URL List';
        editButton.addEventListener('click', function () {
            chrome.tabs.create({ url: chrome.runtime.getURL('main.html') });
            window.close();
        });
        messageDiv.appendChild(editButton);

        popup.innerHTML = '';
        popup.appendChild(messageDiv);

        document.body.style.width = '300px';
        document.body.style.height = '250px';
    }
}

async function getCurrentTabURL() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return null;
        return tab.url;
    } catch (error) {
        console.error('Error getting current tab URL:', error);
        return null;
    }
}

async function getURLs() {
    try {
        const results = await chrome.storage.local.get(storageKeys.blockedSites);
        const urls = /** @type {any} */ (results[storageKeys.blockedSites]);
        return urls || [];
    } catch (error) {
        console.error('Error getting URLs from storage:', error);
        return [];
    }
}

async function loadURL() {
    try {
        const urls = await getURLs();
        if (urls && Array.isArray(urls) && list_table) {
            list_table.innerHTML = "";
            const limitedURLs = urls.slice(0, 5);

            if (limitedURLs.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'empty-state';
                emptyLi.textContent = 'No blocked sites yet';
                emptyLi.style.textAlign = 'center';
                emptyLi.style.color = '#999';
                emptyLi.style.padding = '10px';
                emptyLi.style.fontSize = '11px';
                list_table.appendChild(emptyLi);
                return;
            }

            limitedURLs.forEach(url => {
                const hostname = extractHostname(url);
                if (hostname && list_table) {
                    const li = document.createElement('li');
                    li.setAttribute('data-hostname', hostname);
                    li.style.display = 'flex';
                    li.style.alignItems = 'center';
                    li.style.gap = '15px';

                    const favicon = document.createElement('img');
                    favicon.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                    favicon.width = 24;
                    favicon.height = 24;
                    favicon.addEventListener('error', function () {
                        /** @type {any} */ (this).src = "../assets/icons/delete-icon.svg";
                    });

                    const span = document.createElement('span');
                    const dotCount = (hostname.match(/\./g) || []).length;
                    span.textContent = (hostname.startsWith('www.') || dotCount > 1) ? hostname : 'www.' + hostname;

                    const close_icon = document.createElement('img');
                    close_icon.src = "../assets/icons/delete-icon.svg";
                    close_icon.className = 'delete-icon';
                    close_icon.width = 24;
                    close_icon.height = 24;
                    close_icon.style.cursor = 'pointer';

                    li.appendChild(favicon);
                    li.appendChild(span);
                    li.appendChild(close_icon);
                    list_table.appendChild(li);
                }
            });
        }
    } catch (error) {
        console.error('Error loading URLs:', error);
    }
}

async function add_elements() {
    try {
        const currentTabURL = await getCurrentTabURL();
        if (!currentTabURL || isInternalPage(currentTabURL)) {
            const pageType = getInternalPageType(currentTabURL || '');
            alert(`Cannot block this page.\n\nThis is a ${pageType} and cannot be blocked for security reasons.`);
            return;
        }

        const results = await chrome.storage.local.get([storageKeys.blockedSites, 'hiddenUrls']);
        const URL_list = /** @type {string[]} */ (results[storageKeys.blockedSites] || []);
        const hidden_list = /** @type {string[]} */ (results.hiddenUrls || []);

        const currentHostname = syncConfig.normalizeHostname(currentTabURL);
        if (!currentHostname) {
            alert('Could not determine website hostname');
            return;
        }

        const storedHostnames = URL_list.map(url => syncConfig.normalizeHostname(url)).filter(Boolean);
        const hiddenHostnames = hidden_list.map(url => syncConfig.normalizeHostname(url)).filter(Boolean);

        if (hiddenHostnames.includes(currentHostname)) {
            alert(`${currentHostname} is already in your hidden list!`);
            return;
        }

        if (!storedHostnames.includes(currentHostname)) {
            const updatedURLs = [currentTabURL, ...URL_list];
            await chrome.storage.local.set({ [storageKeys.blockedSites]: updatedURLs });

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: messageActions.triggerSync });
                }
            });

            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
            chrome.runtime.sendMessage({ action: messageActions.addSiteToSupabase, url: currentTabURL });
            showConfirmationScreen(currentHostname);
        } else {
            alert(`${currentHostname} is already in your blocked list!`);
        }
    } catch (error) {
        console.error('Error adding element:', error);
        alert('Could not add this website to the block list.\nError: ' + (/** @type {any} */ (error)).message);
    }
}

/** @param {string} hostname */
function showConfirmationScreen(hostname) {
    try {
        const popup = /** @type {HTMLElement | null} */ (document.querySelector('.popup'));
        if (popup) popup.style.display = 'none';

        document.body.style.width = '320px';
        document.body.style.height = '450px';
        document.body.style.padding = '0';
        document.body.style.margin = '0';

        const confirmationScreen = document.createElement('div');
        confirmationScreen.className = 'confirmation-screen';

        const content = document.createElement('div');
        content.className = 'confirmation-content';

        const info = document.createElement('div');
        info.className = 'website-info';
        const h2 = document.createElement('h2');
        h2.className = 'blocked-url';
        h2.textContent = hostname;
        info.appendChild(h2);
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'website-icon';
        const faviconImg = document.createElement('img');
        faviconImg.className = 'favicon-image';
        faviconImg.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
        faviconImg.alt = hostname;
        faviconImg.addEventListener('error', function () {
            /** @type {any} */ (this).src = '../assets/icons/delete-icon.svg';
        });
        iconDiv.appendChild(faviconImg);
        info.appendChild(iconDiv);
        content.appendChild(info);

        const msgDiv = document.createElement('div');
        msgDiv.className = 'confirmation-message';
        const h3 = document.createElement('h3');
        h3.textContent = 'please reload the website to block it.';
        msgDiv.appendChild(h3);
        content.appendChild(msgDiv);

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'reload_button';
        reloadBtn.textContent = 'RELOAD PAGE';
        reloadBtn.addEventListener('click', function () {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs && tabs[0] && typeof tabs[0].id === 'number') {
                    chrome.tabs.reload(tabs[0].id);
                    window.close();
                }
            });
        });
        content.appendChild(reloadBtn);

        confirmationScreen.appendChild(content);
        document.body.appendChild(confirmationScreen);
    } catch (error) {
        console.error('Error showing confirmation screen:', error);
    }
}

async function removeAll_elements() {
    try {
        const { [storageKeys.supabaseSession]: supabaseSession, isGuest } = await chrome.storage.local.get([
            storageKeys.supabaseSession,
            'isGuest'
        ]);

        if (supabaseSession && !isGuest) {
            const response = await chrome.runtime.sendMessage({ action: messageActions.clearSitesFromSupabase });
            if (response && response.success === false && response.error !== 'Not authenticated') {
                throw new Error(response.error || 'Failed to clear dashboard sites');
            }
        }

        await chrome.storage.local.set({ [storageKeys.blockedSites]: [] });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: messageActions.triggerSync });
            }
        });

        window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));

        if (list_table) {
            list_table.innerHTML = "";
            const emptyLi = document.createElement('li');
            emptyLi.className = 'empty-state';
            emptyLi.textContent = 'No blocked sites yet';
            emptyLi.style.textAlign = 'center';
            emptyLi.style.color = '#999';
            emptyLi.style.padding = '10px';
            emptyLi.style.fontSize = '11px';
            list_table.appendChild(emptyLi);
        }
    } catch (error) {
        console.error('Error clearing all elements:', error);
        alert('Could not clear the blocked sites list.');
    }
}

chrome.storage.onChanged.addListener(function (_changes, namespace) {
    if (namespace === 'local' && (_changes[storageKeys.blockedSites] || _changes.isGuest || _changes.activeSession)) {
        if (storageUpdateTimeout) clearTimeout(storageUpdateTimeout);
        storageUpdateTimeout = setTimeout(() => {
            loadURL();
            updateSyncStatus();
        }, 100);
    }
});

async function startTimerLoop() {
    await updateActiveSessionTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateActiveSessionTimer, 1000);
}

async function updateActiveSessionTimer() {
    if (!sessionContainer || !sessionUrlEl || !sessionTimerEl) return;

    /**
     * @typedef {Object} FocusSession
     * @property {string} url
     * @property {string} start_time
     * @property {number} target_duration
     * @property {string} status
     */

    const data = await chrome.storage.local.get('activeSession');
    const activeSession = /** @type {FocusSession | null} */ (data.activeSession);

    if (activeSession && activeSession.status === 'active') {
        const startTime = new Date(activeSession.start_time).getTime();
        const durationMs = (activeSession.target_duration || 0) * 60 * 1000;
        const expiryTime = startTime + durationMs;
        const now = Date.now();
        const timeLeft = expiryTime - now;

        if (timeLeft > 0) {
            sessionContainer.style.display = 'block';
            sessionUrlEl.textContent = syncConfig.normalizeHostname(activeSession.url);
            const totalSeconds = Math.floor(timeLeft / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            sessionTimerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return;
        }
    }
    sessionContainer.style.display = 'none';
}
