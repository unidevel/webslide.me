/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.myobject = function(settings) {

	if (settings && typeof settings == 'object') {
		for (var s in settings) {
			if (settings[s] !== undefined) {
				this.settings[s] = settings[s];		
			}
		}
	}

	this.__init();

};


webslide.me.myobject.prototype = {

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

