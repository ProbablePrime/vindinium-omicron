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

		this.setState = function(state) {
			this.update(state);
		};

		this.canSurviveMineTakeover = function() {
			if ( (this.state.getHeroHealth() - this.state.getMineDamage())/this.state.getHeroMaxHealth() <=0.3 ) {
				return false;
			}
			return true;
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
			closestTavern = this.state.findClosest(this.state.getHero().pos,this.state.findTaverns());
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
		 * Are we near a tavern? or do we need a drink from it?
		 * @return {boolean} 
		 */
		shouldDrink: function() {

			if(this.state.getHero().gold < this.state.getTavernCost()) {
				console.log('We cannot afford a tavern');
				return false;
			}
			var closestTavern = this.state.findClosest(this.state.getHero().pos,this.state.findTaverns());
			if(closestTavern !== undefined) {
				if ( (this.state.getTavernHealAmount()+this.state.getHeroHealth())/this.state.getHeroMaxHealth() <= 1.1 ) {
					console.log('we could do with a heal');
					return true;
				}
				if ( closestTavern.distance === 1 && this.state.getHeroHealthPercentage() < 1.0 ) {
					console.log('we are close enough and not max health so lets heal');
					return true;
				}
			}

			return false;
		},

		isHealthy:function() {
			return (this.state.getHeroHealthPercentage() > 0.6);
		},
		healthy: function() {
			return true;
		},
		isUnHealthy: function() {
			return !Actor.states.isHealthy.call(this);
		},
		unHealthy: function() {

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
					if(predictedDamage >= this.state.getHeroHealth()) {
						console.log('We are going to die :(');
						return false;
					}
					if(predictedDamage >= this.state.getHeroHealth()/2) {
						console.log('Dumb fight we should run');
						return false;
					}
					if(this.state.getAttackValue() >= neigbourObj.hero.life) {
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
			return !Actor.states.shouldFight.call(this);
		},
		run: function() {
			return Actor.states.drink.call(this);
		},
		inCombat: function() {
			var neighbours = this.state.getNeighboursForPoint(this.state.getHero().pos),
				neigbour = null,
				neigbourObj = null;
			for (neigbour in neighbours) {
				if(neighbours.hasOwnProperty(neigbour)) {
					neigbourObj = neighbours[neigbour];
					if(neigbourObj !== null) {
						if(neigbourObj.type === 'hero') {
							return true;
						}	
					}
				}
			}
			return false;
		},
		combat: function() {
			return true;
		},
		shouldMine: function() {
			var closestMine = this.state.findClosest(this.state.getHero().pos,this.state.findEnemyMines());

			if (closestMine === undefined) {
				return false;
			}

			if(closestMine.owned) {
				return false;
			}

			if (!this.canSurviveMineTakeover()) {
				return false;
			}

			if(closestMine.distance <= 3) {
				return true;
			}


				
			return false;
		},
		mine:function() {
			var closestMine = this.state.findClosest(this.state.getHero().pos,this.state.findEnemyMines()),
				direction;
			console.log('Im going after a mine');
			console.log('I am at ');
			console.log(this.state.getHero().pos);
			console.log('the mine is at ');
			console.log(closestMine);
			direction = finder.firstDirectionTo(this.state.getHero().pos,closestMine);

			if(direction !== undefined) {
				this.setAction(direction);	
				return true;
			}
		},
		seekMine: function() {
			return Actor.states.mine.call(this);
		},
		shouldSeekMine: function() {
			var closestMine = this.state.findClosest(this.state.getHero().pos,this.state.findEnemyMines());
			if (closestMine === undefined) {
				console.log('We cant find a mine so we cant seek one');
				return false;

			}
			if (closestMine.enemy) {
				if (!this.canSurviveMineTakeover()) {
					console.log('we cant survive the takeover of the mine');
					return false;
				}
			}
			if(this.state.getMinePercentage() < 0.6) {
				return true;
			}

			return false;

		},
		shouldSeekCombat: function() {
			if(this.getHeroHealthPercentage() < 0.6) {
				return false;
			}
			return true;
		},
		seekCombat: function() {
			var isWorthIt = function(hero) {
				if(hero.id === this.getHero().id ) {
					return false;
				}
				if(hero.crashed) {
					return true;
				}
				if(this.state.comparePositions(hero.pos,hero.spawnPos)) {
					return false;
				}
				if(this.state.getHeroHealthPercentage(hero.id) > this.state.getHeroHealthPercentage()) {
					return false;
				}

				var tavernCheck = this.state.getNeighboursForPoint(hero.pos).some(function(point){
					return point.type === 'tavern';
				},this);

				if (tavernCheck) {
					return false;
				}
			},
			targets = this.state.getHeroes().filter(isWorthIt,this),
			distance = 999,
			target = null,
			direction = null;

			if(targets.length === 0) {
				return false;
			}

			target.forEach( 
				function(searchTarget){
					if(this.state.getDistanceBetween(target.pos,this.getHero().pos) < distance) {
						target = searchTarget;
					}
				},
				this
			);
			
			if(target === null) {
				return false;
			}

			direction = finder.firstDirectionTo(this.state.getHero().pos,target);
			if(direction === undefined) {
				return false;
			}

			this.setAction(direction);	
			return true;
		}
		
	};
	exports = module.exports = Actor;
}(module,exports)); 