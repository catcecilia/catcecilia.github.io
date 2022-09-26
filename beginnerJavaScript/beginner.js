for (let i = 1; i< 101; i++) {
    if((i%3 ==0) && (i%5 == 0)) {
        console.log("fizzbuzz");
    } else if (i%3 ==0) {
        console.log("fizz");
    } else if (i%5 ==0) {
        console.log("buzz");
    } else{
        console.log(i);
    }
}


function pushPop(number){
    let output =[];
    for(let j = 1; j<=number; j++) {
        if ((j % 3 == 0) && (j % 5 == 0)) {
            output.push("fizzbuzz");
        } else if (j % 3 == 0) {
            output.push("fizz");
        } else if (j % 5 == 0) {
            output.push("buzz");
        } else {
            output.push(j);
        }
    }
    console.log(output);
}

pushPop(30);

let n = 99;
while (n > 1) {
    console.log(n + " bottles of beer on the wall, " + n + " bottles of beer.\nTake one down and pass it around, " + (n-1) + " bottles of beer on the wall");
    n--;
}  if (n == 1) {
    console.log(n + " bottle of beer on the wall, " + n + " bottle of beer.\nTake one down and pass it around, no more bottles of beer on the wall. \nNo more bottles of beer on the wall, no more bottles of beer.\nGo to the store and buy some more, 99 bottles of beer on the wall.");
}


function fibonacciGenerator (n) {

    var output = [];
    var fNum = -1;
    var sNum = 1;
    var sum = 0;

    for(var i=0; i<n; i++){
        sum = fNum + sNum;
        output.push(sum);
        fNum = sNum;
        sNum = sum;
    }

    return output;

}

console.log(fibonacciGenerator(10));