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

async function loadURL(){
    const urls=await getURLs();
    if (urls && Array.isArray(urls)){
        urls.forEach(url => {
            const hostname = new URL(url).hostname;
            const li = document.createElement('li');
            li.textContent = hostname ;
            list_table.appendChild(li);
        });
    }
}

async function add_elements() {
    const currentTabURL = await getCurrentTabURL();
    const URL_list = await getURLs(); 
    const currentHostname = new URL(currentTabURL).hostname;
    const storedHostnames = URL_list.map(url => new URL(url).hostname);

    //display the list of hostnames
    if (!storedHostnames.includes(currentHostname)) {
        const li = document.createElement('li');
        li.textContent = currentHostname;
        list_table.appendChild(li);

        //saves the urls
        URL_list.unshift(currentTabURL);
        await chrome.storage.local.set({ urls: URL_list });
    }
}


async function removeAll_elements(){
    await chrome.storage.local.set({ urls: [] });
    if(list_table){
        list_table.innerHTML="";
    }
}
