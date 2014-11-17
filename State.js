(function(exports,module) {
	"use strict";
	var _ = require('lodash'),
		heuristics = require('./Heuristics.js'),
		State  = function(config) {
		this.config = config;
		var mapLegend = {
			spawnPoint: {
				key: new RegExp('X[1-4]{1}',"g"),
				dataKey: new RegExp('[1-4]{1}'),
				pass:true,
				interact:false,
				value:-1,
				pathingCost:9
			},
			space: {
				key:new RegExp('  ',"g"),
				pass:true,
				interact:false,
				value:1,
				pathingCost:0
			},
			barrier: {
				key: new RegExp('##',"g"),
				pass:false,
				interact:false,
				value:0,
				pathingCost:1
			},
			hero: {
				key: new RegExp("@[1-4]{1}","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("[1-4]{1}"),
				value:2,
				pathingCost:4,
				attackValue:20,
				maxHealth:100,
				healthPerTurn: 1
			},
			tavern: {
				key: new RegExp('(\\[\\])',"g"),
				pass:false,
				interact:true,
				value:3,
				pathingCost:0,
				goldCost:2,
				healAmount:50
			},
			mine: {
				key: new RegExp("\\$(\\-|[1-4]{1})","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("-|[1-4]{1}") ,
				value:4,
				emptyData:'-',
				pathingCost:1,
				combatCost:20
			}
		},		
		charactersPerSpace = 2;

		this.state = null;
		this.previousState = null;

		this.getThirst = function() {
			return mapLegend.hero.healthPerTurn;
		};

		this.getTotalThirst = function(distance) {
			if(distance === undefined) {
				return 0;
			}
			return distance * this.getThirst();
		};

		this.getPercentageDone = function() {
			return (this.getState().game.turn/this.state.game.maxTurns) * 100;
		};

		this.getBoardWidth = function() {
			return (this.getBoard().size);
		};

		this.getBoardSplitterRegex = function() {
			return new RegExp(".{1,"+this.getBoardWidth()*2+"}",'g');
		};

		this.getBoardHeight = function() {
			return this.getBoardWidth();
		};

		this.getSplitBoard = function() {
			return this.getBoard().tiles.match(this.getBoardSplitterRegex());
		};

		this.getPair = function(index) {
			if(index % 2 === 1 || index === 1) {
				index = index -1;
			}
			return this.getBoard().tiles.substring(index,(index + (charactersPerSpace/2)) + 1);
		};

		this.getPairByPos = function(pos) {
			return this.getPair(this.posToIndex(pos));
		};

		this.getIndicesOf = function(search, source) {
    		var indices = [],
    			result = null;
    		do {
    			result = search.exec(source);
    			if(result !== null) {
					indices.push(result.index);
    			}
    		}while (result !== null);
    		return indices;
		};

		this.findIndicies = function(what,where,search) {
			var key = null,
				indices = [],
				self = this,
				result = [];
			if(typeof what === "string") {
				key = mapLegend[what].key;
			} else {
				key = what;
			}
			if(search === undefined) {
				return this.getIndicesOf(key,where);
			}

			indices = this.getIndicesOf(key,where);
			indices.forEach(function(index){
				var tileData = this.getData(this.indexToPos(index));
				if(search !== undefined) {
					//XXX Coercion, I don't care
					if(tileData == search) {
						result.push(index);
					}
				} else {
					result.push(index);
				}
			},this);
			return result;
		};

		this.find = function(what,where,search) {
			return this.findIndicies(what,where,search).map(this.indexToPos,this);
		};

		this.getBoard = function() {
			return this.state.game.board;
		};
		
		/*
			For some reason x and y are reversed in the maths we get from the server :S
		 */
		this.posToIndex = function(x,y) {
			if(typeof x === "object" && y === undefined) {
				y = x.y;
				x = x.x;
			}
			return (x * (this.getBoardWidth()*2)) + (y*2);
		};

		this.indexToPos = function(index) {
			var x = parseInt(index/(this.getBoardWidth()*2),10),
		 		y = parseInt(Math.ceil(index%(this.getBoardWidth()*2))/2,10);
			return {
				x:x,
				y:y,
				tile:this.getPair(index)
			};
		};

		this.findTaverns = function() {
			return this.find('tavern', this.getBoard().tiles);
		};

		this.getData = function(pos) {
			var type = this.getTypeByPos(pos),
				pair = this.getPair(this.posToIndex(pos));
			if(type !== undefined) {
				if(mapLegend[type].dataKey !== undefined) {
					return pair.match(mapLegend[type].dataKey)[0];
				}
			}
			return undefined;
		};

		this.addMineData = function(mine) {
			var mineData = this.getData(mine);
			if(mineData !== undefined) {
				mine.owned = (mineData == this.getHero().id);
				mine.neutral = (mineData == mapLegend.mine.emptyData);
				mine.enemy = (!mine.owned && !mine.neutral);
			} else {
				console.warn('mine data is undefined');
			}
			return mine;
		};

		this.findMines = function(search) {
			return this.find('mine', this.getBoard().tiles,search).map(this.addMineData,this);
		};

		this.findImpassable = function() {
			var tileName = null,
				tile = null,
				walls = [];
			for(tileName in mapLegend) {
				if(mapLegend.hasOwnProperty(tileName)) {					
					tile = mapLegend[tileName];
					if(!tile.pass) {
						var additional = this.find(tileName, this.getBoard().tiles);
						walls = walls.concat(additional);	
					}
				}
			}
			return walls;
		};

		this.getState = function() {
			return this.state;
		};

		this.getGame = function() {
			return this.getState().game;
		};

		this.findOwnedMines = function() {
			return this.findMines(this.getHero().id);
		};

		this.findOpenMines = function() {
			return this.findMines(mapLegend.mine.emptyData);
		};

		this.findClosestOpenMine = function() {
			return this.findClosest(this.getHero().pos,this.findOpenMines());
		};

		this.findClosestTavern = function() {
			return this.findClosest(this.getHero().pos,this.findTaverns());
		};

		this.findEnemyMines = function() {
			return this.findMines().filter(function(mine){
				return !mine.owned;
			});
		};

		this.updateState = function(state) {
			this.previousState = this.state;
			this.state = state;

			return this;
		};

		this.update = function(state) {
			return this.updateState(state);
		};

		this.getEnemies = function() {
			return this.getPlayers().filter(function(player){
				return player.id !== this.getHero().id;
			});
		};

		this.getEnemiesPositions = function() {
			return this.getEnemies().map(function(enemy){
				return enemy.pos;
			});
		};

		this.getPlayers = function() {
			return this.getGame().heroes;
		};

		this.getAttackValue = function() {
			return mapLegend.hero.attackValue;
		};

		this.getTavernCost = function() {
			return mapLegend.tavern.goldCost;
		};

		this.getTavernHealAmount = function() {
			return mapLegend.tavern.healAmount;
		};

		this.getMineDamage = function() {
			return mapLegend.mine.combatCost;
		};

		/**
		 * HEROES SHIZ
		 */
		this.getHeroes = function() {
			return this.getPlayers();
		};

		this.getHero = function(id) {
			if(id === undefined || id === this.getState().hero.id ) {
				return this.getState().hero;
			}
			return this.getGame().heroes.find(function(hero){
				return hero.id === id;
			});
		};

		this.getHeroByPos = function(pos) {
			var players = this.getPlayers(),
			ret = players.find(
				function(player)	{
					return (player.pos.x === pos.x && player.pos.y === pos.y);
				}
			);
			if(ret === undefined) {
				return null;
			}
			return ret;
		};

		this.getHeroHealthPercentage = function(id) {
			var hero = this.getHero(id);
			if (hero !== undefined) {
				return hero.life / this.getHeroMaxHealth();	
			}
			throw new Error("Unknown Hero");
		};

		this.getHeroHealth = function(id) {
			var hero = this.getHero(id);
			if (hero !== undefined) {
				return hero.life;
			}
			throw new Error("Unknown Hero");
		};

		this.getHeroMaxHealth = function() {
			return mapLegend.hero.maxHealth;
		};

		this.getPassableByType = function(type) {
			if(mapLegend[type] === undefined) {
				return true;
			}
			return mapLegend[type].pass;
		};
			
		this.buildNeighbour = function(x,y) {
			var obj = {};
			obj.x = x;
			obj.y = y;
			obj.type = this.getTypeByPos(obj);
			obj.passable = this.getPassableByType(obj.type);
			obj.tile = this.getPairByPos(obj);
			if(obj.type === 'hero') {
				obj.hero = this.getHeroByPos(obj);
			} else {
				obj.hero = null;
			}
			return obj;
		};

		this.getNeighboursForPoint = function(position) {
			if(typeof position !== "object") {
				throw new TypeError("Please only use position objects for getNeighbours");
			}
			var res = {};
			if((position.y - 1) >= 0) {
				res.west = this.buildNeighbour(position.x, position.y -1);
			} else {
				res.west = null;
			}

			if((position.y + 1) <= this.getBoardWidth()) {
				res.east = this.buildNeighbour(position.x, position.y + 1);
			} else {
				res.east = null;
			}

			if((position.x - 1) >= 0) {
				res.north = this.buildNeighbour(position.x - 1, position.y);
			} else {
				res.north = null;
			}
			if((position.x + 1) <= this.getBoardHeight()) {
				res.south = this.buildNeighbour(position.x + 1, position.y);
			} else {
				res.south = null;
			}
			return res;
		};

		this.getNeighbouringCosts = function(position) {
			var cost = 0,
				neighbours = this.getNeighbours(position),
				neighbour = null;
			
			cost += this.getCostForPoint(position);
			for(neighbour in neighbours) {
				if(neighbours.hasOwnProperty(neighbour)) {
					if(neighbours[neighbour] !== null) {
						cost += this.getCostForPoint(neighbours[neighbour]);
					}
				}
			}
			return cost;
		};

		this.getCostForPoint = function(position) {
			if(typeof position !== "object") {
				throw new TypeError("Please only use position objects for getNeighbours");
			}
			return this.getTypeByPos(position).pathingCost;
		};

		this.getDistanceBetween = function(a,b) {
			var distance = {
				x: Math.abs(a.x - b.x),
				y: Math.abs(a.y - b.y),
			};
			if(config.distanceHeuristic === undefined) {
				config.distanceHeuristic = "manhattan";
			}
			if(typeof heuristics[config.distanceHeuristic] === "function" ) {
				return heuristics[config.distanceHeuristic](distance.x,distance.y);
			}
			return distance.x + distance.y;
		};

		this.findClosest = function(from,tiles) {
			var match = tiles[0];
			match.distance = this.getDistanceBetween(from,match);
			tiles.forEach(function(tile){
				if(tile.distance === null || tile.distance === undefined) {
					tile.distance = this.getDistanceBetween(from,tile);
				}
				if(tile.distance < match.distance) {
					match = tile;
				}
			},this);
			return match;
		};

		this.getTypeByIndex = function(index) {
			if(typeof index !== "number" || isNaN(index)) {
				throw new TypeError("Please only use indexes for getTypeByIndex");
			}
			var pair = this.getPair(index),
				tileName = null,
				tile = null;
			for(tileName in mapLegend) {
				if(mapLegend.hasOwnProperty(tileName)) {
					tile = mapLegend[tileName];
					if(pair.search(tile.key) !== -1){
						return tileName;
					}
				}
			}
		};

		this.getTypeByPos = function(pos) {
			if(typeof pos !== 'object') {
				throw new TypeError("getTypeByPos takes a position object");
			}
			return this.getTypeByIndex(this.posToIndex(pos));
		};

		this.getNumberOfOwnedMines = function() {
			return this.findOwnedMines().length;
		};

		this.getNumberOfEnemyMines = function() {
			return this.findEnemyMines().length;
		};

		this.getMinePercentage = function() {
			var owned = this.getNumberOfOwnedMines(),
				enemy = this.getNumberOfEnemyMines();
			if (owned < 0 && enemy < 0) {
				if (owned === 0) {
					return 0;
				}
				if (enemy === 0) {
					return 1;
				}
			}
			return owned / enemy;
		};

		this.comparePositions = function(a,b) {
			return (a.x === b.x && a.y === b.y);
		};



	
		return this;
	};
	exports = module.exports = State;	
}(exports,module)); 