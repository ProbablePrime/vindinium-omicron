(function (module,exports) {
	"use strict";
	var Machine = require('./machinejs'),
		Actor = require('./Actor.js'),
		behavioursTree = {},
	Director = function(brain) {
		var machine = new Machine();			
		this.actor = new Actor();
		//node allows us to just load in json files which is awesome
		behavioursTree = require('./brains/' + brain + '.json');
		this.buildBehaviours(behavioursTree);
		
		/**
		 * Updates the local reference state to the new turn and passes this to the Actor
		 * @param  {State} state Current turn's state
		 */
		this.update = function(state) {
			this.state = state;
			this.actor.setState(state);
		};

		

		this.tick = function() {
			this.actor.brain.tick();
			console.log(this.actor.state.identifier);
			return this.actor.getAction();
		};

		this.buildBehaviours = function(jsonBehaviours) {
			this.actor.brain = machine.generateTree(jsonTree,this.actor,Actor.states);
		};
	};
	exports = module.exports = Director;	
}(module,module.exports)); 