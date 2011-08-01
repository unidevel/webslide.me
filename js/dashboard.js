/*
 * webslide.me / 2011 by Christoph Martens
 *
 * Web: http://webslide.me, http://martens.ms
 *
 * Source and License:
 * http://github.com/martensms/webslide.me
 *
 */

webslide.me.dashboard = function(context) {

	if (!context) return;

	this.__context = (context && context.tagName) ? context : document.getElementById(context);

	this.__slideCache = [];
	this.update(true);

};


webslide.me.dashboard.prototype = {

	/*
	 * Public API
	 */
	update: function(reset) {

		var that = this;

		webslide.me.ajax.post('/api/webslides', {
			user: webslide.me.login.user,
			skey: webslide.me.login.skey
		}, function(json, status) {
			if (status == 200) {
				var data = JSON.parse(json);
				if (data && data.length) {
					if (reset) {
						that.__context.innerHTML = '';
					}
					that.__updateDashboard(data);
				}
			}
		});

	},






	/*
	 * Private API
	 */

	__updateDashboard: function(data) {

		for (var d = 0, l = data.length; d < l; d++) {

			var slide = data[d],
				container = document.createElement('div'),
				title = document.createElement('h4'),
				desc = document.createElement('p');

			container.className = 'themes-preview ' + slide.theme.replace(/theme-/,'').replace(/\.css/,'');

			title.innerText = slide.title || 'No Title';
			desc.innerText = slide.description || 'No Description';

			container.appendChild(title);
			container.appendChild(desc);


            // create the navigation bar now
			var navi = document.createElement('div');
			navi.className = 'webslide-actions';

			var playButton = this.__createButton('Play', '/play/' + slide.file),
				editButton = this.__createButton('Edit', '/edit/#!' + slide.file);

			navi.appendChild(playButton);
			navi.appendChild(editButton);

			container.appendChild(navi);

			this.__context.appendChild(container);
			this.__slideCache.push({
				slide: slide,
				node: container
			});

		}

	},

	__createButton: function(label, href) {

		var button = document.createElement('a');
		button.className = 'button';
		button.href = href;
		button.innerHTML = label;

		return button;

	}



};

