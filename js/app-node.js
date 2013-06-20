var HTTP_SERVER_PORT = 1212;

var http = require('http'), url = require('url'), filed = require('filed');

var server = http.createServer(function(req, resp) {
	var reqData = url.parse(req.url, true)
	var id = reqData.query.videoId;
	streamFile(id, resp);
});
console.log('Starting new http connection... at ' + HTTP_SERVER_PORT)
server.listen(HTTP_SERVER_PORT);

function streamFile(fileId, resp) {
	console.log('Received request for Id = ' + fileId);
	var dao = require('zappy-db');
	dao.getFilePath(fileId, function(successInd, filePath) {
		console.log('Filepath = ' + filePath);
		if (successInd === 1) {
			filed(filePath).pipe(resp);
		} else {
			resp.writeHead(400);
			resp.end();
		}
	});
}