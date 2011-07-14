/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.editor = function(context) {

	this.context = (context && context.parentNode) ? context : document.body;

	this.__init();

};


webslide.me.editor.prototype = {

	/*
	 * PUBLIC API
	 */

	open: function(file) {

	},






	/*
	 * PRIVATE API
	 */

	__init: function() {

	},

	__update: function() {

	},

	__updateUI: function() {

		if (!this.__ui) {

			this.__ui = {};

		}

	}

};