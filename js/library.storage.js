/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web Storage Polyfill
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

if (typeof window.webslide === 'undefined') {
	window.webslide = { me: {} };
}


webslide.me.storage = function(type) {

	this.__type = type || 'session';
	this.__data = this.__getInitialData();
	this.length = 0;

};

webslide.me.storage.prototype = {

	/*
	 * PUBLIC API
	 */

	clear: function() {
		this.__data = {};
		this.length = 0;
		this.__update();
	},

	key: function(index) {

		var current = 0;
		for (var d in this.__data) {
			if (current === index) {
				return d;
			} else {
				current++;
			}
		}

		return null;

	},

	getItem: function(key) {

		return this.__data[key] !== undefined ? this.__data[key] : null;

	},

	setItem: function(key, value) {

		this.__data[key] = value;
		this.length++;
		this.__update();

	},

	removeItem: function(key) {

		if (this.__data[key] !== undefined) {
			delete this.__data[key];
			this.length--;
			this.__update();
		}

	},






	/*
	 * PRIVATE API
	 */

	__getInitialData: function() {

		var data;
		if (this.__type === 'session') {
			data = window.name;
		} else {
			this.__readCookie('localStorage');
		}

		return data ? JSON.parse(data) : {};

	},

	__createCookie: function(name, value, days) {

		var expires = "";

		if (days) {

			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();

		}

		document.cookie = name + "=" + value + expires + "; path=/";

	},

	__readCookie: function(name) {

		var nameEqual = name + '=',
			parts = document.cookie.split(';'),
			str;

		for (var p = 0, l = parts.length; p < l; p++) {

			str = parts[p]:
			while (str.charAt(0) === ' ') {
				str = str.substring(1, str.length);
			}

			if (str.indexOf(nameEQ) === 0) {
				return str.substring(nameEQ.length, str.length);
			}

		}

		return null;

	},

	__update: function() {

		var json = JSON.stringify(this.__data);

		if (this.__type === 'session') {
			window.name = json;
		} else {
			this.__createCookie('localStorage', data, 365);
		}

	}

};



(function(){

	if (typeof window.localStorage === 'undefined') {
		window.localStorage = new webslide.me.storage('local');
	}

	if (typeof window.sessionStorage === 'undefined') {
		window.sessionStorage = new webslide.me.storage('session');
	}

})();

