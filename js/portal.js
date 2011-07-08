

webslide.me.login = function(context) {

	this.context = (context && context.tagName) ? context : document.getElementById('login');

	this.__init();

};


webslide.me.login.prototype = {

	__show: function() {
		this.context.className = 'lightbox';
		this.__update();
	},

	__hide: function() {
		this.context.className = 'lightbox hidden';
		// not necessary
		// this.__update();
	},

	__init: function() {

		var that = this;

		this.__ui = {};

		this.__ui.show = document.getElementById('login-show');
		if (this.__ui.show) {
			this.__ui.show.onclick = function(){
				that.__show();
			};
		}

		this.__ui.hide = document.getElementById('login-hide');
		if (this.__ui.hide) {
			this.__ui.hide.onclick = function(){
				that.__hide();
			};
		}

		this.__ui.submit = document.getElementById('login-submit');
		if (this.__ui.submit) {
			this.__ui.submit.onclick = function(){
				that.__submit();
			};
		}


		this.__ui.swi = document.getElementById('login-switch');
		if (this.__ui.swi) {
			this.__ui.swi.onclick = function(){
				that.__update(this.checked);
			};
		}

	},

	__update: function(showIt) {

		var element1 = document.getElementById('login-email'),
			element2 = document.getElementById('fieldset-links');

		// skip if the elements are not there.
		if (!element1 || !element2) return;

		if (showIt) {
			element1.style.display = 'inline-block';
			element2.style.display = 'block';
		} else {
			element1.style.display = 'none';
			element2.style.display = 'none';
		}

	},

	__notify: function(message) {

		var element = document.getElementById('login-notify');
		if (element) {
			element.innerHTML = message;
		}

	},

	__submit: function() {

		var data = {
			name: document.getElementById('login-1').value,
			pass: document.getElementById('login-3').value
		};

		if (this.__ui.swi && this.__ui.swi.checked) {
			data.email = document.getElementById('login-2').value;
			data.create_login = 'yes';
		} else {
			data.email = '';
			data.create_login = 'no';
		}

		var that = this;
		webslide.me.ajax.post('/api/login', data, function(result, type, status) {
			if (status == 200) {
				window.location.href = result;
			} else if (result.length) {
				that.__notify(result.trim());
			} else {
				that.__notify('Sorry, request failed. Please check your credentials.');
			}
		});

	}

}
