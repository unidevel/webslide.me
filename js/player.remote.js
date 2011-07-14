/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.player.remote = function(owner) {

	if (!owner) return;

	this.owner = owner;

	this.__init();

};


webslide.me.player.remote.prototype = {

	/*
	 * PUBLIC API
	 */

	zappTo: function(str) {

		var target = str.split(',');

		// stupidz called zis method
		if (!target[0] || !target[1]) return;

		var slideCache = this.owner.__slideCache,
			currentSlide = this.owner.__activeSlide,
			currentStepIndex = this.owner.__activeStepIndex || 0,
			nextSlide = document.getElementById(target[0]),
			nextSlideIndex = parseInt(target[0].replace(/slide-/, ''), 10) - 1,
			nextStepIndex = parseInt(target[1], 10);

		// target[1] is not required
		if (isNaN(nextStepIndex)) {
			nextStepIndex = 0;
		}

		if (currentSlide && nextSlide) {

			// Only play Slide Animation if it is not the current one
			if (currentSlide != nextSlide) {

				// API for playback capabilities (e.g. video / audio)
				if (currentSlide !== nextSlide && currentSlide.hasAttribute('data-onunload')) {
					window[currentSlide.getAttribute('data-onunload')].call(window, currentSlide);
				}

				for (var s = 0, l = slideCache.length; s < l; s++) {

					var slide = slideCache[s];

					// The Slide was already played
					if (s < nextSlideIndex && !slide.hasAttribute('data-prev')) {

						slide.setAttribute('data-prev', 'true');
						slide.removeAttribute('data-next');
						slide.removeAttribute('aria-selected');

					// The Slide is the next one to be played
					} else if (s == nextSlideIndex && !slide.hasAttribute('aria-selected')) {

						slide.setAttribute('aria-selected', 'true');
						slide.removeAttribute('data-prev');
						slide.removeAttribute('data-next');

						// API for playback capabilities (e.g. video / audio)
						if (slide.hasAttribute('data-onload')) {
							window[slide.getAttribute('data-onload')].call(window, slide);
						}

						this.owner.__activeSlide = slide;
						this.owner.__activeSlideIndex = s;

						window.location.hash = slide.id;
						this.owner.__ui.pagenumber.innerText = slide.id;

					// The Slide will be played
					} else if (s > nextSlideIndex && !slide.hasAttribute('data-next')) {

						slide.setAttribute('data-next', 'true');
						slide.removeAttribute('data-prev');
						slide.removeAttribute('aria-selected');

					}

				}

			}

			// Only play Animation Step if it is not the current one
			if (currentStepIndex != nextStepIndex) {

				var steps = document.getElementsByClassName('animation-step');

				if (steps && steps.length) {

					for (var s = 0, stepIndex = 0, l = steps.length; s < l; s++) {

						var step = steps[s];

						if (step.parentNode == this.owner.__activeSlide) {

							var stepOpacity = step.style.opacity;

							// Fade in animated steps and next step
							if (stepIndex <= nextStepIndex && stepOpacity != 1) {
								stepOpacity = 1;

							// Fade out old steps that were displayed before
							} else if (stepIndex > nextStepIndex && stepOpacity != 0) {
								stepOpacity = 0;
							}

							stepIndex++;

						}

					}

				}

			}


		}

	},






	/*
	 * PRIVATE API
	 */

	__lastDelay: 500, // start with a delay of 500ms

	__init: function() {
		this.__state = 'running';
		this.__update();
	},

	__destroy: function() {
		this.__lastDelay = 500;
		this.__state = 'destroyed';
	},

	__update: function() {

		// Skip if the Remote was stopped meanwhile
		if (this.__state != 'running') return;

		var that = this,
			url = window.location.href.replace(/#.+/, '').replace(/\/play\//, 'api/control/client/');

		// set the last up-date (haha, funny naming =D)
		this.__lastUpDate = +new Date();

		// FIXME: IE9/IE10 caches the URL, but doesn't validate its content against the cache.
		// url += '?s=' + (new Date()).getTime();

		webslide.me.ajax.get(url, function(response, status) {

			if (status == 200 && response) {

				that.zappTo(response.toString().trim());

				// Don't penetrate mobile bandwidth too much
				var delay = +new Date() - that.__lastUpDate;
				if (delay > that.__lastDelay) {
					that.__lastDelay = delay;
				}

			} else if (status >= 400) {
				that.__destroy();
			}

		}, this.__lastDelay);

	}

};