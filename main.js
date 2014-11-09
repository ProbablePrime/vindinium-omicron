var vindinium = require('vindinium-client');

var State = require('./State');
var Director = require('./Director');

var exec = require('child_process').exec;

var config = require('./config.json');


var director = new Director(config.brain || 'default');

var parsedState = new State(config);

var currentID = null;

var openTab = function(state) {
	"use strict";
	exec("START Chrome "+state.viewUrl+ " –newtab", 
		function(err, stdout, stderr) {

		}
	);
};

var convertDirection = function(direction) {
	"use strict";
	switch(direction) {
		case 'RIGHT':
			return 'e';
		case 'LEFT':
			return 'w';
		case 'UP':
			return 'n';
		case 'DOWN':
			return 's';
		default: 
			return direction;
	}
}; 

var handeler = function(state,cb) {
	"use strict";
	if(currentID === null || currentID !== state.game.id) {
		openTab(state);
		currentID = state.game.id;
	}
	parsedState.update(state);
	director.update(parsedState);
	var action = director.tick();
	if(action !== undefined && action !== null) {
		console.log('sending action to server ' + action);
		cb(null,convertDirection(action));
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
    if (err !== null) {
    	throw err;
    }
});

