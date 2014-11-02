(function(exports,module) {
	"use strict";
	var _ = require('lodash'),
		State  = function() {
		var mapLegend = {
			spawnPoint: {
				key: new RegExp('X[1-4]{1}',"g"),
				dataKey: new RegExp('[1-4]{1}'),
				pass:true,
				interact:false,
				value:-1,
				cost:2
			},
			space: {
				key:new RegExp('  ',"g"),
				pass:true,
				interact:false,
				value:1,
				cost:0
			},
			barrier: {
				key: new RegExp('##',"g"),
				pass:false,
				interact:false,
				value:0,
				cost:1
			},
			hero: {
				key: new RegExp("@[1-4]{1}","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("[1-4]{1}"),
				value:2,
				cost:4,
			},
			tavern: {
				key: new RegExp('\\[\\]',"g"),
				pass:false,
				interact:true,
				value:3,
				cost:0
			},
			mine: {
				key: new RegExp("\\$\\-|[1-4]{1}","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("-|[1-4]{1}") ,
				value:4,
				emptyData:'-',
				cost:1
			}
		},		
		charactersPerSpace = 2;

		this.state = null;
		this.previousState = null;

		this.getPercentageDone = function() {
			return (this.getState().game.turn/this.state.game.maxTurns) * 100;
		};

		this.getBoardWidth = function() {
			return (this.getBoard().size) * charactersPerSpace;
		};

		this.getBoardSplitterRegex = function() {
			return new RegExp(".{1,"+this.getBoardWidth()+"}",'g');
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
				var tile = self.getPair(index),
				tileData = null;
				if(mapLegend[what].dataKey !== undefined) {
					tileData = tile.match(mapLegend[what].dataKey)[0];
					if(search !== undefined) {
						//XXX Coercion, I don't care
						if(tileData == search) {
							result.push(index);
						}
					} else {
						result.push(index);
					}
				}
			});
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
			return (x * (this.getBoardWidth())) + (y*2);
		};

		this.indexToPos = function(index) {
			var x = parseInt(index/this.getBoardWidth(),10),
		 		y = parseInt(Math.ceil(index%this.getBoardWidth())/2,10);
			return {
				x:x,
				y:y
			};
		};

		this.findTaverns = function() {
			return this.find('tavern', this.getBoard().tiles);
		};

		this.findMines = function(search) {
			return this.find('mine', this.getBoard().tiles,search);
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

		this.getHero = function() {
			return this.getState().hero;
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
			return _.difference(this.findMines(),this.findOwnedMines());
		};

		this.updateState = function(state) {
			this.previousState = this.state;
			this.state = state;

			return this;
		};

		this.update = function(state) {
			return this.updateState();
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
			return 20;
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
			
		this.buildNeighbour = function(x,y) {
			var obj = {};
			obj.x = x;
			obj.y = y;
			obj.type = this.getTypeByPos(obj);
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


		this.getCostForPoint = function(position) {
			if(typeof position !== "object") {
				throw new TypeError("Please only use position objects for getNeighbours");
			}
			return this.getTypeByPos(position).cost;
			//var costs = this.getNeighboursForPoint(position).map()
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

		this.getDistanceBetween = function(a,b) {
			var distance = {
				x: Math.abs(a.x - b.x),
				y: Math.abs(a.y - b.y),
			};
			return Math.sqrt((Math.pow(distance.x,2) + Math.pow(distance.y,2)));
		};

		this.findClosest = function(from,tiles) {
			var match = tiles[0];
			match.distance = this.getDistanceBetween(from,match);
			tiles.forEach(function(tile){
				if(tile.distance === null) {
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



	
		return this;
	};
	exports = module.exports = State;	
}(exports,module)); 