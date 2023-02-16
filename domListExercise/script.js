var button = document.getElementById("enter");
var delButton = document.getElementsByClassName("del");
var input = document.getElementById("userinput");
var ul = document.querySelector("ul");

function inputLength() {
	return input.value.length;
}

function createListElement() {
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(input.value));
	li.innerHTML += "<button class='del'>x</button>";
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

button.addEventListener("click", addListAfterClick);

input.addEventListener("keypress", addListAfterKeypress);

ul.addEventListener('click', function(e){
	if (e.target.tagName == "BUTTON"){
		parent = e.target.parentElement;
		parent.remove();
	}
	else if (e.target.tagName =="LI"){
		var classes = e.target.classList;
		classes.toggle("done");
	}
});
