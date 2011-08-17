


var fs = require('fs'),
	http = require('http'),
	path = require('path');

var server = http.createServer(function(request, response) {


	var successfullyDelivered = false,
		query = request.url.split(/\//);

	switch(query[1]) {


		case 'api':

			console.log('-----------------');
			for (var i in request) {
				if (typeof request[i] == 'function') continue;
				console.log('----\n----\n')
				console.log(i, request[i]);
			}
			console.log('-----------------');

			response.end('NOT IMPLEMENTED');
		break;

		// static, but templated content
		case 'control':
		case 'play':
			// Check user session
			response.end('NOT IMPLEMENTED');
		break;



		// static html content
		case 'dashboard':
		case 'edit':
		case 'license':
		case 'login':
		case 'mobile':
		case 'tour':
		case 'portal':

			path.exists('./html/' + query[1] + '.html', function(exists) {
				if (exists) {
					fs.readFile('./html/' + query[1] + '.html', function(error, content) {

						if (!error) {

							response.writeHead(200, {
								'Content-Type': 'text/html'
							});
							response.end(content);

							successfullyDelivered = true;

						}

					});
				}
			})

		break;



		// static assets
		case 'favicon.ico':
			fs.readFile('./favicon.ico', function(error, data) {
				if (!error) {
					response.writeHead(200, {
						'Content-Type': 'image/x-icon'
					});
					response.end(data, 'binary');
				}
			});
		break;

		case 'css':
		case 'js':

			path.exists('.' + request.url, function(exists) {

				if (exists) {
					fs.readFile('.' + request.url, function(error, data) {
					   if (!error) {

							var contentType = 'text/html';
							switch(path.extname(request.url)) {

								case '.js': contentType = 'text/javascript'; break;
								case '.css': contentType = 'text/css'; break;
								case '.htc': contentType = 'text/x-component'; break;
								case '.png': contentType = 'image/png'; break;

							}

							response.writeHead(200, {
								'Content-Type': contentType
							});
							response.end(data, 'binary');

							successfullyDelivered = true;

					   }
					});
				}

			});
		break;

	}


}).listen(1337);
