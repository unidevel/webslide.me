
webslide.me.app = function() {

	this.viewport = document.querySelector('#viewport') || document.body;
	this.wrapper = document.querySelector('#viewport-wrapper') || undefined;

	// wrapper is required for navigation concept
	if (!this.wrapper) return;

	this.__init();

};


webslide.me.app.prototype = {

	templates: {

		article: '<h3>{title}</h3><p class="description">{description}</p><div class="info"><a class="button" data-href="{url}">Play</a><span class="right">{user}<div class="views">{rank}</div></span>'

	},

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

	update: function() {

		var that = this;

		webslide.me.ajax.post('/api/webslides', {
			user: webslide.me.login.user
		}, function(json, status) {

			if (status === 200) {

				var dataset = JSON.parse(json);

				for (var d in dataset) {

					var data = dataset[d],
						template = that.templates.article.toString(),
						helper = document.createElement('article');


					for (var dd in data) {
						template = template.replace(new RegExp('{' + dd + '}'), data[dd]);
					}

					// Additional information that is not delivered by server-side api

					console.log(template);

					// patch the template now!




					console.log(data);

				}

			}

		});

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
				that.__updateLBSPosition(position);
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

	__updateLBSPosition: function(position) {

		this.__coordinates = {
			altitude: position.coords.altitude,
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};

	},

	__updateUI: function(reset) {

		var that = this;

		if (!this.__ui || reset) {

			this.__ui = {};

			// FIXME: Remove this later
			this.__ui.debug = document.querySelector("#debug");

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

			this.__ui.favorites = document.querySelector('#favorites');
			this.__ui.suggestions = document.querySelector('#suggestions');


		}


		if (this.__coordinates) {
			this.__ui.debug.href = 'http://maps.google.de/maps?ll=' + this.__coordinates.latitude + ',' + this.__coordinates.longitude;
		}

	},


};


