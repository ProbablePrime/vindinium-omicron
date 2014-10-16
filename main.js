var State = require('./State');

var test = new State();

var testState = require('./testState');
var Finder = require('./PathFinder');

var finder = new Finder();

test.updateState(testState);
finder.update(test);
// console.log('Taverns:');
// console.log(test.findTaverns());
// console.log('Mines:');
// console.log(test.findMines());
// console.log('Mines I Own:');
// console.log(test.findOwnedMines());
// console.log('Walls');
// console.log(test.findImpassable());
console.log('Im thirsty lets find a path to a tavern');
var tavern = test.findTaverns()[0];
console.log('I am at: ');
console.log(test.getHero().pos);
console.log('The tavern is at: ');
console.log(tavern);
console.log('I think out next step is ');
console.log(finder.firstDirectionTo(test.getHero().pos,tavern));


