//adding element to page

// let body = document.body;
// body.append("Hello world"); // appends strings
//
// let div = document.createElement("div");
// div.innerText = "Hello world too"; //adds text, if console.log only shows whats visible on page
// div.textContent = "Hello world three"; //context is same but, if console.log shows all
// body.appendChild(div);//appendChild can append element one at a time


//let div = document.querySelector("div");
//console.log(div.textContent);
//console.log(div.innerText);

//if you want to use elements, have to use inner HTML
// let body = document.body;
// let div = document.createElement("div");
// div.innerHTML = "<strong> Hello World</strong>";
// body.append(div);

//or it can be appended
// let body = document.body;
// let strong = document.createElement("strong");
// let div = document.createElement("div");
// strong.innerText = "Hello there";
// div.append(strong);
// body.append(div);


//REMOVAL of elements
// let body = document.body;
// let div = document.querySelector("div");
// let spanHi = document.querySelector("#hi");
// let spanBye = document.querySelector("#bye");
//
// spanBye.remove();//removes it from html
// div.append(spanBye); //can be added back
//
// div.removeChild(spanBye); //removes child
// div.append(spanBye);

//MODIFYING
// let body = document.body;
// let div = document.querySelector("div");
// let spanHi = document.querySelector("#hi");
// let spanBye = document.querySelector("#bye");
//
// console.log(spanHi.getAttribute("title")); //gets information from element
// console.log(spanHi.id); //can use just .attribute sometimes
// spanHi.setAttribute("id", "asdasd"); //changes id
// console.log(spanHi.id);
// spanBye.id = "abcabc";
// console.log(spanBye.id);
//
// //removing attribute
// spanHi.removeAttribute("id");
//
// //modifying data attributes
// console.log(spanHi.dataset);
// console.log(spanBye.dataset); //does camel case
//
// //adding data
// spanHi.dataset.newName = "howdy";
// console.log(spanHi.dataset);

//Class list
let body = document.body;
let div = document.querySelector("div");
let spanHi = document.querySelector("#hi");
let spanBye = document.querySelector("#bye");

spanHi.classList.add("new-class"); //adds class
spanHi.classList.remove("hi1"); //removes
spanHi.classList.toggle("hi3"); //adds if not there, removes if there
spanHi.classList.toggle("hi4", true); //automatically removes it if false. automatically adds if true


//style property direct manipulation
spanHi.style.color = "red";
spanHi.style.backgroundColor = "grey"; //have to camel case if the CSS property is hyphenated


//prevent javascript injection: use queries for innerText instead of innerHTML. or userinput is rendered as a string before using innerHTML 