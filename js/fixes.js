

webslide.me.prototype.fixcss3 = function(sheet) {

	function insertVendorPrefixes = function(str) {

		var properties = 'border-radius transition transform'.split(' ');

		for (var p = 0, l = properties.length; p < l; p++) {
			var property = this.style.css(properties[p]);
			if (property) {
				str = str.replace(new RegExp(properties[p],'g'), property);
			}
		}

		return str;

	}

	if (sheet && sheet.innerText) {

		sheet.innerText = insertVendorPrefixes(sheet.innerText);

	} else {

		var elements = document.getElementsByTagName('link'),
			files = [], // the url cache 
			rules = []; // the rules cache (contained inside /css/css3fixes.htc)

		// search for element stylesheets that have to be replaced
		for (var e = 0, l = elements.length; e < l; e++) {
			if (elements[e].rel == 'stylesheet') {
				var search = new RegExp('http://'+window.location.host,'g');
				files[elements[e].href.replace(search, '')] = true;
			}
		}

		// This will be the style element in the DOM that fixes the vendor-mess
		var css3fixer = document.getElementById('css3fixer');
		if (!css3fixer) {
			css3fixer = document.createElement('style');
			css3fixer.id = 'css3fixer';
			css3fixer.setAttribute('title', 'Get a better Web Browser, dude!');
			document.getElementsByTagName('head')[0].appendChild(css3fixer);
		}

		webslide.me.ajax.get('/css/css3fixes.htc', function(sheet, type, status) {

			var raw = sheet.split('---RULESET---');
			for (var r = 0, l = raw.length; r < l; r++) {

				var line = raw[r].trim();
				if (line.length > 0) {
					rules.push(line);
				}
			}

			for (var r = 0, l = rules.length; r < l; r++) {
				var sheet = rules[r],
					file = sheet.substr(sheet.strpos('--',0) + 2, sheet.strpos('--', 2) - 2);
				sheet = sheet.substr(sheet.strpos('--',2) + 3); // exclude the filename from sheet now (+3 > --\n)

				if (files[file]) {
					cssfixer.innerText += '\n' + insertVendorPrefixes(sheet).trim();
				} else {
					console.log('Not Found: ' + file);
				}
			}

		});

	}

};

webslide.me.prototype.fixhtml5 = function() {

	var supports_placeholder = (function(){
		return 'placeholder' in document.createElement('input');
	});

	if (!supports_placeholder) {

		var elements = document.getElementsByTagName('input');
		for (var e = 0, l = elements.length; e++) {
			var placeholder = elements[e].getAttribute('placeholder');

			if (placeholder && placeholder.length) {
				elements[e].setAttribute('value', placeholder);
				elements[e].onclick = function(){
					if (this.getAttribute('placeholder') == this.getAttribute('value')) {
						this.setAttribute('value', '');
					}
				};
			}
		}

	}

};


(function runFixesNow(){
	webslide.me.fixcss3();
	webslide.me.fixhtml5();
})();