const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');
const clear_button = document.querySelector('.clear_button');
const reloadButton = document.querySelector('.reload_button');

// Check if we're on the confirmation screen
const isConfirmationScreen = document.querySelector('.confirmation-screen');

if (!isConfirmationScreen) {
    // Normal popup functionality
    add_button.addEventListener("click", add_elements);
    clear_button.addEventListener("click", removeAll_elements);
    loadURL();
} else {
    // Confirmation screen functionality
    reloadButton.addEventListener("click", function() {
        // Reload the current tab to activate blocking
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.reload(tabs[0].id);
            window.close(); // Close the popup
        });
    });
}

async function getCurrentTabURL() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url;
}

async function getURLs() {
    const results = await chrome.storage.local.get('urls');
    const urls = results.urls;
    return urls || [];
}

async function loadURL() {
    const urls = await getURLs();

    if (urls && Array.isArray(urls)) {
        // 👉 Only take the latest 5 URLs
        const limitedURLs = urls.slice(0, 5);

        limitedURLs.forEach(url => {
            const hostname = new URL(url).hostname;

            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '10px';

            const favicon = document.createElement('img');
            favicon.src = `https://www.google.com/s2/favicons?domain=${hostname}`;
            favicon.width = 16;
            favicon.height = 16;

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
        });
    }
}

async function add_elements() {
    const currentTabURL = await getCurrentTabURL();
    const URL_list = await getURLs();
    const currentHostname = new URL(currentTabURL).hostname;
    const storedHostnames = URL_list.map(url => new URL(url).hostname);

    if (!storedHostnames.includes(currentHostname)) {
        const updatedURLs = [currentTabURL, ...URL_list];

        // Save updated URLs
        await chrome.storage.local.set({ urls: updatedURLs });

        // Show confirmation screen
        showConfirmationScreen(currentHostname);
    }
}

function showConfirmationScreen(hostname) {
    // Hide the normal popup content
    document.querySelector('.popup').style.display = 'none';
    
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
                    <img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=64" alt="${hostname}">
                </div>
            </div>
            
            <div class="confirmation-message">
                <h3>please reload the website to block it.</h3>
            </div>
            
            <button class="reload_button">RELOAD PAGE</button>
        </div>
    `;
    
    document.body.appendChild(confirmationScreen);
    
    // Add event listener to reload button
    const reloadBtn = confirmationScreen.querySelector('.reload_button');
    reloadBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.reload(tabs[0].id);
            window.close();
        });
    });
}


list_table.addEventListener("click", async function (event) {
    if (event.target.classList.contains('delete-icon')) {
        const listItem = event.target.closest('li');
        const hostname = listItem.querySelector('span').textContent;
        listItem.remove();

        // Remove from storage
        const urls = await getURLs();
        const updatedURLs = urls.filter(url => new URL(url).hostname !== hostname);
        await chrome.storage.local.set({ urls: updatedURLs });
    }
});

async function removeAll_elements() {
    await chrome.storage.local.set({ urls: [] });
    if (list_table) {
        list_table.innerHTML = "";
    }
}
