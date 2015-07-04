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
			var hero = this.state.getHero()
			if ( (hero.getHealth() - this.state.getMineDamage())/hero.getHeroMaxHealth() <=0.3 ) {
				return false;
			}
			return true;
		};

		this.canSurviveJourney = function(distance) {
			if(distance === undefined) {
				return true;
			}
			var cost = this.state.getTotalThirst(distance);
			var hero = this.state.getHero();
			if ((hero.getHealth() - cost) > this.getHealthyPercentage()) {
				return true;
			}
		};

		this.getHealthyPercentage = function() {
			return 0.6;
		};

		this.isTargetWorthIt = function(target) {
			var hero = this.state.getHero();
			if (target.getID() === hero.getID() ) {
					return false;
			}
			if (target.isCrashed()) {
				return true;
			}
			//If they are on their spawn point then they are basically a tank. If we kill them the'll just respawn and whack us again.
			if (this.state.comparePositions(target.getPos(),target.getSpawnPos())) {
				return false;
			}
			if(target.getHealthPercentage() > hero.getHealthPercentage()) {
				return false;
			}

			var tavernCheck = this.state.getNeighboursForPoint(target.getPos()),
				currentNeighbour = null;
			for(currentNeighbour in tavernCheck) {
				if(tavernCheck.hasOwnProperty(currentNeighbour)) {
					currentNeighbour = tavernCheck[currentNeighbour];
					console.log('neighbour is');
					console.log(currentNeighbour);
					if(currentNeighbour.type === "tavern") {
						return false;
					}
				}
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
			console.log('Going for a drink');
			//alright let's drink
			closestTavern = this.state.findClosest(this.state.getHero().getPos(),this.state.findTaverns());
			if(typeof closestTavern === "object") {
				direction = finder.firstDirectionTo(this.state.getHero().getPos(),closestTavern);
				if(direction !== undefined) {
					this.setAction(direction);	
					return true;
				}
				console.log('We couldnt route to the tavern');
			}
			console.log('We couldnt find a tavern');
			return false;
		},
		/**
		 * Are we near a tavern? or do we need a drink from it?
		 * @return {boolean} 
		 */
		shouldDrink: function() {
			var hero = this.state.getHero();
			if(hero.getGold() < this.state.getTavernCost()) {
				console.log('We cannot afford a tavern');
				return false;
			}
			var closestTavern = this.state.findClosest(hero.getPos(),this.state.findTaverns());
			if(closestTavern !== undefined) {
				if (!this.canSurviveJourney(closestTavern.distance)) {
					console.log('This is going to be tricky');
				}
				if ( (this.state.getTavernHealAmount()+hero.getHealthPercentage())/hero.getMaxHealth() <= 1.1 ) {
					console.log('we could do with a heal');
					return true;
				}
				if ( closestTavern.distance === 1 && hero.getHealthPercentage() < 0.7 ) {
					console.log('we are close enough and not max health so lets heal');
					return true;
				}
			}

			return false;
		},

		shouldDrinkAnyway: function() {
			return true;
		},

		drinkAnyway: function() {
			return Actor.states.drink.call(this);
		},

		isHealthy:function() {
			return (this.state.getHero().getHealthPercentage() > this.getHealthyPercentage());
		},
		healthy: function() {
			return true;
		},
		isUnHealthy: function() {
			return !Actor.states.isHealthy.call(this);
		},
		unHealthy: function() {
			return true;
		},
		/**
		 * Workout if we are in a suitable position and state to fight
		 * @return {boolean} decision
		 */
		shouldFight: function() {
			var hero = this.state.getHero();
			var neighbours = this.state.getNeighboursForPoint(this.state.getHero().pos),
				neigbour = null,
				neigbourObj = null,
				predictedDamage = 0,
				worthIt = false;
			console.log('Should we fight');
			if(!Actor.states.inCombat.call(this)) {
				console.log('We are not in combat');
				return false;
			}
			for (neigbour in neighbours) {
				if(neighbours.hasOwnProperty(neigbour)) {
					neigbourObj = neighbours[neigbour];
					if(neigbourObj.type !== 'hero') {
						continue;
					}
					predictedDamage = predictedDamage + this.state.getAttackValue();
					if(this.state.getAttackValue() >= neigbourObj.hero.life) {
						console.log(neigbourObj.hero.name + ' will most likely die at our hands');
						worthIt = true;
					}
				}
			}
			if(predictedDamage >= this.state.getHeroHealth()) {
				console.log('We are going to die :(');
				return false;
			}
			if(predictedDamage >= this.state.getHeroHealth()/2) {
				console.log('Dumb fight we should run');
				return false;
			}
			console.log('Why are we fighting');
			console.log(worthIt);
			return worthIt;
		},
		fight: function() {
			this.setAction('STAY');
			return true;
		},

		shouldRun: function() {
			console.log('We are going to die :(');
			return !Actor.states.shouldFight.call(this);
		},
		run: function() {
			//TODO check for location near pub and if close, no point routing to one. Run anyway.
			if(Actor.states.drink.call(this)) {
				return true;
			}
			console.log('We couldnt route to a pub so we are going to back away slowely');
			var neighbours = this.state.getNeighbours(this.state.getHero().pos),
				neighbour = null,
				neigbourObj = null,
				invertedNeighbour = null;
			for (neighbour in neighbours) {
				if(neighbours.hasOwnProperty(neighbour)) {
					neigbourObj = neighbours[neighbour];
					if(neigbourObj.type === 'hero') {
						invertedNeighbour = neighbours[this.state.invertDirection(neighbour)];
						if(invertedNeighbour.type !== 'hero' && invertedNeighbour.passable) {
							console.log('found our next step to run away');
							this.setAction(this.state.invertDirection(neighbour));
							return true;
						}
					}
				}
			}
			console.log('we are surrounded I guess');
			this.setAction('STAY');
			return true;
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

			if (!this.canSurviveJourney(closestMine.distance)) {
				return false;
			}

			if (closestMine.owned) {
				return false;
			}

			if (!this.canSurviveMineTakeover()) {
				return false;
			}

			if (closestMine.distance <= 3) {
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
			console.log('And the direction is');
			console.log(direction);
			if(direction !== undefined) {
				this.setAction(direction);	
				return true;
			} 
			console.log('Cannot route to mine');
			return false;
		},
		seekMine: function() {
			return Actor.states.mine.call(this);
		},
		shouldSeekMine: function() {
			if(!Actor.states.isHealthy.call(this)) {
				return false;
			}
			var closestMine = this.state.findClosest(this.state.getHero().pos,this.state.findEnemyMines());
			if (closestMine === undefined) {
				console.log('We cant find a mine so we cant seek one');
				return false;
			}

			if (!this.canSurviveJourney(closestMine.distance)) {
				console.log('we cant survive a trip to this mine');
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
			if(!Actor.states.isHealthy.call(this)) {
				return false;
			}

			if(this.state.getHeroHealthPercentage() < 0.6) {
				return false;
			}
			var targets = this.state.getEnemies().filter(this.isTargetWorthIt,this);
			if(targets.length > 0) {
				return true;
			}
			console.log('no targets were worth it');
			return false;
		},
		seekCombat: function() {
			var targets = this.state.getEnemies().filter(this.isTargetWorthIt,this),
			target = null,
			direction = null;

			if(targets.length === 0) {
				console.log('no targets were worth it');
				return false;
			}

			target = target.findClosest(this.state.getHero().pos,targets);

			if(!this.canSurviveJourney(target.distance)) {
				console.log('Cant survive journey to next target');
				return false;
			}
			
			if(target === null) {
				console.log('couldnt find optimum target');
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