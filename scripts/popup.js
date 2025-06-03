const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');
const clear_button = document.querySelector('.clear_button');

add_button.addEventListener("click",add_elements);
clear_button.addEventListener("click",removeAll_elements);
loadURL();
getURLs();

async function getCurrentTabURL(){
    const [tab] = await chrome.tabs.query({active: true , currentWindow: true});
    return tab.url;
}

async function getURLs(){
    const results=await chrome.storage.local.get('urls');
    const urls=results.urls;
    return urls;
}

async function loadURL(){
    const urls=await getURLs();
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

async function removeAll_elements(){
    await chrome.storage.local.set({ urls: [] });
    const list_table=document.querySelector(".list_table");
    if(list_table){
        list_table.innerHTML="";
    }
}
