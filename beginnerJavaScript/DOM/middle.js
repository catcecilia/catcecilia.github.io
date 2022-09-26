var form = document.getElementById('addForm');
var itemList = document.getElementById('items');
var filter = document.getElementById('filter');

//form submit event
form.addEventListener('submit', addItem);
//delete item
itemList.addEventListener('click', removeItem);
//filter event
filter.addEventListener('keyup', filterItems);

//adds item
function addItem(e){
    e.preventDefault();

    //get input value
    var newItem = document.getElementById("item").value;

    //create new li element
    var newLi = document.createElement("li");

    //add text from input
    newLi.appendChild(document.createTextNode(newItem));

    //add class
    newLi.className = "list-group-item";

    //create delete button element
    var deleteButton = document.createElement('button');
    deleteButton.className= 'btn btn-danger btn-sm float-right delete';

    //append text node
    deleteButton.appendChild(document.createTextNode('X'));
    newLi.appendChild(deleteButton);
    itemList.appendChild(newLi);
}

//deletes item
function removeItem(e){
    if(e.target.classList.contains('delete')) {
        console.log(1);
    } if(confirm ('Are you sure?')) {
        var li = e.target.parentElement;
        itemList.removeChild(li);
    }
}

function filterItems(e){
    var filterText = e.target.value.toLowerCase();

    //get list
    var items = itemList.getElementsByTagName('li');

   Array.from(items).forEach(function(item){
        var itemName = item.firstChild.textContent;
       if(itemName.toLowerCase().indexOf(filterText) != -1) {
           item.style.display = "block";
       } else {
           item.style.display = "none";
       }
   });
}