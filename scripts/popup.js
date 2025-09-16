function extractHostname(url) {
    try {
        // Handle null or undefined
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        // Clean up the URL
        let cleanUrl = url.trim();
        
        // If it's already a full URL, extract hostname
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            const urlObj = new URL(cleanUrl);
            return urlObj.hostname.toLowerCase();
        } else {
            // If it's just a domain name, return as-is (after cleaning)
            return cleanUrl.split('/')[0].toLowerCase();
        }
    } catch (error) {
        console.warn('Could not parse URL:', url, error);
        // Return null instead of the original string to indicate failure
        return null;
    }
}

// Check if URL is an internal browser page
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

// Global variables
let add_button, list_table, clear_button, reloadButton;
let storageUpdateTimeout;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    add_button = document.querySelector('.add_button');
    list_table = document.querySelector('.list_table');
    clear_button = document.querySelector('.clear_button');
    reloadButton = document.querySelector('.reload_button');
    
    // Check if we're on the confirmation screen
    const isConfirmationScreen = document.querySelector('.confirmation-screen');
    
    // Initialize the popup
    initializePopup(isConfirmationScreen);
});

async function initializePopup(isConfirmationScreen) {
    try {
        if (!isConfirmationScreen) {
            // Check current tab and set up popup accordingly
            const currentTabURL = await getCurrentTabURL();
            
            if (isInternalPage(currentTabURL)) {
                // Show internal page message instead of normal functionality
                showInternalPageMessage(currentTabURL);
            } else {
                // Normal popup functionality
                if (add_button) {
                    add_button.addEventListener("click", add_elements);
                } else {
                    console.warn('Add button not found');
                }
                
                if (clear_button) {
                    clear_button.addEventListener("click", removeAll_elements);
                } else {
                    console.warn('Clear button not found');
                }
                
                // Load URLs regardless of button availability
                loadURL();
            }
        } else {
            // Confirmation screen functionality
            if (reloadButton) {
                reloadButton.addEventListener("click", function() {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs && tabs[0]) {
                            chrome.tabs.reload(tabs[0].id);
                            window.close();
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
}

function showInternalPageMessage(url) {
    const pageType = getInternalPageType(url);
    const popup = document.querySelector('.popup');
    
    if (popup) {
        // Hide ALL popup content sections
        const header = document.querySelector('.header');
        const tagline = document.querySelector('.tagline');
        const currentSite = document.querySelector('.current-site');
        const urlListSection = document.querySelector('.url-list-section');
        const addButton = document.querySelector('.add_button');
        const clearButton = document.querySelector('.clear_button');
        const urlList = document.querySelector('#urlList, .list_table');
        
        // Hide all sections
        if (header) header.style.display = 'none';
        if (tagline) tagline.style.display = 'none';
        if (currentSite) currentSite.style.display = 'none';
        if (urlListSection) urlListSection.style.display = 'none';
        if (addButton) addButton.style.display = 'none';
        if (clearButton) clearButton.style.display = 'none';
        if (urlList) urlList.style.display = 'none';
        
        // Create internal page message as the ONLY content
        const messageDiv = document.createElement('div');
        messageDiv.className = 'internal-page-message';
        
        messageDiv.innerHTML = `
            <div class="message-icon">🚫</div>
            <h3>Cannot Block This Page</h3>
            <p>This is a <strong>${pageType}</strong> and cannot be blocked for security reasons.</p>
            <p class="message-hint">Try navigating to a regular website to use CTRL+BLCK.</p>
            <button class="edit-url-button">Edit URL List</button>
        `;
        
        // Clear popup content and add only the message
        popup.innerHTML = '';
        popup.appendChild(messageDiv);
        
        // Add event listener for the Edit URL List button
        const editButton = messageDiv.querySelector('.edit-url-button');
        if (editButton) {
            editButton.addEventListener('click', function() {
                // Open main.html in a new tab
                chrome.tabs.create({ url: chrome.runtime.getURL('main.html') });
                // Close the popup
                window.close();
            });
        }
        
        // Set popup to size that accommodates the button
        document.body.style.width = '300px';
        document.body.style.height = '250px';
    }
}


async function getCurrentTabURL() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if tab and tab.url exist
        if (!tab || !tab.url) {
            return null;
        }
        
        return tab.url;
    } catch (error) {
        console.error('Error getting current tab URL:', error);
        return null;
    }
}

async function getURLs() {
    try {
        const results = await chrome.storage.local.get('urls');
        const urls = results.urls;
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
            // Clear existing list first
            list_table.innerHTML = "";
            
            const limitedURLs = urls.slice(0, 5);

            if (limitedURLs.length === 0) {
                // Show empty state
                const emptyLi = document.createElement('li');
                emptyLi.className = 'empty-state';
                emptyLi.textContent = 'No blocked sites yet';
                emptyLi.style.textAlign = 'center';
                emptyLi.style.color = '#999';
                emptyLi.style.padding = '10px';
                list_table.appendChild(emptyLi);
                return;
            }

            limitedURLs.forEach(url => {
                const hostname = extractHostname(url);

                if (hostname) { // Only create list item if hostname is valid
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.alignItems = 'center';
                    li.style.gap = '10px';

                    const favicon = document.createElement('img');
                    favicon.src = `https://www.google.com/s2/favicons?domain=${hostname}`;
                    favicon.width = 16;
                    favicon.height = 16;
                    
                    favicon.addEventListener('error', function() {
                        this.src = "./icons/default-site-icon.svg";
                    });

                    const span = document.createElement('span');
                    span.textContent = hostname;

                    const close_icon = document.createElement('img');
                    close_icon.src = "./icons/delete-icon.svg";
                    close_icon.className = 'delete-icon';
                    close_icon.width = 16;
                    close_icon.height = 16;
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
            const pageType = getInternalPageType(currentTabURL);
            alert(`Cannot block this page.\n\nThis is a ${pageType} and cannot be blocked for security reasons.`);
            return;
        }

        const URL_list = await getURLs();
        
        // Safely extract hostname
        const currentHostname = extractHostname(currentTabURL);
        
        if (!currentHostname) {
            alert('Could not determine website hostname');
            return;
        }
        
        const storedHostnames = URL_list.map(url => extractHostname(url)).filter(h => h !== null);

        if (!storedHostnames.includes(currentHostname)) {
            const updatedURLs = [currentTabURL, ...URL_list];

            // Save updated URLs
            await chrome.storage.local.set({ urls: updatedURLs });

            // Show confirmation screen
            showConfirmationScreen(currentHostname);
        } else {
            // Show message that site is already blocked
            alert(`${currentHostname} is already in your blocked list!`);
        }
    } catch (error) {
        console.error('Error adding element:', error);
        alert('Could not add this website to the block list.\nError: ' + error.message);
    }
}

function showConfirmationScreen(hostname) {
    try {
        // Hide the normal popup content
        const popup = document.querySelector('.popup');
        if (popup) popup.style.display = 'none';
        
        // Set larger dimensions for confirmation screen
        document.body.style.width = '320px';
        document.body.style.height = '450px';
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        
        // Create and show confirmation screen
        const confirmationScreen = document.createElement('div');
        confirmationScreen.className = 'confirmation-screen';
        
        confirmationScreen.innerHTML = `
            <div class="confirmation-content">
                <div class="website-info">
                    <h2 class="blocked-url">${hostname}</h2>
                    <div class="website-icon">
                        <img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=64" 
                             alt="${hostname}" 
                             class="favicon-image">
                    </div>
                </div>
                
                <div class="confirmation-message">
                    <h3>please reload the website to block it.</h3>
                </div>
                
                <button class="reload_button">RELOAD PAGE</button>
            </div>
        `;
        
        document.body.appendChild(confirmationScreen);
        
        // Add event listeners using JavaScript instead of inline handlers
        const faviconImg = confirmationScreen.querySelector('.favicon-image');
        if (faviconImg) {
            faviconImg.addEventListener('error', function() {
                this.src = './icons/default-site-icon.svg';
            });
        }
        
        // Add event listener to reload button
        const reloadBtn = confirmationScreen.querySelector('.reload_button');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', function() {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs && tabs[0]) {
                        chrome.tabs.reload(tabs[0].id);
                        window.close();
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error showing confirmation screen:', error);
    }
}

// Event listener for delete functionality
document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation for dynamically created elements
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains('delete-icon')) {
            try {
                const listItem = event.target.closest('li');
                if (!listItem) return;
                
                const hostname = listItem.querySelector('span')?.textContent;
                if (!hostname) return;
                
                // Remove from DOM
                listItem.remove();

                // Remove from storage - compare by hostname
                const urls = await getURLs();
                const updatedURLs = urls.filter(url => extractHostname(url) !== hostname);
                await chrome.storage.local.set({ urls: updatedURLs });
            } catch (error) {
                console.error('Error deleting URL:', error);
            }
        }
    });
});

async function removeAll_elements() {
    try {
        await chrome.storage.local.set({ urls: [] });
        if (list_table) {
            list_table.innerHTML = "";
            
            // Show empty state
            const emptyLi = document.createElement('li');
            emptyLi.className = 'empty-state';
            emptyLi.textContent = 'No blocked sites yet';
            emptyLi.style.textAlign = 'center';
            emptyLi.style.color = '#999';
            emptyLi.style.padding = '10px';
            list_table.appendChild(emptyLi);
        }
    } catch (error) {
        console.error('Error clearing all elements:', error);
        alert('Could not clear the blocked sites list.');
    }
}

// Listen for storage changes to update the list in real-time (with debouncing)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.urls) {
        // Debounce the update to prevent multiple rapid calls
        if (storageUpdateTimeout) {
            clearTimeout(storageUpdateTimeout);
        }
        
        storageUpdateTimeout = setTimeout(() => {
            loadURL();
        }, 100); // Wait 100ms before updating
    }
});
