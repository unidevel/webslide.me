/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.editor.wizard = function(steps, settings) {

	if (settings && typeof settings == 'object') {
		for (var s in settings) {
			if (settings[s] !== undefined) {
				this.settings[s] = settings[s];		
			}
		}
	}

	if (steps && steps.length) {

		this.__stepCache = [];

		for (var s = 0, l = steps.length; s < l; s++) {
			this.__stepCache.push(steps[s]);
		}
	}

	this.__init();

};


webslide.me.editor.wizard.prototype = {

	settings: {
		a: 'foo',
		b: 'bar'
	},

	/*
	 * PUBLIC API
	 */

	openSomething: function(file) {

	},






	/*
	 * PRIVATE API
	 */

	__init: function() {

		this.__updateCache(true);
		this.__updateUI();

	},

	__updateCache: function(reset) {

		if (reset) {
			this.__stepIndex = 0;
		}

		this.__activeStep = this.__stepCache[this.__stepIndex];

	},

	__updateUI: function() {

		var that = this;

		if (!this.__ui) {

			this.__ui = {};


			// UI: File (Webslide) functionality
			this.__ui.openSomething = document.getElementById('open-something');
			this.__ui.openSomething.onclick = function() {
				that.openSomething(this.href);
			};

		}

	}

};



var wizard;
(function() {
	wizard = new webslide.me.editor.wizard([{
		align: 'right',
		focus: '#slides-new',
		content:'Click here to create a new slide.'
	}]);
})();
