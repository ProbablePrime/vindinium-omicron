(function (module,exports) {
	"use strict";
	var Finder = require('./PathFinder'),
		finder = new Finder(),
	Actor = function() {
		this.action = 'STAY';
		this.findResults = {};
		this.update = function(state) {
			this.state = state;
			finder.update(state);
		};

		this.setAction = function(action) {
			if(!this.queued) {
				this.action = action;
			} else {
				throw new Error("Trying to take two turns at once");
			}
		};

		this.getAction = function(clear) {
			if(clear && clear !== undefined) {
				this.queued = false;
				var ret = this.action;
				this.action = null;
				return ret;
			}
			return this.action;
		};

		this.hasAction = function() {
			return this.action !== null;
		};

		return this;
	};

	Actor.states = {
		/** 
		 * Workout the direction to the tavern
		 * @return {String} [description]
		 */
		drink: function() {
			var closestTavern,
				direction;
			//alright let's drink
			closestTavern = this.state.findClosest(this.state.getHero().pos,this.state.test.findTaverns());
			if(typeof closestTavern === "object") {
				direction = finder.firstDirectionTo(this.state.getHero().pos,closestTavern);
				if(direction !== undefined) {
					this.setAction(direction);	
					return true;
				}
			}
			return false;
		},
		/**
		 * Are we near a tavern? and should be drink from it?
		 * @return {boolean} 
		 */
		shouldDrink: function() {
			if(this.state.getHero().gold < this.state.getTavernCost()) {
				console.log('We cannot afford a tavern');
				return false;
			}
			var closestTavern = this.state.findClosest(this.state.getHero().pos,this.state.test.findTaverns());
			if(closestTavern !== undefined && closestTavern.distance === 1) {
				console.log('we are next to a tavern');
				if(this.state.getHero().health <= 30) {
					return true;
				}
			}

			return false;
		},
		/**
		 * Workout if we are in a suitable position and state to fight
		 * @return {boolean} decision
		 */
		shouldFight: function() {
			var neighbours = this.state.getNeighboursForPoint(this.state.getHero().pos),
				neigbour = null,
				neigbourObj = null,
				predictedDamage = 0,
				worthIt = false;
			for (neigbour in neighbours) {
				if(neighbours.hasOwnProperty(neigbour)) {
					neigbourObj = neighbours[neigbour];
					if(neigbourObj.type === 'hero') {
						predictedDamage = predictedDamage + this.state.getAttackValue();
					}
					if(predictedDamage >= this.state.getHero().health) {
						console.log('We are going to die :(');
						return false;
					}
					if(predictedDamage >= this.state.getHero().health/2) {
						console.log('Dumb fight we should run');
						return false;
					}
					if(this.state.getAttackValue() >= neigbourObj.hero.health) {
						console.log(neigbourObj.hero.name + ' will most likely die at our hands');
						worthIt = true;
					}
				}
			}
			return worthIt;
		},
		fight: function() {
			this.setAction('STAY');
			return true;
		},

		shouldRun: function() {
			return !shouldFight();
		},
		run: function() {
			
		}

		inCombat: function() {
			var neighbours = this.state.getNeighboursForPoint(this.state.getHero().pos),
				neigbour = null,
				neigbourObj = null;
			for (neigbour in neighbours) {
				if(neighbours.hasOwnProperty(neigbour)) {
					neigbourObj = neighbours[neigbour];
					if(neigbourObj.type === 'hero') {
						return true;
					}
				}
			}
			return false;
		},
		combat: function() {
			return true;
		},
		canLoot: function() {

		},
		goAfterLoot: function() {

		},
		shouldGoAfterLoot: function() {

		},
		
	};
	exports = module.exports = Actor;
}(module,exports)); 