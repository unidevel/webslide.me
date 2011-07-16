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
		}
	},

	/*
	 * PUBLIC API
	 */

	openFile: function(file) {

		if (!file) return;

		var that = this;

		webslide.me.ajax.post('/api/edit/open', {
			user: webslide.me.login.user,
			skey: webslide.me.login.skey,
			file: file,
			type: 'webslide'
		}, function(html, status) {

			if (status == 200 && that.__ui.slideCache) {

				// Load Webslide
				var parent = that.__ui.slideCache,
					slides = that.__slideCache;

				if (slides && slides.length) {
					for (var s = 0, l = slides.length; s < l; s++) {
						slides[s].parentNode.removeChild(slides[s]);
					}
				}

				that.__ui.slideCache.innerHTML = html + that.__ui.slideCache.innerHTML;

				// Refill the Cache & update UI afterwards
				that.__updateCache(true);
				that.__updateUI();



				// Load Meta Information
				webslide.me.ajax.post('/api/edit/open', {
					user: webslide.me.login.user,
					skey: webslide.me.login.skey,
					file: file,
					type: 'meta'
				}, function(json, status) {
					if (status == 200) {
						var data = JSON.parse(json);
						if (data) {
							if (!that.__parserCache.meta) {
								that.__parserCache.meta = {};
							}
							for (var d in data) {
								that.__parserCache.meta[d] = data[d];
							}
						}

						// Update UI
						that.__updateUIFromParser('meta');

						// Fix for Parser
						document.getElementById('meta-filename').value = file.replace(/\.html/,'');

					}
				});

			} else {
				console.log('openFile', status);
			}

		});

	},

	createFile: function() {

		if (window.confirm('Sure to create a new webslide?\nAll unsaved changes will be lost.')) {
			var url = window.location.href.split('#');
			window.location.href = url[0];
		}

	},

	saveFile: function() {
		throw "Not implemented yet.";
	},

	openTheme: function(file) {

		if (!this.__ui) this.__updateUI();

		function updateSheetURL(fileName) {
			var sheet = document.getElementById('meta-theme');
			if (sheet) {
				sheet.href = '/css/' + fileName;
				return true;
			}
			return false;
		}

		if (updateSheetURL(file)) {

			if (!this.__parserCache.meta) this.__parserCache.meta = {};
			this.__parserCache.meta.theme = file;

			this.__ui.theme.value = file;

		}

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
		this.__ui.createSlide.parentNode.insertBefore(slide, this.__ui.createSlide);

		// Update our internal cache and UI
		this.__slideCache.push(slide);
		this.__updateUI();

	},

	removeSlide: function() {

		if (window.confirm('Sure to remove the active slide?')) {

			this.__activeSlide.parentNode.removeChild(this.__activeSlide);
			this.__activeSlide = undefined;

			this.__updateWorkspace();

		}

	},

	openElement: function(element) {

		this.__activeElement = element;

		this.__parserCache.element = {
			tagName: element.tagName.toLowerCase(),
			className: element.className.toLowerCase()
		};

		// Fix for having no undefined classNames in DOM =/
		if (!element.className.length) this.__parserCache.element.className = undefined;

		// Update the UI (Parser related Elements)
		this.__updateUIFromParser('element');

		// Update the Overlay
		this.__updateOverlay(element, true);

	},

	createElement: function() {

		if (!this.__ui) this.__updateUI();

		var that = this,
			target = this.__parserCache.element;

		if (target) {

			var clone = document.createElement(target.tagName);
			if (!target.tagName.match(/ul|ol/i)) {
				clone.innerHTML = 'New Element';
			} else {
				clone.innerHTML = '<li>Entry A</li><li>Entry B</li>';
			}

			clone.className = target.className;
			clone.onclick = function(){
				that.openElement(this);
			};

			this.__ui.workspace.appendChild(clone);
			this.saveSlide();

		}

	},

	removeElement: function() {

		// Hide Overlay
		this.__hideOverlay();

		if (!this.__activeElement) return;

		if (this.__activeElement != this.__ui.workspace.firstChild) {

			this.__activeElement.parentNode.removeChild(this.__activeElement);
			this.__activeElement = undefined;

			// this.__updateWorkspace();
			this.saveSlide();
		}

	},


	/*
	 * PRIVATE API
	 */

	__init: function() {

		this.__updateParserFromUI('element');
		this.__updateParserFromUI('slide');

		this.__updateCache(true);
		this.__updateUI();

	},

	saveSlide: function() {

		// Find out what we have to do now.
		var target = this.__parserCache.slide;

		if (!this.__activeSlide) return;
		if (!target) this.__updateParserFromUI('slide');


		// Slide Content
		this.__activeSlide.innerHTML = this.__ui.workspace.innerHTML;

		// Slide Animation
		if (target['data-animation'] && target['data-animation'] != this.__activeSlide.getAttribute('data-animation')) {
			this.__activeSlide.setAttribute('data-animation', target['data-animation']);

			if (webslide.me.style.css('transform') && webslide.me.style.css('transition')) {

				// Hide Overlay
				this.__hideOverlay();

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

		if (!this.__activeElement) return;
		if (!target) this.__updateParserFromUI('element');

		// Get Contents from UI Overlay
		target.innerHTML = this.__runHeuristics('html', target.tagName, this.__ui.overlay.value);

		if (target) {

			// Type
			if (target.tagName != this.__activeElement.tagName) {

				var that = this,
					element = document.createElement(target.tagName);
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

			}

			// Content
			if (target.innerHTML && this.__activeElement.innerHTML != target.innerHTML) {
				this.__activeElement.innerHTML = target.innerHTML;
			}

			// Alignment
			if (target.className && this.__activeElement.className != target.className) {
				this.__activeElement.className = target.className;
			}

		}


		// Hide Overlay
		if (!dontHideOverlay) {
			this.__hideOverlay();
		}

		this.saveSlide();

	},

	sendFeedback: function() {

		this.__updateParserFromUI('feedback');

		var data = this.__parserCache.feedback;
		if (data && data.idea && data.idea.length > 20) {

			webslide.me.ajax.post('/api/feedback', {
				user: webslide.me.login.user,
				skey: webslide.me.login.skey,
				email: data.email,
				idea: data.idea
			}, function(){
				window.alert('Thanks for your feedback!');
				webslide.me.hide('#lb-feedback');
			});

		}

	},

	__updateCache: function(reset) {

		if (!this.__slideCache || reset) {
			this.__slideCache = [];
		}

		var elements = document.querySelectorAll('#slides section');

		for (var e = 0, l = elements.length; e < l; e++) {

			var element = elements[e];
			if (element.id == 'create-slide') continue;

			element.id = 'slides-' + (e + 1);
			element.setAttribute('title', (e + 1) + ' of ' + (l - 1));

			this.__slideCache.push(element);
		}

	},

	__hideOverlay: function() {

		if (!this.__ui) this.__updateUI();

		this.__ui.overlay.style.cssText = 'display:none';
		this.__ui.overlay.value = '';

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

	__updateParserFromUI: function(relation, scopedElement) {

		// Standard Behaviour with Select-Menus
		if (!relation.match(/feedback|meta/)) {

			var elements;
			if (scopedElement && scopedElement.tagName) {
				elements = [ scopedElement ];
			} else {
				elements = document.querySelectorAll('select[data-rel='+relation+']');
			}

			if (elements && elements.length) {

				var data = {};
				for (var e = 0, l = elements.length; e < l; e++) {

					var element = elements[e],
						attr = element.getAttribute('data-attr'),
						value = undefined;

					if (attr) {
						value = element.getElementsByTagName('option')[element.selectedIndex].value;
						// This is a reserved value by our parsing concept.
						if (value == '-') value = undefined;
						data[attr] = value;
					}

				}

			}

		// Input-Field based Behaviour
		} else {

			var elements;
			if (scopedElement && scopedElement.tagName) {
				elements = [ scopedElement ];
			} else {
				elements = document.querySelectorAll('input[data-rel='+relation+'],textarea[data-rel='+relation+']');
			}

			if (elements && elements.length) {

				var data = {};
				for (var e = 0, l = elements.length; e < l; e++) {

					var element = elements[e],
						attr = element.getAttribute('data-attr'),
						value = element.value;

					if (attr) {
						// Yes, seems to make no sense... but has to be done this way. Defaults 4tw!
						if (value == element.getAttribute('placeholder')) value = undefined;
						if (!value.length) value = element.getAttribute('placeholder');
						data[attr] = value;
					}

				}

			}

		}

		// Update the Parser's data now.
		if (!this.__parserCache) this.__parserCache = {};
		if (!this.__parserCache[relation]) this.__parserCache[relation] = {};

		if (typeof data == 'object') {
			for (var d in data) {
				this.__parserCache[relation][d] = data[d];
			}
		}

	},

	__updateUIFromParser: function(relation) {

		// Skip if there's nothing parsed yet.
		if (!this.__parserCache[relation]) return;

		// Standard Behaviour with Select-Menus
		if (!relation.match(/feedback|meta/)) {

			var elements = document.querySelectorAll('select[data-rel='+relation+']');
			if (elements && elements.length) {

				for (var e = 0, l = elements.length; e < l; e++) {

					var element = elements[e],
						attr = element.getAttribute('data-attr'),
						options = element.getElementsByTagName('option');

					for (var o = 0, ol = options.length; o < ol; o++) {

						var option = options[o];
						if (
							option.value == this.__parserCache[relation][attr]
							|| (option.value == '-' && this.__parserCache[relation][attr] === undefined) // Our reserved value
						) {
							element.selectedIndex = o; // yay, a setter! makes life much easier!
							break;
						}

					}

				}
			}

		// Input-Field based Behaviour
		} else {

			var elements = document.querySelectorAll('input[data-rel='+relation+']');
			if (elements && elements.length) {

				for (var e = 0, l = elements.length; e < l; e++) {

					var element = elements[e],
						attr = element.getAttribute('data-attr');

					if (attr) {
						var value = this.__parserCache[relation][attr];
						if (value !== undefined && value.length) {
							element.value = value;
						}
					}

				}

			}

		}

	},

	__updateUI: function() {

		var that = this;

		if (!this.__ui) {

			this.__ui = {};

			this.__ui.slideCache = document.getElementById('slides');

			this.__ui.sendFeedback = document.getElementById('send-feedback');
			this.__ui.sendFeedback.onclick = function() {
				that.sendFeedback();
			};

			// Parser: Properties (sidebar)
			var elements = document.querySelectorAll('select[data-rel]');
			for (var e = 0, l = elements.length; e < l; e++) {
				elements[e].onchange = function() {
					that.__updateParserFromUI(this.getAttribute('data-rel'), this);
				};
			}

			// Parser: Themes (lightbox #lb-themes)
			var elements = document.querySelectorAll('div.themes-preview');
			for (var e = 0, l = elements.length; e < l; e++) {
				elements[e].onclick = function() {
					that.openTheme(this.getAttribute('data-api'));
				};
			}

			this.__ui.theme = document.getElementById('meta-theme-preview');
			if (this.__parserCache.meta && this.__parserCache.meta.theme) {
				this.__ui.theme.value = this.__parserCache.meta.theme;
			}

			// UI: File (Webslide) functionality
			this.__ui.openFile = document.getElementById('open-file');
			this.__ui.openFile.onclick = function() {

				var file = undefined,
					list = document.querySelector(this.getAttribute('data-api'));

				if (!list) return false;

				var items = list.getElementsByTagName('input');
				for (var i = 0, l = items.length; i < l; i++) {
					if (items[i].checked) {
						file = items[i].value;
						break;
					}
				}

				if (file) {
					that.openFile(file);
					webslide.me.hide('#lb-open');
				}

				return false;
			};

			this.__ui.createFile = document.getElementById('create-file');
			this.__ui.createFile.onclick = function() {
				that.createFile();
			};

			this.__ui.saveFile = document.getElementById('save-file');
			this.__ui.saveFile.onclick = function() {
				that.__updateParserFromUI('meta');
				that.saveFile();
			};


			// UI: Slide functionality
			this.__ui.createSlide = document.getElementById('create-slide');
			this.__ui.createSlide.onclick = function() {
				that.createSlide();
			};

			this.__ui.removeSlide = document.getElementById('remove-slide');
			this.__ui.removeSlide.onclick = function() {
				that.removeSlide();
			};


			// UI: Element functionality
			this.__ui.createElement = document.getElementById('create-element');
			this.__ui.createElement.onclick = function() {
				// Not required anymore. See above (this.__ui.parserElements)
				// that.__updateParserFromUI('element');
				that.createElement();
			};

			this.__ui.removeElement = document.getElementById('remove-element');
			this.__ui.removeElement.onclick = function() {
				that.removeElement();
			};


			// UI: Workspace functionality
			this.__ui.workspace = document.getElementById('workspace');

			this.__ui.overlay = document.createElement('textarea');
			this.__ui.overlay.id = 'workspace-overlay';
			this.__ui.overlay.setAttribute('data-rel', 'element');
			this.__ui.overlay.setAttribute('data-attr', 'innerHTML');
			document.body.appendChild(this.__ui.overlay);

		}

		// UI: SlideCache and openSlide functionality
		for (var s = 0, l = this.__slideCache.length; s < l; s++) {
			this.__slideCache[s].onclick = function() {
				that.openSlide(this);
			};
		}

	},

	__updateWorkspace: function() {

		// Hide Overlay
		this.__hideOverlay();

		// Update Workspace Content
		if (this.__activeSlide) {
			this.__ui.workspace.innerHTML = this.__activeSlide.innerHTML;
		} else {
			this.__ui.workspace.innerHTML = '';
			return; // Nothing more to do if there's no active Slide
		}

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

		var output = '';

		// List-specific Heuristics
		if (elementType.match(/ul|ol/i)) {

			var parts = [];

			// FIXME: Remove this if it was approved to be stable =)
			window.console && console.warn('Unstable List Heuristics >', format);

			// Applying Heuristics for HTML > Text
			if (format == 'text') {

				parts = elementContent.split(/<li>/);

				for (var p = 0, l = parts.length; p < l; p++) {
					var part = parts[p].replace(/<\/li>/,'').trim();
					if (part.length) {
						output += '- ' + part + '\n';
					}
				}

			// Applying Heuristics for Text > HTML
			} else {

				parts = elementContent.split(/\n/);

				for (var p = 0, l = parts.length; p < l; p++) {
					var part = parts[p].trim();
					if (part.charAt(0) == '-') {
						output += '<li>' + part.substr(1) + '</li>';
					}
				}

			}

		// Standard Heuristics
		} else {

			var parts = [];

			// Applying Heuristics for HTML > Text
			if (format == 'text') {

				// HTML5 Mode
				if (elementContent.match(/<br>/i)) {
					parts = elementContent.split(/<br>/i);
				// XHTML Mode
				} else {
					parts = elementContent.split(/<br\/>/i);
				}

				for (var p = 0, l = parts.length; p < l; p++) {
					if (p < (l-1)) {
						output += parts[p] + '\n';
					} else {
						output += parts[p];
					}
				}

			// Applying Heuristics for Text > HTML
			} else {

				var parts = elementContent.split(/\n/);

				for (var p = 0, l = parts.length; p < l; p++) {

					// parts[p].replace(/^s+/, '').replace(/\s+$/, '');
					parts[p] = parts[p].trim();

					if ( p < (l-1)) {
						output += parts[p] + '<br/>';
					} else if (parts[p].length) {
						output += parts[p];
					}

				}
			}

		}

		if (output && output.length) {
			return output;
		} else {
			return 'PARSE ERROR';
		}

	}

};
