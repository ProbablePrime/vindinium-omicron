(function (exports,module) {
	"use strict";
	var _ = require('lodash'),
		PathFinder = function() {
		var pathFinder = require('pathfinding'),
			finder = new pathFinder.TraceFinder();
		this.grid = null;

		this.update = function(state) {
			this.grid = new pathFinder.Grid(state.getBoardWidth(),state.getBoardHeight());
			var walls = state.findImpassable();
			walls.forEach(function(wall){
				//XXX Our coord system sometimes durps and returns huge numbers
				///if(wall.y < state.getBoardWidth() || wall.x < state.getBoardHeight()) {
					//XXX Vindiniums coordinate system
					this.grid.setWalkableAt(wall.y, wall.x, false);
				//}
			},this);
		};

		this.pathTo = function(source,sink) {
			var pathGrid = this.grid.clone();
			pathGrid.setWalkableAt(source.y,source.x,true);
			pathGrid.setWalkableAt(sink.y,sink.x,true);
			return finder.findPath(source.y,source.x,sink.y,sink.x, pathGrid);
		};

		this.directionTo = function(source,sink) {
			var path = this.pathTo(source,sink);
			return path.map(function(step,index) {
				return this.convertToDirection(step,path[index-1]);
			},this);
		};

		this.firstStepTo = function(source,sink) {
			var path = this.pathTo(source,sink);
			if(path.length > 0) {
				if(path[0][0] === source.y &&  path[0][1] === source.x) {
					return path[1];
				}
				return path[0];
			}
			return null;
		};

		this.firstDirectionTo = function(source,sink) {
			var path = this.directionTo(source,sink);
			if(path.length > 0) {
				if(path[0] === "STAY") {
					return path[1];
				}
				return path[0];	
			}
			return null;
		};

		this.convertToDirection = function(current,previous) {
			if (previous === null || previous === undefined) {
				return 'STAY';
			}
			if(current[0] < previous[0]) {
				return 'LEFT';
			}
			if(current[0] > previous[0]) {
				return 'RIGHT';
			}
			if(current[1] < previous[1]) {
				return 'UP';
			}
			if(current[1] > previous[1]) {
				return 'DOWN';
			}
			return 'STAY';
		};
		return this;
	};
	exports = module.exports = PathFinder;	
}(exports,module));
