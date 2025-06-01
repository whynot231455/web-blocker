const add_button = document.querySelector('.add_button');
const list_table = document.querySelector('.list_table');

add_button.addEventListener("click",add_elements);

function add_elements(){
    list_table.innerHTML="TEST";
};