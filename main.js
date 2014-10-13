var State = require('./State');

var test = new State();

var testState = require('./testState');


test.updateState(testState);
console.log('Taverns:');
console.log(test.findTaverns());
console.log('Mines:');
console.log(test.findMines());
console.log(test.findOwnedMines());