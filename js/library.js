
/*
 * Here are the patches for old Browsers. These Browsers miss e.g. document.getElementsByClassName
 * or a trim functionality on the native String object. These features are required for our framework to work.
 */

if (!document.getElementsByClassName) {

	document.getElementsByClassName = function(classname) {
		var elements = document.getElementsByTagName('*'),
			matches = [];

		// single className is searched
		if (!classname.match(/\ /)) {

			var search = new RegExp("(?:^|\\s)" + classname + "(?:$|\\s)");

			for (var e = 0, l = elements.length; e < l; e++) {

				var element = elements[e];

				// first: faster access on className attribute
				// second: test if className "contains" searched classname
				if (element.className === classname || search.test(element.className)) {
					matches.push(element);
				}
			}

		// multiple classNames are searched
		} else {

			var classnames = classname.split(' ');

			for (var e = 0, l = elements.length; e < l; e++) {

				var element = elements[e],
					tocheck = [];

				// first cache the classNames that match the searched classNames
				for (var c = 0, cl = classnames.length; c < cl; c++) {
					var search = new RegExp("(?:^|\\s)" + classnames[c] + "(?:$|\\s)");
					if (search.test(element.className)) {
						tocheck.push(element.className);
					}
				}

				// verify that all classNames have been found for this element
				if (tocheck.length == classnames.length) {
					matches.push(element);
				}

			}

		}

		return matches;

	};

}

/*
 * Required String functionality.
 * I know, extending the prototype is dirty...but it's just so much easier =)
 */

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
};

String.prototype.strpos = function(needle, offset) {
	var i = this.indexOf(needle, (offset || 0));
	return i === -1 ? false : i;
}



// webslide.me is our namespace for the whole library
if (typeof webslide == 'undefined') {
	webslide = {};
	webslide.me = {};
}


webslide.me.prototype = {


	style: (function(){

		var helper = document.createElement('dontknownbybrowser'),
			vendorPrefixes = 'Ms Moz Webkit O Khtml'.split(' '),
			_cache = {};

		function getSyntax(property, type){

			var cssProperty = '',
				jsProperty = '';

			if (property.match(/-/)) {
				cssProperty = property+'';

				var str = property.split(/-/);
				for (var s = 0, l = str.length; s < l; s++) {
					if (s === 0) {
						jsProperty += str[s].charAt(0).toLowerCase() + str[s].substr(1);
					} else {
						jsProperty += str[s].charAt(0).toUpperCase() + str[s].substr(1);
					}
				}
			} else {
				cssProperty = jsProperty = property.toLowerCase();
			}

			// native property
			if (helper.style[jsProperty] !== undefined) {
				if (type == 'css') {
					return cssProperty;
				} else {
					return jsProperty;
				}
			}

			// vendor property
			for (var v = 0, l = vendorPrefixes.length; v < l; v++) {

				var prefix = vendorPrefixes[v];

				var _jsProperty = prefix + jsProperty.charAt(0).toUpperCase() + jsProperty.substr(1),
					_cssProperty = '-'+prefix.toLowerCase() +'-'+ cssProperty.toLowerCase();

				if (helper.style[_jsProperty] !== undefined) {
					if (type == 'css') {
						return _cssProperty;
					} else {
						return _jsProperty;
					}
				}

			}

		}


		// public API
		return {

			// return the css property
			css: function(property) {
				return getSyntax(property, 'css');
			},
			// return the js property
			js: function(property) {
				return getSyntax(property, 'js');
			},

			// return the matching event property for usage with eventListeners
			event: function(property, relatedProperty) {

				var relatedCSS = getSyntax(relatedProperty, 'css');
				if (!relatedCSS) {
					return undefined;
				}

				// Sorry, but feature detection is just stupid for now. Every browser supports a completely different syntax =/
				if (relatedCSS.match(/-webkit/)) {
					switch (property) {
						case 'transitionend': return 'webkitTransitionEnd';
						case 'animationstart': return 'webkitAnimationStart';
						case 'animationend': return 'webkitAnimationEnd';
						case 'animationiteration': return 'webkitAnimationIteration';
					}
				} else if (relatedCSS.match(/-moz/)) {
					return property;
				} else if (relatedCSS.match(/-o/)) {
					switch (property) {
						case 'transitionend': return 'OTransitionEnd';
						case 'animationstart': return 'OAnimationStart';
						case 'animationend': return 'OAnimationEnd';
						case 'animationiteration': return 'OAnimationIteration';
					}
				}

				return undefined;

				/*
				// FEATURE DETECTION OF CSS EVENTS
				var eventName = undefined,
					eventSupported = false;

				if (window.addEventListener) {

					var handler = function(event) {
						eventName = event.type;
						eventSupported = true;

						console.log(eventName, eventSupported);

						this.removeEventListener(property.toLowerCase(), arguments.callee);
						for (var v = 0, l = vendorPrefixes.length; v < l; v++) {
							this.removeEventListener(vendorPrefixes[v]+property.charAt(0).toUpperCase()+property.substr(1), arguments.callee);
						}

					};

					helper.style.cssText = 'position:absolute;top:0px;'+getSyntax('transition','css')+':top 1ms ease;';

					helper.addEventListener(property.toLowerCase(), handler, false);
					for (var v = 0, l = vendorPrefixes.length; v < l; v++) {
						helper.addEventListener(vendorPrefixes[v]+property.charAt(0).toUpperCase()+property.substr(1), handler, false);
					}

					// start the transition now!
					document.documentElement.appendChild(helper);
					window.setTimeout(function() {

						helper.style.top = '10px';

						window.setTimeout(function() {
							helper.parentNode.removeChild(helper);
						}, 100);

					}, 0);

				}
				*/

			}

		};

	})()

};


