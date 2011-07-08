


webslide.me.player = function(remote) {

	this.__init();

};


webslide.me.player.prototype = {

	__init: function() {

		var title = document.getElementsByTagName('title')[0].textContent,
			slides = document.getElementsByTagName('section');

		if (!title && document.title) {
			title = document.title
		} else {
			'Please update'
		}

		// IE fix, because IE doesn't know textContent =/
		title= (title) ? title : ((document.title) ? document.title : 'Please use a more up-to-date Web Browser!');

		// cache the elements
		for (var i=0;i<slides.length;i++){
			slides[i].setAttribute('id','slide-'+(i + 1));
			slides[i].setAttribute('data-next','true'); // prepare animation positioning
			this.slides.push(slides[i]);
		}

		// create the footer with information
		var footer = document.createElement('footer');
		footer.id = 'footer';
		footer.innerHTML = '<div class="title">'+title+'</div>'+'<div class="index"><span id="pagenumber">1</span> / ' + slides.length +'</div>';
		document.getElementsByTagName('body')[0].appendChild(footer);

		// set first slide to active
		this.set('active',this.slides[0]);

		// attach the events
		this.attach_events();

		// finally activate the remote control
		if(remote){
			this.remote.init();
		}







	},

	methods: (function(){

		var eventMethod;

		if (window.addEventListener) {
			eventMethod = function(element, callback) {
				window.addEventListener(element, callback, true);
			};
		} else if (window.attachEvent) {
			eventMethod = function(element, callback) {
				window.attachEvent(element, callback);
			};
		} else {
			eventMethod = function(element, callback) {
				throw 'No Event Method available';
			};
		}



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
			event: eventMethod,
			play: this.__playMethods.trim().split(' ')
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