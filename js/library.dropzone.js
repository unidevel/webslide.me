

webslide.me.dropzone = function(dropzone, callback) {

	this.dropzone = dropzone;

	if (typeof callback == 'function') {
		this.callback = callback;
	}

	this.__init();

};


webslide.me.dropzone.prototype = {


	settings: {
		onMediaUpload: function(data){ console.log(data); }
	},

	__init: function() {

		var blockedEvents = 'dragenter dragover dragexit'.split(' ');

		for (var b = 0, l = blockedEvents.length; b < l; b++) {
			this.dropzone.addEventListener(blockedEvents[b], this.__blockEvent, false);
		}

		var that = this;
		this.dropzone.addEventListener('drop', function(event) {
			that.__handleUpload(event);
		}, false);

	},

	__blockEvent: function(event) {
		event.stopPropagation();
		event.preventDefault();
	},

	__handleUpload: function(event) {

		// Stop bubbling up and prevent default behaviour
		this.__blockEvent(event);

		if (event.dataTransfer && event.dataTransfer.files) {

			var files = event.dataTransfer.files;
			if (files.length) {
				// This is done this way due to sucking callbacks
				for (var f = 0, l = files.length; f < l; f++) {
					this.__startUpload(files[f]);
				}
			}

		}

	},

	__startUpload: function(file) {

		var that = this,
			reader = new FileReader();

		reader.onloadend = function(event) {
			that.__finishUpload(file, event);
		};

		reader.readAsDataURL(file);
		// alternatively: reader.readAsBinaryString(file);

	},

	__finishUpload: function(file, event) {

		this.callback && this.callback({
			name: file.name,
			type: file.type,
			size: file.size,
			data: event.target.result
		});

	}

};

