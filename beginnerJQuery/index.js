$("button").css("color", "red"); //two properties means you are setting
console.log($("h1").css("font-size")); //one property means you are getting


$("h1").addClass("big-title"); //adds class
$("h1").removeClass("big-title"); //removes class

$("h1").addClass("big-title"); //multiple classes are with space
console.log($("h1").hasClass("margin-50"));


$("h1").text("Bye");

console.log($("img").attr("src"));

$("a").attr("href", "https://www.yahoo.com/");
$("a").text("yahoo");


$("h1").click(function () {         //creates event listener
    $("h1").css("color",  "purple")
    setTimeout(() => {
        $("h1").css("color", "yellow");
        }, "1000")
});

$(document).keypress(function (e){
    $("h1").text(e.key);
})


$("h1").on("mouseover", function() {
    $("h1").css("color", "blue");
});

$("h1").before("<button>New</button>"); //add new before opening tag of selected element
$("h1").after("<button>Newer</button>"); //adds after closing selected element
//.prepend has it before the content of your selected element and after your oopen tag
//.append has it after the content of your selected eleme