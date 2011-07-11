


webslide.me.player = function(remote) {

	this.__ui = {};
	this.__slideCache = [];

	this.__init();

};


webslide.me.player.prototype = {



	go: function(direction) {

		if (!direction) return;

		var steps = document.getElementsByClassName('animation-step');


		if (direction == 'next') {

			// Animate a Step, not a Slide
			if (steps && steps.length) {

				for (var s = 0, l = steps.length; s < l; s++) {
					var step = steps[s];
					if (
						this.__activeSlide === step.parentNode
						&& step.style.opacity != 1
					) {
						step.style.opacity = 1;

						// Skip navigation to next Slide
						return;
					}
				}

			}

			// Animate to next Slide
			var currentSlideIndex = this.__activeSlideIndex,
				nextSlideIndex = currentSlideIndex;

			// Yep, the next slide is also available in the slideCache
			if (this.__slideCache[currentSlideIndex + 1]) {
				nextSlideIndex = currentSlideIndex + 1;
			}

			if (currentSlideIndex != nextSlideIndex) {

				var currentSlide = this.__activeSlide,
					nextSlide = this.__slideCache[nextSlideIndex];

				currentSlide.removeAttribute('aria-selected');
				currentSlide.removeAttribute('data-next');
				currentSlide.setAttribute('data-prev', 'true');

				// API for playback capabilities (e.g. video / audio)
				if (currentSlide.hasAttribute('data-onunload') {
					window[currentSlide.getAttribute('data-onunload')].call(window, currentSlide);
				}

				nextSlide.removeAttribute('data-next');
				nextSlide.setAttribute('aria-selected', 'true');

				// API for playback capabilities (e.g. video / audio)
				if (nextSlide.hasAttribute('data-onload') {
					window[nextSlide.getAttribute('data-onload')].call(window, nextSlide);
				}


				// Update our cached activeSlide now
				this.__activeSlide = nextSlide;
				this.__activeSlideIndex = nextSlideIndex;

				window.location.hash = nextSlide.id;
				this.__ui.pagenumber.innerText = nextSlide.id;

			}

		} else if (direction == 'prev') {

			// Animate a Step, not a Slide
			if (steps && steps.length) {

				for (var s = (steps.length - 1); s >= 0; s--) {
					var step = steps[s];
					if (
						this.__activeSlide == step.parentNode
						&& step.style.opacity == 1
					) {
						step.style.opacity = 0;

						// Skip navigation to previous Slide
						return;
					}
				}

			}

			// Animate to previous Slide
			var currentSlideIndex = this.__activeSlideIndex,
				prevSlideIndex = currentSlideIndex;

			// Yep, the previous slide is also available in the slideCache
			if (this.__slideCache[currentSlideIndex - 1]) {
				prevSlideIndex = currentSlideIndex - 1;
			}

			if (currentSlideIndex != prevSlideIndex) {

				var currentSlide = this.__activeSlide,
					prevSlide = this.__slideCache[prevSlideIndex];

				currentSlide.removeAttribute('aria-selected');
				currentSlide.removeAttribute('data-prev');
				currentSlide.setAttribute('data-next', 'true');

				// API for playback capabilities (e.g. video / audio)
				if (currentSlide.hasAttribute('data-onunload') {
					window[currentSlide.getAttribute('data-onunload')].call(window, currentSlide);
				}

				prevSlide.removeAttribute('data-prev');
				prevSlide.setAttribute('aria-selected', 'true');

				// API for playback capabilities (e.g. video / audio)
				if (prevSlide.hasAttribute('data-onload') {
					window[prevSlide.getAttribute('data-onload')].call(window, prevSlide);
				}


				// Update our cached activeSlide now
				this.__activeSlide = prevSlide;
				this.__activeSlideIndex = prevSlideIndex;

				window.location.hash = prevSlide.id;
				this.__ui.pagenumber.innerText = prevSlide.id;

			}

		}

	},



	__init: function() {

		var title = document.getElementsByTagName('title')[0].textContent,
			slides = document.getElementsByTagName('section');


		// Update the document title
		if (!title && document.title) {
			title = document.title
		} else {
			title = 'webslide.me | Please update your old Browser.';
		}

		// Update the slide cache
		if (slides && slides.length){
			for (var s = 0, l = slides.length; s < l; s++) {
				slides[s].id = 'slide-' + (s + 1);
				if (s > 0) {
					slides[s].setAttribute('data-next', 'true');
				}
				this.__slideCache.push(slides[i]);
			}
		}

		// footer
		this.__ui.footer = document.createElement('footer');
		this.__ui.footer.id = 'footer';
		this.__ui.footer.innerHTML = '<div class="title">' + title + '</div>';

		var footerIndex = document.createElement('div');
		footerIndex.className = 'index';

		this.__ui.pagenumber = document.createElement('span');
		this.__ui.pagenumber.id = 'pagenumber';
		footerIndex.appendChild(this.__ui.pagenumber);

		// Default navigation
		this.__ui.navi = document.createElement('div');
		this.__ui.navi.id = 'navigation';


		// previous button
		this.__ui.prevButton = document.createElement('button');
		this.__ui.prevButton.title = 'previous slide';
		this.__ui.prevButton.setAttribute('accesskey', this.settings.accesskeys.prev);
		this.__ui.prevButton.innerText = '&lt;';
		this.__ui.prevButton.onclick = function(){
			that.go('prev');
		};


		// next button
		this.__ui.nextButton = document.createElement('button');
		this.__ui.nextButton.title = 'next slide';
		this.__ui.nextButton.setAttribute('accesskey', this.settings.accesskeys.next);
		this.__ui.nextButton.innerText = '&gt;';
		this.__ui.nextButton.onclick = function(){
			that.go('next');
		};


		this.__ui.footer.appendChild(footerIndex);
		this.__ui.navi.appendChild(this.__ui.backwardButton);
		this.__ui.navi.appendChild(this.__ui.forwardButton);
		this.__ui.footer.appendChild(this.__ui.navi);
		document.body.appendChild(this.__ui.footer);		

		// Initial Setup
		this.__activeSlide = this.__slideCache[0];
		this.__activeSlideIndex = 0;
		this.__attachEvents();

		if (remote) {
			this.initRemote();
		}

	},

	__handleEvent: function(event) {

		// Stupidz called thiz
		if (!event) return;

		// Fixes touch/drag issues on Webkit Mobile
		if (typeof (event.preventDefault) == 'function') {
			event.preventDefault();
		}

		// Use the first recognized touch on MultiTouch environments
		if (event.touches) {
			event = event.touches[0];
		}

		// Mouse Click
		if (event.clientX) {

			// Skip on Right or Middle Mouse Button
			if (event.button && event.button !== 0) {
				return;
			}

			if (event.clientX < window.innerWidth / 2) {
				this.go('next');
			} else {
				this.go('prev');
			}

		// Keyboard
		} else if (event.keyCode) {

			// PageDown
			if (event.keyCode == 34) {
				this.go('next');
			// PageUp
			} else if (event.keyCode == 33) {
				this.go('prev');
			}

		}

		// Avoid Event Bubbling
		return false;

	},

	__attachEvents: function() {


		var that = this,
			slides = this.__slideCache,
			playMethods = this.lib.playMethods;

		// Only attach events if features were detected the right way
		if (slides && slides.length && playMethods && playMethods.length) {

			for (var s = 0, l = slides.length; s < l; s++) {

				for (var p = 0, pl = playMethods.length; p < pl; p++) {
					this.lib.addEvent(slides[s], playMethods[p], function(event){
						that.__handleEvent.apply(event); 
					});
				}

			}

		}

	},

	lib: (function(){

		// Event Method
		var eventMethod;

		if (window.addEventListener) {
			eventMethod = function(element, type, callback) {
				element.addEventListener(type, callback, true);
			};
		} else if (window.attachEvent) {
			eventMethod = function(element, callback) {
				element.attachEvent(type, callback);
			};
		} else {
			eventMethod = function(element, callback) {
				throw 'No Event Method available';
			};
		}

		// Play Methods
		var playMethod;
		this.__playMethods = '';

		// DOM Level 2 (Touch API)
		if (window.Touch || document.ontouchstart) {
			this.__playMethods += ' touchstart';
		}

		// DOM Level 2 (except Opera)
		if (window.event) {
			if (window.event.mouseup) {
				this.__playMethods += ' mouseup';
			} else if (window.event.keyup) {
				this.__playMethods += ' keyup';
			}

		// Old Internet Explorer implementation
		} else if (window.Event) {
			if (window.Event.MOUSEUP) {
				this.__playMethods += ' mouseup';
			} else if (window.Event.KEYUP) {
				this.__playMethods += ' keyup';
			}
		}

		// DOM Level 0 / Model 2
		if((document.onclick = function(){}) && !this.__playMethods.match(/mouseup/)){
			// Well, we've got an old, old browser. Seems like grandma is online.
			document.onclick = null;
			this.__playMethods = '';
		}



		// public API
		return {
			addEvent: eventMethod,
			playMethods: this.__playMethods.trim().split(' ')
		};



		// Fuck you, Opera ASA, idiots!
		// You're too silly to implement a simple if(window.event)!
		// I hate Opera browser and its fucked up window.Event and window.event mixery.

		// This is just for Opera and its buggy window.event mixery
		/*
		if((document.onmouseup=function(){}) && !methods.match(/mouseup/)){
			document.onmouseup=null;
			methods+=' mouseup';
		}
		if((document.onkeyup=function(){}) && !methods.match(/keyup/)){
			document.onkeyup=null;
			methods+=' keyup';
		}
		*/

	})()

};