/*
 * The AJAX library that is required for sending / receiving data from the server.
 * Simple implementation of POST / GET requests and responses
 */



webslide.me.ajax = {

	/*
	 * This will do a synchronous GET request
	 * @param url The URL to get the data from
	 * @param [callback] Optional callback. If no callback is given, the data will be returned instead.
	 * @param [aSync] Optional flag for forcing asynchronous loading if set to true.
	 */
	get: function(url, callback, aSync) {

		aSync = !!aSync || false;

		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, aSync);

		if (aSync && callback) {
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4) {
					callback(xhr.responseText || xhr.responseXML, xhr.status);					
				}
			};
		}

		xhr.send(null);

		if (!aSync && callback) {
			callback(xhr.responseText || xhr.responseXML, xhr.status);
		} else if (!aSync && !callback){
			return xhr.responseText || xhr.responseXML;
		}

	},

	/*
	 * This will do a synchronous POST request
	 * @param url The URL to post the data to
	 * @param data The Data Object
	 * @param [callback] The optional callback
	 * @param [aSync] Optional flag for forcing asynchronous loading if set to true.
	 */
	post: function(url, data, callback, aSync) {

		aSync = !!aSync || false;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, aSync);

		if (aSync && callback) {
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4) {
					callback(xhr.responseText || xhr.responseXML, xhr.status);
				}
			};
		}

		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		var _data = '', i = 0;
		for (var d in data) {
			_data += (i > 0 ? '&' : '') + d + '=' + encodeURI(data[d]);
			i++;
		}

		xhr.send((_data) ? _data : null);

		if (!aSync && callback) {
			callback(xhr.responseText || xhr.responseXML, xhr.status);
		} else if (!aSync && !callback){
			return xhr.responseText || xhr.responseXML;
		}

	}

};


/*
 * This is the publicly accessible API for retrieving the login or session data
 */
if (typeof ws == 'undefined') {
	ws = {};
}

ws.login = (function(){


	function getCookie(name) {

		var cookie = document.cookie,
			start, end;

		if (cookie.length > 0) {

			start = cookie.indexOf(name + '=');
			if (start != -1) {
				start = start + name.length + 1;
				end = cookie.indexOf(";", start);

				// last cookie value fix. There's no trailing ;
				if (end == -1) { end = cookie.length; }

				return unescape(cookie.substring(start, end));
			}

		}

		return undefined;

	}

	// Publicly accessible login / session data
	return {
		user: getCookie('user') || 'demo',
		skey: getCookie('skey') || 'demo'
	};

})();