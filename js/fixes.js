/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

(function fixcss3(sheet) {

	function insertVendorPrefixes(str) {

		var properties = 'border-radius transition transform'.split(' ');

		for (var p = 0, l = properties.length; p < l; p++) {
			var property = webslide.me.style.css(properties[p]);
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

		// Fatal mistake. No webslide.me library was load.
		if (typeof webslide == 'undefined') return;

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
					css3fixer.innerText += '\n' + insertVendorPrefixes(sheet).trim();
				} else {
					window.console && console.warn('No patches applied for: ' + file);
				}
			}

		});

	}

})();

(function fixhtml5(){

	var supports_placeholder = (function(){
		return 'placeholder' in document.createElement('input');
	});

	if (!supports_placeholder) {

		var elements = document.getElementsByTagName('input');
		for (var e = 0, l = elements.length; e < l; e++) {
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

})();


// advanced IE9 functionalities
(function runIE9SiteMode(){

	if (window.external && typeof (window.external.msIsSiteMode) != 'undefined' && window.external.msIsSiteMode()) {
		webslide.me.ajax.post('/api/external/webslides', {
			user: ws.login.user
		}, function(json, status) {

			if (status == 200) {

				var slides = JSON.parse(json);
				if (slides && slides.length) {

					window.external.msSiteModeClearJumpList();
					window.external.msSiteModeCreateJumpList('Edit ' + ws.login.user + '\'s Webslides');

					for (var s = 0, l = slides.length; s < l; s++) {
						window.external.msSiteModeAddJumpListItem(slides[s].title, '/edit/' + slides[i].file, '/favicon.ico');
					}

					window.external.msSiteModeShowJumpList();

				}

			}

		});
	}

})();

// This will replace links to webslide.me by correcting every a.href
(function fixDomainIssues(){

	// Nothing to do
	if (document.location.host.match(/webslide.me/)) return;

	var elements = document.getElementsByTagName('a');
	for (var e = 0, l = elements.length; e < l; e++) {
		if (elements[e].href.match(/webslide.me/)) {
			elements[e].href = elements[e].href.replace(/webslide.me/, document.location.host);
		}
	}
})();
