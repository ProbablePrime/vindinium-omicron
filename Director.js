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
		
		
		/**
		 * Updates the local reference state to the new turn and passes this to the Actor
		 * @param  {State} state Current turn's state
		 */
		this.update = function(state) {
			this.state = state;
			this.actor.setState(state);
		};

		this.tick = function() {
			while(!this.actor.hasAction()) {
				this.brain = this.brain.tick();
			}
			return this.actor.getAction(true);
		};

		this.buildBehaviours = function(jsonBehaviours) {
			this.brain = machine.generateTree(jsonBehaviours,this.actor,Actor.states);
		};

		this.buildBehaviours(behavioursTree);
		return this;
	};
	exports = module.exports = Director;	
}(module,module.exports)); 