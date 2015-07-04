(function(exports,module) {
	"use strict";
	var _ = require('lodash'),
	Hero = function(hero) {
		//Merge in our hero object
		_.assign(this,hero);

		//TODO: grab these from a config file
		this.maxHealth = 100;
		this.healthPerTurn = 1;
		this.attackValue = 20;

		var hero = this;
		this.getHealthPercentage = function(id) {
			return this.life / this.getMaxHealth();	
		};

		this.getHeroHealth = function(id) {
			return this.life;
		};

		this.getHeroMaxHealth = function() {
			return this.maxHealth;
		};

		this.getX = function() {
			return this.pos.x;
		};

		this.getY = function() {
			return this.pos.y;
		};

		this.getPos = function() {
			return this.pos;
		}

		this.getID = function() {
			return this.id;
		};

	};
	exports = module.exports = Hero;
}(exports,module));