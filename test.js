require('es6-shim');

var State = require('./State');
var Director = require('./Director');

var test = new State();
var director = new Director('default');

var testState = require('./testState');
var Finder = require('./PathFinder');

var finder = new Finder();

test.updateState(testState);
finder.update(test);

// console.log(test.getSplitBoard());
// console.log(finder.grid.formatGrid());

//console.log(test.findImpassable());

// console.log(test.getHero().id);

console.log(test.getHeroByPos(test.getHero().pos));

//console.log(test.findClosest(test.getHero().pos,test.findEnemyMines()));

// console.log(test.getPair(test.posToIndex({x:5,y:6})));
// // 
// //console.log('Im thirsty lets find a path to a tavern');
// var tavern = test.findClosest(test.getHero().pos,test.findTaverns());
// //console.log('I am at: ');
// console.log(test.getHero().pos);
// //console.log('The tavern is at: ');
// console.log(tavern);
// //console.log('I think out next step is ');

// console.log(finder.directionTo(test.getHero().pos,tavern));




