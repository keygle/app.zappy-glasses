var fs = require('fs'), dao = require('zappy-db'), jsonrpc = require('jsonrpc-client');

var XBMC_DEFAULT_IP = 'localhost';
var PLAYIT_DEFAULT_PORT = 8181;

var handlePlayRequest = function(e) {
	var filePath = e.dataTransfer.files[0].path;
	console.log('Dropped file = ' + filePath)

	fs.exists(filePath, function(exists) {
		if (exists) {

			dao.saveFilePath(filePath, function(successInd, fileId) {
				if (successInd === 1) {
					console.log('Saved file with Id = ' + fileId);
					// Should make PlayIt JSON call here....
					var url = 'http://' + XBMC_DEFAULT_IP + ':'
							+ PLAYIT_DEFAULT_PORT + '/PlayIt';
					var xbmc = jsonrpc.create(url);
					xbmc.call('playZappyVideo', {
						videoId : fileId,
						port : 1212
					}, function(error, response) {
						if (error === null) {
							console.log(response);
						} else {
							console.log(error);
						}
					});
				}

			});
		}
	});
}

var saveGlass = function(glassName, xbmcIPAddr) {
	console.log('Glass name = ' + glassName + ' XBMC IP: ' + xbmcIPAddr);

	var url = 'http://' + xbmcIPAddress + ':' + PLAYIT_DEFAULT_PORT + '/PlayIt';
	var xbmc = jsonrpc.create(url);
	$(document).on("uncaughtException", handleSaveGlassError);

	xbmc.call('ping', {
		request : 'ping'
	}, function(error, response) {
		if (error === null) {
			console.log(response);
			$(document).off("uncaughtException", handleSaveGlassError);
		} else {
			console.log(error);
			$(document).off("uncaughtException", handleSaveGlassError);
		}
	});
}

var handleSaveGlassError = function(e) {
	console.log('Handling HTTP error');
	$('#newProfile').hide();
	$('#holder').show();
	$(document).off("uncaughtException", handleSaveGlassError);
}

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
	if (err != null) {
		console.log(err.stack)
	}
	$.event.trigger({
		type : "uncaughtException",
		message : err,
		time : new Date()
	});
});

// prevent default behavior from changing page on dropped file
window.ondragover = function(e) {
	e.preventDefault();
	return false
};
window.ondrop = function(e) {
	e.preventDefault();
	return false
};

var holder = document.getElementById('holder');
holder.ondragover = function() {
	$("img#zappyGlassImg").attr("src", "img/Zappys-on.png");
	return false;
};
holder.ondragend = function() {
	$("img#zappyGlassImg").attr("src", "img/Zappys-on.png");
	return false;
};

holder.ondrop = function(e) {
	e.preventDefault();
	handlePlayRequest(e);
	$("img#zappyGlassImg").attr("src", "img/Zappys-stream.png");
	return false;
};

$("#saveGlass").click(function() {
	saveGlass($("#inputGlassName").val(), $("#inputXBMCIP").val());
});

function forceNewGlass() {
	$('#closeNewGlassModal').hide();
	var options = {
		backdrop : 'static',
		keyboard : false
	};
	$('#newGlassModal').modal(options);
}

$("#showNewGlassModal").click(function() {
	$('#newGlassModal').modal();
});
