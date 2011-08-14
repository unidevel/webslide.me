

window.webslide = { me: {} };


webslide.me.app = function() {

	this.viewport = document.querySelector('#viewport') || document.body;
	this.wrapper = document.querySelector('#viewport-wrapper') || undefined;

	// wrapper is required for navigation concept
	if (!this.wrapper) return;

	this.__init();

};


webslide.me.app.prototype = {

	/*
	 * PUBLIC API
	 */

	navigateTo: function(viewportId) {

		if (this.__viewports[viewportId]) {

			var viewport = this.__viewports[viewportId];
			this.wrapper.style.webkitTransform = 'translate3d(' + viewport.posX + 'px,' + viewport.posY + 'px, 0px)';

			// Browser Bugs with offsetProperties =/
			// window.location.hash = viewportId;
		}


	},






	/*
	 * PRIVATE API
	 */

	__init: function() {

		this.__initViewports();
		this.__initLBS();
		this.__updateUI(true);

		if (window.location.hash.match(/#/)) {
			var that = this;
			window.setTimeout(function() {
				var viewportId = window.location.hash.replace(/#/,'');
				that.navigateTo(viewportId);
			}, 0);
		}

	},

	__initLBS: function() {

		if (navigator.geolocation) {

			var that = this;
			this.__lbsWatchId = navigator.geolocation.watchPosition(function(position) {
				that.__updatePosition(position);
			});

		}

	},

	__initViewports: function() {

		this.__viewports = {};

		var viewports = this.wrapper.querySelectorAll('.viewport');
		for (var v = 0, l = viewports.length; v < l; v++) {
			var viewport = viewports[v];
			if (viewport.id) {
				this.__viewports[viewport.id] = {
					posY: -1 * viewport.offsetTop,
					posX: -1 * viewport.offsetLeft
				};
			}
		}

	},

	__updatePosition: function(position) {

		this.__coordinates = {
			altitude: position.coords.altitude,
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};

		var debug = document.querySelector('#debug');

		debug.href = 'http://maps.google.de/maps?ll=' + this.__coordinates.latitude + ',' + this.__coordinates.longitude;

//		debug.innerText = this.__coordinates.altitude;
//		debug.innerText += '\nlong: ' + this.__coordinates.longitude;
//		debug.innerText += '\nlat: ' + this.__coordinates.latitude;

	},

	__updateUI: function(reset) {

		var that = this;

		if (!this.__ui || reset) {

			this.__ui = {};

			this.__ui.naviElements = document.querySelectorAll('.navi');
			for (var n = 0, nl = this.__ui.naviElements.length; n < nl; n++) {
				var element = this.__ui.naviElements[n];
				element.onclick = function() {
					that.navigateTo(this.href.split(/#/)[1]);
					return false;
				};
			}

			this.__ui.headerElements = document.querySelectorAll('.header');
			for (var h = 0, hl = this.__ui.headerElements.length; h < hl; h++) {
				this.__ui.headerElements[h].onclick = function() {
					that.navigateTo('home');
					return false;
				};
			}

		}

	},


};


