const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');

add_button.addEventListener("click",add_elements);

async function getCurrentTabURL(){
    const [tab] = await chrome.tabs.query({active: true , currentWindow: true});
    return tab.url;
}

async function loadURL(){
    const results = await chrome.storage.local.get('urls');
    const urls = results.urls;
    if (urls && Array.isArray(urls)){
        urls.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            list_table.appendChild(li);
        });
    }
}

async function add_elements(){
    const currentTabURL= await getCurrentTabURL();
    
    //display URLS 
    const li = document.createElement('li');
    li.textContent=currentTabURL;
    list_table.appendChild(li);

    //saving URLS
    chrome.storage.local.get('urls', (result) => {
        const urls = result.urls || [];
        urls.unshift(currentTabURL);
        chrome.storage.local.set({ urls });
    });
}
 
loadURL();