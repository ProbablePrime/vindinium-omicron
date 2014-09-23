(function (exports,module) {
	"use strict";
	

	var core  = function() {
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
				value:4
			}
		},
		
			charactersPerSpace = 2,
			percentageDone = (this.state.game.turn/this.state.game.maxTurns) * 100,
			boardWidth = (this.state.game.board.size * this.state.game.board.size) * charactersPerSpace,
			boardSplitterRegex = new RegExp(".{1,"+boardWidth+"}",'g'),
			splitBoard = this.state.game.board.match(boardSplitterRegex),
			boardHeight = boardWidth;

		this.state = null;

		function getPair(index) {
			if(index % 2 === 1 || index === 1) {
				index = index -1;
			}
			return this.state.game.board.substring(index,(index + (charactersPerSpace/2)) + 1);
		}
		function getIndicesOf(search, source) {
    		var indices = [],
    			result = null;
    		do {
    			result = search.exec(search);
    			indices.push(result.index);
    		}while (result);
    		return indices;
		}
		function find(what,where,search) {
			if(search === undefined) {
				return getIndicesOf(mapLegend[what].key,where);
			}
			var indices = getIndicesOf(mapLegend[what].key,where),
				result = [];
			indices.forEach(function(index){
				var tile = getPair(index),
				tileData = null;
				if(mapLegend[what].dataKey !== undefined) {
					tileData = tile.match(mapLegend[what].dataKey)[0];
					if(tileData === search) {
						result.push(index);
					}
				}
			});
			return result;
		}
		/*
			For some reason x and y are reversed in the maths we get from the server :S
		 */
		function posToIndex(x,y) {
			return (x * (boardWidth)) + (y*2);
		}
		function indexToPos(index) {
			var x = parseInt(index/boardWidth,10),
		 		y = Math.ceil(index%boardWidth)/2;
			return {
				x:x,
				y:y
			};
		}
		
		//state.game.hero.index = find
		
	};
	exports = module.exports = core;	
}(exports,module)); 