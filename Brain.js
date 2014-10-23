(function (module,exports) {
	"use strict";
	var brain = require('brain'),
		Brain = function() {
			this.brainData = {};
			var net =  new brain.NeuralNetwork();

			this.update = function(state) {
				this.brainData = this.buildBrainData(state);
			};

			this.buildBrainData = function(state) {
				var obj = {};

				obj.heroHealth = state.getHero().health || 0;
				obj.percentageDone = state.getPercentageDone() || 0;
				obj.closestUnoccupiedMine = state.findClosestOpenMine().distance || 999;
				obj.closestEnemyMine = state.findClosestEnemyMine().distance || 999;
				obj.closestTavern = state.findClosestTavern().distance || 999;
				obj.goldShare = state.getGoldShare() || 0;

				return obj;
			};

			this.train = function() {
				//TODO: Grab from a file
				var data = {

				};
			};
		};
}(module,module.exports)); 