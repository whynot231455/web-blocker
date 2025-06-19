const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');
const clear_button = document.querySelector('.clear_button');

add_button.addEventListener("click",add_elements);
clear_button.addEventListener("click",removeAll_elements);
loadURL();

async function getCurrentTabURL(){
    const [tab] = await chrome.tabs.query({active: true , currentWindow: true});
    return tab.url;
}

async function getURLs(){
    const results=await chrome.storage.local.get('urls');
    const urls=results.urls;
    return urls || [];
}

async function loadURL() {
    const urls = await getURLs();
    if (urls && Array.isArray(urls)) {
        urls.forEach(url => {
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
            close_icon.src="./icons/delete-icon.svg";
            close_icon.className='delete-icon';
            close_icon.width=16;
            close_icon.height=16;
            close_icon.style.cursor='pointer';

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
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '10px';

        // Create favicon <img>
        const favicon = document.createElement('img');
        favicon.src = `https://www.google.com/s2/favicons?domain=${currentHostname}`;
        favicon.width = 16;
        favicon.height = 16;

        // Add hostname text
        const span = document.createElement('span');
        span.textContent = currentHostname;

        const close_icon = document.createElement('img');
        close_icon.src="./icons/delete-icon.svg"
        close_icon.className='delete-icon';
        close_icon.width=16;
        close_icon.height=16;
        close_icon.style.cursor='pointer';

        li.appendChild(favicon);
        li.appendChild(span);
        li.appendChild(close_icon);

        list_table.appendChild(li);
    }

    // Save the URL
    chrome.storage.local.get('urls', (result) => {
        const urls = result.urls || [];
        const hostNames =urls.map(url => new URL(url).hostname);
        if (!hostNames.includes(currentHostname)) {
            urls.unshift(currentTabURL);
        }
        chrome.storage.local.set({ urls });
    });
}

list_table.addEventListener("click",async function(event) {
    if (event.target.classList.contains('delete-icon')) {
        const listItem = event.target.closest('li');
        const hostname = listItem.querySelector('span').textContent;
        listItem.remove();

        // Remove from storage
        const urls = await getURLs();
        const updatedURLs = urls.filter(url => new URL(url).hostname !== hostname);
        await chrome.storage.local.set({ urls: updatedURLs });
    }
})

async function removeAll_elements(){
    await chrome.storage.local.set({ urls: [] });
    if(list_table){
        list_table.innerHTML="";
    }
}


