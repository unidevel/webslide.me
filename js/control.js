/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.control = function(file, context) {

	this.context = (context && context.parentNode) ? context : document.body;

	if (file){
		this.open(file);
	} else if (window.location.hash.match(/!/)) {
		this.open(window.location.hash.split(/!/)[1]);
	}

	this.__init();

};


webslide.me.control.prototype = {

	__slideCache: [],
	__state: 'paused',

	/*
	 * PUBLIC API
	 */

	open: function(file) {

		// hashbang compatibility 4tw!
		if (file.match(/!/)) {
			file = file.split(/!/)[1];
		}

		if (!this.__ui) {
			this.__updateUI();
		}

		var that = this,
			workspace = document.getElementById('workspace'),
			notification = document.getElementById('notification'),
			toolbar = this.__ui.toolbar;

		webslide.me.ajax.post('/api/edit/open', {
			'user': ws.login.user,
			'skey': ws.login.skey,
			'file': file,
			'type': 'webslide'
		}, function(data, status) {

			if (workspace) {
				workspace.innerHTML = '<section>WELCOME SCREEN</section>' + data;
			}

			if (notification && toolbar) {
				notification.className = 'hidden';
				toolbar.className = '';
			}

			// give the browser a bit of rendering time
			window.setTimeout(function(){
				that.start();
			}, 10);

		});

	},

	start: function() {

		var that = this,
			slides = document.getElementsByTagName('section');

		for (var s = 0, l = slides.length; s < l; s++) {
			slides[s].id = 'slide-' + (s + 1);
			slides[s].style.display = 'none';
			this.__slideCache.push(slides[s]);
		}

		this.__state = 'running';
		this.__updateUI();

		// Let the Server know that we have started presentation
		this.__activeSlide = slides[0];
		this.__activeStepIndex = 0;

		this.__update();

	},

	end: function() {

		this.__state = 'paused';
		this.__updateUI();

		// Let the Server know that we have ended the presentation
		this.__activeSlide = 'slide-end';

		this.__update();

	},

	zapp: function(direction) {

		var steps = document.getElementsByClassName('animation-step'),
			foundStep = false, // flag
			slideId; // array position for this.__slideCache

		if (direction == 'next') {

			var activeStepIndex = 0;

			if (steps) {

				for (var s = 0, l = steps.length; s < l; s++) {

					var slide = steps[s].parentNode;

					// FIXME: Get rid of the data-counted attribute somehow.
					if (slide === this.__activeSlide && !steps[s].getAttribute('data-counted')) {
						if (!foundStep) {
							steps[s].style.color = 'red';
							steps[s].setAttribute('data-counted', 'true');
							activeStepIndex++;
							foundStep = true;
							break;
						}
					} else if (slide !== this.__activeSlide) {
						steps[s].removeAttribute('data-counted');
					} else {
						steps[s].style.cssText = ' ';
						activeStepIndex++;
					}

				}

				// flag was set, so we have found the active step
				if (foundStep) {
					this.__activeStepIndex = activeStepIndex;
					this.__update();

					// animated successfully to the next step
					return;
				} else {
					this.__activeStepIndex = 0;
				}

			}

			// animate to the next slide now (because no left step was found)
			slideId = parseInt(this.__activeSlide.id.replace(/slide-/,''), 10);

			// skip if the presentation has finished
			if (slideId > this.__slideCache.length) {
				return;
			}

		} else if (direction == 'prev') {

			// FIXME: This should be done a more complex way with de-animating steps or so.
			this.__activeStepIndex = 0;

			// animate to the prev slide now
			// #slide-7 = slides[6] - 1 = slides[5]
			slideId = parseInt(this.__activeSlide.id.replace(/slide-/,''), 10) - 1;

			if (slideId > 0) {
				slideId = slideId - 1;
			}

		}

		var currentSlide = this.__activeSlide,
			nextSlide = this.__slideCache[slideId];

		if (nextSlide) {

			currentSlide.style.display = 'none';
			nextSlide.style.display = 'block';
			this.__activeSlide = nextSlide;

		}

		this.__update();

	},






	/*
	 * PRIVATE API
	 */

	__init: function() {

		var slides = document.getElementsByTagName('section'),
			that = this;

		// No WebSlide was loaded, so try to retrieve the index instead
		if (slides.length == 0) {

			webslide.me.ajax.get('/api/webslides', function(json, status) {
				var webslides = JSON.parse(json),	
					workspace = document.getElementById('workspace');

				if (webslides && webslides.length) {
					var ul = document.createElement('ul');
					ul.id = 'webslides';

					for (var w = 0, wl = webslides.length; w < wl; w++) {
						var li = document.createElement('li');
						li.innerHTML = '<a href="/control/#!' +webslides[w].file+ '">' + webslides[i].title + '</a>';
						li.onclick = function(){
							that.open(this.href);
						};
						ul.appendChild(li);
					}

					// Append the list to the workspace now
					if (workspace) {
						workspace.appendChild(ul);
					}
				} else if (workspace) {
					workspace.innerHTML = 'Seems as you have no webslides.<br/><h3>Start with <a href="/edit/">creating a webslide</a>.</h3>';
					workspace.style.textAlign = 'center';
					workspace.style.fontSize = '120%';
				}

			});

		}

	},

	__update: function() {


		var slides = this.__slideCache;

		// hide all slides
		for (var s = 0, l = slides.length; s < l; s++) {
			slides[s].style.display = 'none';
		}


		// show active slide, check if it was recognized already
		if (this.__activeSlide && this.__activeSlide.id) {
			this.__activeSlide.style.display = 'block';
		}

		// Let the Server know what the active slide and step is
		var that = this,
			file = window.location.href.split(/!/)[1],
			data = (this.__activeSlide.id ? this.__activeSlide.id : 'slide-end') + ',' + this.__activeStepIndex;

		webslide.me.ajax.post('/api/control/' + file, {
			'user':ws.login.user,
			'skey':ws.login.skey,
			'active': data
		}, function(result, status) {
			if (status == 200) {
				if (that.__ui && that.__ui.pagenumber) {
					that.__ui.pagenumber.innerHTML = data;
				}
			}
		});

	},

	__updateUI: function() {

		var that = this;

		if (!this.__ui) {

			this.__ui = {};

			// Toolbar
			this.__ui.toolbar = document.createElement('aside');
			this.__ui.toolbar.id = 'toolbar';
			this.__ui.toolbar.className = 'hidden'; // hide toolbar by default

			// Previous Button
			this.__ui.prev = document.createElement('button');
			this.__ui.prev.title = 'Navigate Backward';
			this.__ui.prev.innerText = '&lt;';
			this.__ui.prev.onclick = function(){
				that.zapp('prev');
			};

			// Next Button
			this.__ui.next = document.createElement('button');
			this.__ui.next.title = 'Navigate Forward';
			this.__ui.prev.innerText = '&gt;';
			this.__ui.next.onclick = function(){
				that.zapp('next');
			};

			// Toggler (Start / End)
			this.__ui.toggler = document.createElement('button');

			// Page Number
			this.__ui.pagenumber = document.createElement('span');
			this.__ui.pagenumber.id = 'pagenumber';
			this.__ui.pagenumber.title = 'slide, animation-step - (server-side values)';

			this.__ui.toolbar.appendChild(this.__ui.prev);
			this.__ui.toolbar.appendChild(this.__ui.next);
			this.__ui.toolbar.appendChild(this.__ui.toggler);
			this.__ui.toolbar.appendChild(this.__ui.pagenumber);

			// Append to the Context if there was one setup
			if (this.context) {
				this.context.appendChild(this.__ui.toolbar);
			}

		}

		// Update UI behaviour dependend on current state
		if (this.__state == 'running') {

			this.__ui.toggler.onclick = function(){
				that.end();
			};
			this.__ui.toggler.innerText = 'End';

			this.__ui.prev.style.display = 'inline-block';
			this.__ui.next.style.display = 'inline-block';

		} else {

			this.__ui.toggler.onclick = function(){
				that.start();
			};
			this.__ui.toggler.innerText = 'Start';

			this.__ui.prev.style.display = 'none';
			this.__ui.next.style.display = 'none';

		}

	}

};