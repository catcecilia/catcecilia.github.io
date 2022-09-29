let gamePattern = [];
let userClickedPattern = [];
let buttonColors = ["red", "blue", "green", "yellow"];
let level = 0;
let started = false;

$(".btn").click(function(e){
    let userChosenColor=e.target.id;
    userClickedPattern.push(userChosenColor);
    console.log(userClickedPattern);
    playSound(userChosenColor);
    animatePress(userChosenColor);

    checkAnswer(userClickedPattern.length-1);  //position in the array

function checkAnswer(currentLevel){
    if (userClickedPattern[currentLevel] === gamePattern[currentLevel]){ //if both are correct in the position in the array

        if(gamePattern.length === userClickedPattern.length){ //check to see if this is the last one. if so, new level is started
            setTimeout(nextSequence, 1000);
            userClickedPattern=[];
        }
    } else{
        let gameOverAudio = new Audio("sounds/wrong.mp3");
        gameOverAudio.play();
        $("body").addClass("game-over");

        setTimeout(function(){           //alerts user to wrong choice
            $("body").removeClass("game-over");
        }, 200);

        $("h1").text("Game Over, Press Any Key to Start"); //resets game by resetting level, gamePattern, userClickedPattern, started values
        startOver();
    }
}

$(document).keydown(function (){
    if (!started) {
        $("#level-title").text("Level " + level);
        nextSequence();
        started = true;
    }

});
function nextSequence(){
    level++;
    $("#level-title").text("Level " + level);
    let randomNumber = Math.floor(Math.random()*4);
    let randomChosenColor = buttonColors[randomNumber];
    gamePattern.push(randomChosenColor);
    $("#"+randomChosenColor).fadeOut(100).fadeIn(100);
    playSound(randomChosenColor);
}
function startOver(){
    level = 0;
    gamePattern = [];
    started = false;
    userClickedPattern=[];
}
function playSound(chosenColor){
    var audio = new Audio('sounds/'+chosenColor+'.mp3');
    audio.play();
}
function animatePress(currentColor){
    $("#"+currentColor).addClass("pressed");
    setTimeout(function() {
        $("#"+currentColor).removeClass("pressed");
    }, 100)
};
