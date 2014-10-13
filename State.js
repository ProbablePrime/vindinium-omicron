(function(exports,module) {
	"use strict";

	var State  = function() {
		var mapLegend = {
			spawnPoint: {
				key: new RegExp('X[1-4]{1}',"g"),
				dataKey: new RegExp('[1-4]{1}'),
				pass:true,
				interact:false,
				value:-1
			},
			space: {
				key:new RegExp('  ',"g"),
				pass:true,
				interact:false,
				value:1
			},
			barrier: {
				key: new RegExp('##',"g"),
				pass:false,
				interact:false,
				value:0
			},
			hero: {
				key: new RegExp("@[1-4]{1}","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("[1-4]{1}"),
				value:2,
			},
			tavern: {
				key: new RegExp('\\[\\]',"g"),
				pass:false,
				interact:true,
				value:3
			},
			mine: {
				key: new RegExp("\\$\\-|[1-4]{1}","g"),
				pass:false,
				interact:true,
				dataKey: new RegExp("-|[1-4]{1}") ,
				value:4,
				emptyData:'-'
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
			this.getBoard().match(this.getBoardSplitterRegex());
		};

		this.getPair = function(index) {
			if(index % 2 === 1 || index === 1) {
				index = index -1;
			}
			return this.getBoard().tiles.substring(index,(index + (charactersPerSpace/2)) + 1);
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
			if(search === undefined) {
				return this.getIndicesOf(mapLegend[what].key,where);
			}
			var indices = this.getIndicesOf(mapLegend[what].key,where),
				result = [];
			var self = this;
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
			return (x * (this.getBoardWidth())) + (y*2);
		};

		this.indexToPos = function(index) {
			var x = parseInt(index/this.getBoardWidth(),10),
		 		y = Math.ceil(index%this.getBoardWidth())/2;
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
		this.updateState = function(state) {
			this.previousState = this.state;
			this.state = state;
		};
		//state.game.hero.index = find
		//
	
		return this;
	};
	exports = module.exports = State;	
}(exports,module)); 