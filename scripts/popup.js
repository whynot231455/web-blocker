const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');

add_button.addEventListener("click",add_elements);

function add_elements(){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        list_table.textContent=currentUrl;
    });
};
