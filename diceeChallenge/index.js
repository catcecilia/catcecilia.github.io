
//player 1 dice
let randOmNumber1 = Math.floor((Math.random()*6)+1);
let player1 = document.querySelector('.img1');
player1.setAttribute("src", "images/dice"+ randOmNumber1+".png");
console.log(player1);

//player 2 dice
let randOmNumber2 = Math.floor((Math.random()*6)+1);
let player2 = document.querySelector('.img2');
player2.setAttribute("src", "images/dice"+ randOmNumber2+".png");
console.log(player2);

//changing H1

let headerResult = document.querySelector("h1");

if (randOmNumber1 > randOmNumber2) {
    headerResult.innerHTML = "🚩 Player 1 Wins";
} else if (randOmNumber2 > randOmNumber1) {
    headerResult.innerHTML = "Player 2 Wins 🚩";
} else {
    headerResult.innerHTML = "Draw"
}
