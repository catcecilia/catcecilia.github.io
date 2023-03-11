//returns a number between 2 and 11 inclusive
let firstCard, secondCard, newCards;
let sum = 0;
let message = "";
let messageEl = document.getElementById("prompt");
let hand = document.getElementById("hand");
let sumNotice = document.getElementById("sum");
let newCardButton = document.getElementById("new-card");
console.log(messageEl);

function getRandomCard(){
    return Math.floor(Math.random()*(11-2+1)+2);
}

function startGame(){
    firstCard =  getRandomCard();
    secondCard =  getRandomCard();
    sum = firstCard + secondCard;
    hand.textContent = `Cards: ${firstCard} ${secondCard}`;
    sumNotice.textContent = `Sum: ${sum}`;
    newCardButton.style.display = "inline";

    winCheck();
}


function newCard(){
    if (sum > 21){
        startGame();
    }
    else {
        newCards = getRandomCard();
        sum += newCards;
        hand.textContent += ` ${newCards}`;
        sumNotice.textContent = `Sum: ${sum}`;
        winCheck();
    }
    
}

function winCheck(){
    if (sum <= 20) {
        message = "Do you want to draw a new card?";
    } else if (sum == 21) {
        message = "You've got Black Jack";
        sum = 22; //let sum equal higher than 21 to restart game
    } else {
        message = "You're out of the game!";
    }
    messageEl.textContent = message;
}





//cash out

