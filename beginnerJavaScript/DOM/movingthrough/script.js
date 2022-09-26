//let grandparent = document.getElementById("grandparent"); //moving by ID
//let parents = document.getElementsByClassName("parent"); //gets collection

//parents=  Array.from(document.getElementsByClassName("parent")); //changes to array so you can use for each

//parents.forEach(changeColor);


function changeColor(element) {
    element.style.backgroundColor = "#333";
}

//queryselector & queryselectorall

// let grandparent = document.querySelector("#grandparent"); //gets first found
// changeColor(grandparent);
//
// let parents = document.querySelectorAll(".parent"); //gets ALL parents
// parents.forEach(changeColor);

//getting the children
// let grandparent = document.getElementById("grandparent");
// let parents = Array.from(grandparent.children);
// let parentOne = parents[0];
// // let childrenOfOne = parentOne.children;
//
//
// //going straight to the child
// let childOneofOne = grandparent.querySelector(".child");
//
// changeColor(childOneofOne);


//going from child up to grandparent

let child1 = document.getElementById("child1");
let parent = child1.parentElement;
let grandparent = parent.parentElement;

//how to skip parent and go straight to grandparent
grandparent = child1.closest(".grandparent");
// changeColor(child1);


//how to get sibling of child1
let child2 = child1.nextElementSibling;

changeColor(child2.previousElementSibling);
