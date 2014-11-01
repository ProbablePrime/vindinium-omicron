var vindinium = require('vindinium-client');

var State = require('./State');
var Director = require('./Director');

var parsedState = new State();
var director = new Director('default');

var config = require('./config.json');

var handeler = function(state,cb) {
	"use strict";
	director.update(parsedState.update(state));
	var action = director.tick();
	if(action !== undefined && action !== null) {
		cb(null,action);
	} else {
		//Suicide but meh
		cb(null,'stay');
	}
};

vindinium({
    key: config.key,
    bot: handeler,
    mode: config.mode,  // or 'training'
}, function(err, lastState) {
    /* ... */
});

