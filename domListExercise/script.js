var button = document.getElementById("enter");
var input = document.getElementById("userinput");
var ul = document.querySelector("ul");
var items = ul.getElementsByTagName("li");

function inputLength() {
	return input.value.length;
}

function createListElement() {
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(input.value));
	li.innerHTML += "<button>x</button>";
	ul.appendChild(li);
	input.value = "";
}

function addListAfterClick() {
	if (inputLength() > 0) {
		createListElement();
	}
}

function addListAfterKeypress(event) {
	if (inputLength() > 0 && event.keyCode === 13) {
		createListElement();
	}
}

//For every li in ul, create a button with text "x" and append it to li[i]
for (var i = 0; i < items.length; i++){
	var button = document.createElement('button');
	button.appendChild(document.createTextNode("x"));
	items[i].appendChild(button);
}


button.addEventListener("click", addListAfterClick);

input.addEventListener("keypress", addListAfterKeypress);

ul.addEventListener('click', function(e){
	//when clicking at this event in the element ul, check to see if it is a button, if so, delete the parent child of button (li) thereby removing it
	if (e.target.tagName == "BUTTON"){
		parent = e.target.parentElement;
		parent.remove();
	}
	//if it is li, toggle class name "done" instead
	else if (e.target.tagName =="LI"){
		var classes = e.target.classList;
		classes.toggle("done");
	}
	//all else, do nothing
});
