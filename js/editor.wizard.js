/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.editor.wizard = function(steps, settings) {

	if (settings && typeof settings == 'object') {

		for (var s in settings) {
			if (settings[s] !== undefined) {
				this.settings[s] = settings[s];		
			}
		}

	}

	if (steps && steps.length) {

		this.__stepCache = [];

		for (var s = 0, l = steps.length; s < l; s++) {
			this.__stepCache.push(steps[s]);
		}
	}

	this.__init();

};


webslide.me.editor.wizard.prototype = {

	settings: {
		autostart: true,
		loop: false
	},

	/*
	 * PUBLIC API
	 */

	zapp: function() {

		if (typeof this.__stepIndex == 'number') {
			this.__stepIndex++;
		} else {
			this.__stepIndex = 0;
		}

		this.zappTo(this.__stepIndex);

		return this.__stepIndex;

	},

	zappTo: function(id) {

		// Reattach old event bindings if there was an element before
		if (this.__activeStep && this.__activeStep.element) {
			this.__activeStep.element[this.__activeStep.event] = this.__activeStep.oldEvent;
			this.__activeStep.oldEvent = null;
		}


		// Update Step Cache
		if (this.__stepCache[id]) {
			this.__stepIndex = id;
		} else if (this.settings.loop === true) {
			this.__stepIndex = 0;
		}

		this.__updateCache();

		if (this.__activeStep) {

			this.__activeStep.element = document.querySelector(this.__activeStep.selector) || null;

			// Throw an error if there's no element in DOM to guide to.
			if (!this.__activeStep.element) {
				throw "Couldn't find the focussed element for step "+ this.__stepIndex;
			}

			if (!this.__activeStep.event) {
				this.__activeStep.event = 'onclick';
			}

			// Backup old function which will be attached back if step was completed successfully
			this.__activeStep.oldEvent = this.__activeStep.element[this.__activeStep.event];

			// Currify the onEvent function with our cool stuff
			var that = this;
			this.__activeStep.element[this.__activeStep.event] = (function(old) {
				return function() {
					if (old) { old.call(this, arguments); }
					that.zapp();
				};
			})(this.__activeStep.element[this.__activeStep.event]);

		}

		this.__updateUI();

	},






	/*
	 * PRIVATE API
	 */

	__init: function() {

		if (this.settings.autostart && this.__stepCache[0]) {
			this.zapp();
		}

	},

	__updateCache: function(reset) {

		if (reset) {
			this.__stepIndex = 0;
		}

		this.__activeStep = this.__stepCache[this.__stepIndex];

	},

	__updateUI: function() {

		var that = this;

		if (!this.__ui) {

			this.__ui = {};

			// UI: WizardBubble functionality

			var node = document.createElement('div');
			node.id = 'wizard-bubble';

			// DEBUG: if no #wizard-bubble is defined via CSS
			// console.log(window.getComputedStyle(node, null)['position'])
			// node.style.cssText = 'position:absolute;min-width:200px;width:auto;height:auto;border:1px solid black;background:white';

			this.__ui.wizardBubble = node;

		}

		var bubble = this.__ui.wizardBubble;

		// Update the WizardBubble only if there's something to do
		if (this.__activeStep && this.__activeStep.element && this.__activeStep.element.parentNode) {

			var offset = this.__getOffset(this.__activeStep.element),
				dimensions = this.__getDimensions(this.__activeStep.element);

			// Update Bubble in DOM
			bubble.parentNode && bubble.parentNode.removeChild(bubble);
			bubble.innerText = this.__activeStep.content;

			// FIXME: This is only for debug purposes
			bubble.title = 'step #' + this.__stepIndex;

			this.__activeStep.element.parentNode.appendChild(bubble);

			// Shift wizardBubble now
			switch (this.__activeStep.align) {

				case 'top':
					bubble.className = 'top';
					offset.top -= bubble.offsetHeight;
				break;

				case 'right':
					bubble.className = 'right';
					offset.left += dimensions.width;
				break;

				case 'bottom':
					bubble.className = 'bottom';
					offset.top += dimensions.height;
				break;

				case 'left':
					bubble.className = 'left';
					offset.left -= bubble.offsetWidth;
				break;

			}

			// FIXME: Our Bubble shouldn't be outside the window, right?
			// style.top = Math.min(window.innerHeight - bubble.offsetHeight, style.top);
			// style.left = Math.min(window.innerWidth - bubble.offsetWidth, style.left);

			bubble.style.top = offset.top + 'px';
			bubble.style.left = offset.left + 'px';

		} else {

			bubble.parentNode && bubble.parentNode.removeChild(bubble);

		}

	},

	__getDimensions: function(element) {

		var dimensions = {
			width: element.offsetWidth,
			height: element.offsetHeight
		};

		return dimensions;

	},

	__getOffset: function(element, scope) {

		// Scope is the most upper DOM element to sum with
		scope = (scope && scope.tagName) ? scope : document.body;

		var currentParent = element.parentNode,
			offset = {
				top: element.offsetTop,
				right: element.offsetRight,
				bottom: element.offsetBottom,
				left: element.offsetLeft
			};

		// Fastest path to return element's offset
		if (currentParent === scope) return offset;

		// Walk through all parents until scope is reached
		while (currentParent !== scope) {

			offset.top += currentParent.offsetTop;
			offset.left += currentParent.offsetLeft;

			// Now check the next parent upside in DOM
			currentParent = currentParent.parentNode;

		}

		return offset;

	}

};
