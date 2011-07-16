/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.editor = function(settings) {

	if (settings && typeof settings == 'object') {
		for (var s in settings) {
			if (settings[s] !== undefined) {
				this.settings[s] = settings[s];		
			}
		}
	}

	this.__init();

};


webslide.me.editor.prototype = {

	settings: {

		elements: {
			editable: [ 'h1', 'h2', 'p', 'ol', 'ul' ],
			allowed: [ 'h1', 'h2', 'p', 'ol', 'ul', 'li', 'pre', 'img', 'audio', 'video', 'script' ]
		},
		heuristics: {
			li: [
				'>', // first char is default
				'-', '#', '+', '*', '=',
				'1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.',
				'I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.'
			]
		}
	},

	/*
	 * PUBLIC API
	 */

	open: function(file) {

	},

	openSlide: function(slide) {

		for (var s = 0, l = this.__slideCache.length; s < l; s++) {
			var otherSlide = this.__slideCache[s];
			if (otherSlide == slide) {
				otherSlide.className = 'active';
			} else {
				otherSlide.className = ' ';
			}
		}

		this.__activeSlide = slide;

		this.__updateWorkspace();

	},

	createSlide: function() {

		var slide = document.createElement('section');
		slide.id = 'slides-' + (this.__slideCache.length + 1);
		slide.innerHTML = "<h1>Title</h1><p>Edit me!</p>";

		// Append the created Slide to the DOM
		this.__ui.newSlide.parentNode.insertBefore(slide, this.__ui.newSlide);

		// Update our internal cache and UI
		this.__slideCache.push(slide);
		this.__updateUI();

	},

	openElement: function(element) {

		this.__activeElement = element;

		this.__parserCache.element = {
			tagName: element.tagName,
			className: element.className
		};


		// Update the Overlay
		this.__updateOverlay(element, true);

	},

	createElement: function() {

		if (!this.__ui) this.__updateUI();

		var that = this,
			target = this.__parserCache.element;

		if (target) {

			var clone = document.createElement(target.tagName);
			clone.innerHTML = 'New Element';
			clone.onclick = function(){
				that.openElement(this);
			};

			this.__ui.workspace.appendChild(clone);
			this.saveSlide();

		}

	},


	/*
	 * PRIVATE API
	 */

	__init: function() {

		if (!this.__parserCache) {
			this.__parserCache = {
				slide: undefined,
				element: undefined
			};
		}

		this.__updateCache(true); // will update the UI, too

	},

	saveSlide: function() {

		// Slide Content
		this.__activeSlide.innerHTML = this.__ui.workspace.innerHTML;

		var target = this.__parserCache.slide;

		// Slide Animation
		if (target['data-animation'] && target['data-animation'] != this.__activeSlide.getAttribute('data-animation')) {
			this.__activeSlide.setAttribute('data-animation', target['data-animation']);

			if (webslide.me.style.css('transform') && webslide.me.style.css('transition')) {

				// Hide Overlay
				this.__ui.overlay.style.cssText = ' ';
				this.__ui.overlay.value = '';

				// Prepare Animation
				this.__ui.workspace.setAttribute('data-animation', target['data-animation']);
				this.__ui.workspace.setAttribute('data-next', 'true');

				// Start Animation
				var workspace = this.__ui.workspace
				window.setTimeout(function(){
					workspace.removeAttribute('data-next');
					workspace.setAttribute('aria-selected', 'true');
				}, 1000);

				// End Animation
				window.setTimeout(function(){
					workspace.removeAttribute('aria-selected');
				}, 3000);

			}

		} else if (!target['data-animation']) {
			this.__activeSlide.removeAttribute('data-animation');
			this.__ui.workspace.removeAttribute('data-animation');
		}


		// Slide Layout
		if (target['data-layout'] && target['data-layout'] != this.__activeSlide.getAttribute('data-layout')) {
			this.__activeSlide.setAttribute('data-layout', target['data-layout']);
			this.__ui.workspace.setAttribute('data-layout', target['data-layout']);
		} else {
			this.__activeSlide.removeAttribute('data-layout');
			this.__ui.workspace.removeAttribute('data-layout');
		}

	},

	saveElement: function(dontHideOverlay) {

		// Find out what we have to do now.
		var target = this.__parserCache.element;

		if (!this.__activeElement || !target) return;

		// Get Contents from UI Overlay
		target.innerHTML = this.__runHeuristics('html', target.tagName, this.__ui.overlay.value);

		if (target) {

			if (target.tagName != this.__activeElement.tagName) {

				var that = this,
					element = document.createElement(target.tagName);
				element.innerHTML = target.innerHTML;
				element.onclick = function() {
					that.openElement(this);
				};

				// FIXME: Not implemented yet: data-onload and data-onunload attributes

				var parent = this.__activeElement.parentNode,
					next = this.__activeElement.nextSibling;
				if (next !== null) {
					parent.removeChild(this.__activeElement);
					parent.insertBefore(element, next);
				} else {
					parent.removeChild(this.__activeElement);
					parent.appendChild(element);
				}

				this.__activeElement = element;

			} else if (this.__activeElement.innerHTML != target.innerHTML) {
				this.__activeElement.innerHTML = target.innerHTML;
			}

		}

		// Hide Overlay
		if (!dontHideOverlay) {
			this.__ui.overlay.style.cssText = 'display:none';
			this.__ui.overlay.value = '';
		}

		this.saveSlide();

	},

	__updateCache: function(reset) {

		if (!this.__slideCache || reset) {
			this.__slideCache = [];
		}

		var elements = document.querySelectorAll('#slides section');

		for (var e = 0, l = elements.length; e < l; e++) {

			var element = elements[e];
			if (element.id == 'new-slide') continue;

			element.id = 'slides-' + (e + 1);
			element.setAttribute('title', (e + 1) + ' of ' + (l - 1));

			this.__slideCache.push(element);
		}

		this.__updateUI();

	},

	__updateOverlay: function(element, showOverlay) {

		if (!this.__ui) this.__updateUI();

		var that = this;

		this.__ui.overlay.value = this.__runHeuristics('text', element.tagName, element.innerHTML);

		this.__ui.overlay.onblur = function() {
			that.saveElement();
		};

		this.__ui.overlay.onkeypress = function(event) {

			if (event.keyCode == 13) {

				var newLineHeight = 0;
				if (this.style.lineHeight == 'normal') {
					newLineHeight = parseInt(this.style.fontSize, 10);
				} else {
					newLineHeight = parseInt(this.style.lineHeight, 10);
				}

				if (!isNaN(newLineHeight)) {
					this.style.height = (parseInt(this.style.height, 10) + newLineHeight) + 'px';
				}

			}

		};

		var cssText = [],
			computedStyle = window.getComputedStyle(element, null);

		// Offset and Dimensions
		cssText.push('top:' + (this.__ui.workspace.offsetTop + element.offsetTop) + 'px');
		cssText.push('left:' + (this.__ui.workspace.offsetLeft + element.offsetLeft) + 'px');
		cssText.push('width:' + (element.offsetWidth) + 'px');
		cssText.push('height:' + (element.offsetHeight) + 'px');

		// Font and Text
		var properties = [ 'line-height', 'font-family', 'font-size', 'font-style', 'font-weight', 'text-align' ];
		for (var p = 0, l = properties.length; p < l; p++) {
			cssText.push(properties[p] + ':' + computedStyle.getPropertyValue(properties[p]));
		}

		// Apply generated Styles to overlay
		this.__ui.overlay.style.cssText = cssText.join(';');

		if (showOverlay) {
			this.__ui.overlay.style.display = 'block';
			this.__ui.overlay.focus();
		}

	},

	__updateUI: function() {

		var that = this;

		if (!this.__ui) {

			this.__ui = {};

			this.__ui.newFile = document.getElementById('new-file');
			this.__ui.newFile.onclick = function() {
				that.createFile();
			};

			this.__ui.newSlide = document.getElementById('new-slide');
			this.__ui.newSlide.onclick = function() {
				that.createSlide();
			};

			this.__ui.workspace = document.getElementById('workspace');

			this.__ui.overlay = document.createElement('textarea');
			this.__ui.overlay.id = 'workspace-overlay';
			this.__ui.overlay.setAttribute('data-rel', 'element');
			this.__ui.overlay.setAttribute('data-attr', 'innerHTML');
			document.body.appendChild(this.__ui.overlay);

		}

		for (var s = 0, l = this.__slideCache.length; s < l; s++) {
			this.__slideCache[s].onclick = function() {
				that.openSlide(this);
			};
		}

	},

	__updateWorkspace: function() {

		// Reset Overlay
		this.__ui.overlay.style.cssText = ' ';
		this.__ui.overlay.value = ' ';

		// Update Workspace
		this.__ui.workspace.innerHTML = this.__activeSlide.innerHTML;

		// Update Sidebar
		var animation = this.__activeSlide.getAttribute('data-animation');
		if (animation) {
			this.__ui.workspace.setAttribute('data-animation', animation);
		} else {
			this.__ui.workspace.removeAttribute('data-animation');
		}

		var layout = this.__activeSlide.getAttribute('data-layout');
		if (layout) {
			this.__ui.workspace.setAttribute('data-layout', layout);
		} else {
			this.__ui.workspace.removeAttribute('data-layout');
		}

		if (!this.__parserCache.slide) {
			this.__parserCache.slide = {};
		}

		// Update the Parser's Data
		this.__parserCache.slide['data-animation'] = animation;
		this.__parserCache.slide['data-layout'] = layout;

		var that = this,
			editableElements = this.settings.elements.editable;

		for (var e = 0, l = editableElements.length; e < l; e++) {

			var elements = this.__ui.workspace.getElementsByTagName(editableElements[e]);
			if (elements && elements.length) {
				for (var ee = 0, el = elements.length; ee < el; ee++) {
					elements[ee].onclick = function(){
						that.openElement(this);
					};
				}
			}

		}

	},

	__runHeuristics: function(format, elementType, elementContent) {

		console.log('runHeuristics on', format, elementType, elementContent);

		return elementContent;

	}

};
