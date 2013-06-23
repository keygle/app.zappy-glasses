var dao = null, fs = require('fs'), jsonrpc = require('jsonrpc-client');
var zappyGlasses = undefined;


var setGlass = function (index) {
	$("#glassGroup").show();
	var glass = zappyGlasses[index];
	$("#holder").hide();
	$("#holder").data("glass", glass);
	$("#glassTitle").html("");
	
	if (zappyGlasses.length === 1) {
		$("#prevGlass").data("index", 0);
		$("#nextGlass").data("index", 0);
	} else {
		if (index === (zappyGlasses.length - 1)) {
			$("#nextGlass").data("index", 0);
			$("#prevGlass").data("index", index - 1);
		} else {
			$("#nextGlass").data("index", index + 1);
			if (index === 0) {
				$("#prevGlass").data("index", (zappyGlasses.length - 1));
			}
		}
	}
	$("#holder").removeClass("glassImgStream").addClass("glassImg");
	$("#holder").slideDown('slow',function(){
		$("#glassTitle").html(glass.name).delay(1000).fadeIn(2000);
	});
}

var loadGlasses = function (){
	dao.getAllZappyGlasses(function(successInd, glasses) {
		if (successInd === 1) {
			console.log("Successfully retrieved the data from database. glasses = " + glasses);
			if (glasses === undefined || glasses.length == 0) {
				zappyGlasses = new Array();
				setTimeout(function() {
						forceNewGlass();
					}, 1000);
			} else {
				zappyGlasses = glasses;
				setGlass(0);
			}
		} else {
			console.log("Failed to retrieve the data from database.");
		}
	});
}

var handlePlayRequest = function(e) {
	var filePath = e.originalEvent.dataTransfer.files[0].path;
	var fileName = e.originalEvent.dataTransfer.files[0].name;
	if(fileName.length > 40){
		fileName = fileName.substring(0, 18).concat('...').concat(fileName.substring(fileName.length - 18, fileName.length));
	}
	console.log('Dropped file = ' + filePath);
	addStatusLine('File dropped: ' + fileName);
	
	fs.exists(filePath, function(exists) {
		if (exists) {

			dao.saveFilePath(filePath, function(successInd, fileId) {
				if (successInd === 1) {
					console.log('Saved file with Id = ' + fileId);
					var glass = $("#holder").data("glass");
					// Should make PlayIt JSON call here....
					var url = 'http://' + glass.ip + ':'
							+ glass.port + '/PlayIt';
					$(document).on("uncaughtException", handlePlaybackError);
					_sendingStatus = addStatusLine('<i class="icon-spinner"></i> Sending file details to <strong>' + glass.name + '</strong>', -1, false);
					
					var xbmc = jsonrpc.create(url);
					xbmc.call('playZappyVideo', {
						videoId : fileId,
						port : 1212
					}, function(error, response) {
						$(document).off("uncaughtException", handlePlaybackError);
						if (error === null) {
							console.log(response);
							setTimeout(function() {
									$("#holder").removeClass("glassImgStream").addClass("glassImg");
								}, 5000);
							$("#holder").removeClass("glassImgOn").addClass("glassImgStream");
							_sendingStatus.fadeOut(1000,function(){
								addStatusLine('Media playback started!', 1);
							});
							
						} else {
							console.log(error);
							_sendingStatus.fadeOut(1000,function(){
								addStatusLine('Failed to playback file: ' + fileName, 0);
							});
							
							$("#holder").removeClass("glassImgOn").addClass("glassImg");
						}
					});
				}

			});
		}else{
			addStatusLine('File doesn\'t exist: ' + fileName, 0);
		}
	});
}

var saveGlass = function(glassName, xbmcIPAddress, playItPort) {
	console.log('Glass name = ' + glassName + ' XBMC IP: ' + xbmcIPAddress
			+ ' PlayIt port:' + playItPort);
	
	if($.trim(glassName) == '' || $.trim(xbmcIPAddress) == '' || $.trim(playItPort) == ''){
		$("#errorLabel").html("All input fields are required, please provide valid values.");
		$("#errorLabel").show().delay(5000).fadeOut(3000);
		$("#saveGlass").removeClass("disabled");
		return;
	}

	var url = 'http://' + xbmcIPAddress + ':' + playItPort + '/PlayIt';
	var xbmc = jsonrpc.create(url);
	$(document).on("uncaughtException", handleSaveGlassError);

	xbmc.call('ping', {
		request : 'ping'
	}, function(error, response) {
		console.log("after ping called");
		$(document).off("uncaughtException", handleSaveGlassError);
		
		if (error === null && response !== undefined && response.response !== undefined && response.response == "pong") {
			console.log("ping successful!");
			console.log(response);

			dao.getExistingZappyGlass(xbmcIPAddress, playItPort, function(
					successInd, existingGlass) {
				if(successInd === 1 && existingGlass !== undefined && existingGlass != null){
					console.log("Found an existing glass with name = "
							+ existingGlass.name);
					
					$("#errorLabel").html("Glass already exists with name: <strong>" + existingGlass.name + "</strong>");
					$("#errorLabel").show().delay(5000).fadeOut(3000);
					$("#saveGlass").removeClass("disabled");
				}else{
					var glass = {};
					glass.name = glassName;
					glass.ip = xbmcIPAddress;
					glass.port = playItPort;

					dao.saveZappyGlass(glass, function(successInd, addedGlass) {
						if (successInd === 1) {
							console.log("New glass has been added.");
							$('#closeGlassModal').show();
							$('#closeGlassModal').click();
							setGlass(zappyGlasses.push(addedGlass) - 1);
							addStatusLine('New glass added: <strong>' + glassName + '</strong>', 1);
						} else {
							console.log("Failed to add new glass in database.");
							$("#errorLabel").html("Failed to add in database, contact ajdeveloped@gmail.com");
							$("#errorLabel").show().delay(5000).fadeOut(3000);
							$("#saveGlass").removeClass("disabled");
						}
					});
				}
			});

		} else {
			console.log(error);
			$("#errorLabel").html(
					"IP address or PlayIt port is incorrect. XBMC should be running.");
			$("#errorLabel").show().delay(5000).fadeOut(3000);
			$("#saveGlass").removeClass("disabled");
		}
	});
}

var deleteGlass = function(glass){
	console.log('Going to delete glass for Id = ' + glass._id);
	$(document).on("uncaughtException", handleDeleteGlassError);
	dao.deleteZappyGlass(glass._id, function(successInd) {
		$(document).off("uncaughtException", handleDeleteGlassError);
		if(successInd === 1){
			$('#closeGlassModal').click();
			addStatusLine('Glass deleted : <strong>' + glass.name + '</strong>', 1);
			$("#glassGroup").hide();
			loadGlasses();
		}else if(successInd === 2){
			$('#closeGlassModal').click();
			addStatusLine('Glass not found : <strong>' + glass.name + '</strong>', 0);
			$("#glassGroup").hide();
			loadGlasses();
		}else{
			console.log("Failed to delete glass in database.");
			$("#errorLabel").html("Failed to remove from database, contact ajdeveloped@gmail.com");
			$("#errorLabel").show().delay(5000).fadeOut(3000);
			$("#deleteGlass").removeClass("disabled");
		}
	});
}

var handleSaveGlassError = function(e) {
	console.log('Handling unexpected error');
	$(document).off("uncaughtException", handleSaveGlassError);
	$("#errorLabel")
			.html(
					"IP address or PlayIt port is incorrect. XBMC should be running.");
	$("#errorLabel").show().delay(5000).fadeOut(3000);
	$("#saveGlass").removeClass("disabled");
}

var handleDeleteGlassError = function(e) {
	console.log('Handling unexpected error');
	$(document).off("uncaughtException", handleDeleteGlassError);
	$("#errorLabel")
			.html(
					"Unable to delete Zappy's Glass profile.");
	$("#errorLabel").show().delay(5000).fadeOut(3000);
	$("#deleteGlass").removeClass("disabled");
}

var handlePlaybackError = function(e) {
	console.log('Handling unexpected error');
	$(document).off("uncaughtException", handlePlaybackError);
	_sendingStatus.fadeOut(1000,function(){
		addStatusLine('Unable to reach XBMC. Please start XBMC and try again.', 0);
	});
	$("#holder").removeClass("glassImgOn").addClass("glassImg");
}

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
	if (err != null) {
		console.log(err.stack)
	}
	$(document).triggerHandler({
		type : "uncaughtException"
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

$("#holder,#holder *").on({
	dragover: function() {
		return false;
	},
	dragend: function() {
		return false;
	},
	dragenter: function() {
		console.log('On drag enter...');
		setTimeout(function(){
			$("#holder").removeClass("glassImg").addClass("glassImgOn");
		}, 1);
		return false;
	},
	dragleave: function() {
		console.log('On drag leave...');
		$("#holder").removeClass("glassImgOn").addClass("glassImg");
		return false;
	},
	drop: function(e) {
		e.preventDefault();
		handlePlayRequest(e);
		return false;
	},
	click: function(){
		console.log('Open in edit mode');
		showEditGlassContent();
		$('#closeGlassModal').show();
		$('#glassModal').modal();
		var glass = $("#holder").data("glass");
		$('#glassName').html(glass.name);
		$('#XBMCIP').html(glass.ip);
		$('#playItPort').html(glass.port);
		$("#deleteGlass").removeClass("disabled");
		$('#deleteGlass').data('glass', glass);
	}
});


$("#deleteGlass").click(
		function() {
			$("#deleteGlass").addClass("disabled");
			deleteGlass($("#deleteGlass").data('glass'));
		});

$("#saveGlass").click(
		function() {
			$("#saveGlass").addClass("disabled");
			saveGlass($("#inputGlassName").val(), $("#inputXBMCIP").val(), $(
					"#inputPlayItPort").val());
		});

function forceNewGlass() {
	showNewGlassContent();
	$('#closeGlassModal').hide();
	var options = {
		backdrop : 'static',
		keyboard : false
	};
	$('#glassModal').modal(options);
	
	$("#errorLabel").removeClass('text-error').addClass('text-info');
	$("#errorLabel").html(
	"Please create a glass to start using it. XBMC should be running.");
	$("#errorLabel").show().delay(5000).fadeOut(3000, function(){
		$("#errorLabel").removeClass('text-info').addClass('text-error');
	});
	$("#saveGlass").removeClass("disabled");
}

$("#showNewGlassModal").click(function() {
	showNewGlassContent();
	$('#closeGlassModal').show();
	$('#glassModal').modal();
});

$("#prevGlass").click(function(){
	setGlass($("#prevGlass").data("index"));
});

$("#nextGlass").click(function(){
	setGlass($("#nextGlass").data("index"));
});

var _loading = $('<h2 class="tile-text hide"><i class="icon-spinner icon-spin"></i> Loading...</h2>');
function displayLoading() {
	$('#statusId').html(_loading.hide().fadeIn(2000));
}

function hideLoading() {
	_loading.fadeOut(2000, function(){
		$('#statusId').addClass('status-tile');
	});
}

var _lastStatusTileType = 'tile-blue';
var _lastLine = '';
function addStatusLine(line, type, substr) {
	if(line == _lastLine){
		console.log('skip duplicate status line');
		return;
	}
	if((substr === undefined || substr) && line.length > 58){
		line = line.substring(0, 55).concat('...');
	}
	var textType = 'text-white';
	var iconType = '';
	var tileType = 'tile-blue';
	if (type !== undefined){
		if (type === 1){
			iconType = 'text-success';
			tileType = 'tile-green';
		}else if (type === 0){
			iconType = 'text-error';
			tileType = 'tile-red';
		}
	}
	if(tileType != _lastStatusTileType){
		$('#statusTile').removeClass(_lastStatusTileType).addClass(tileType);
		_lastStatusTileType = tileType;
	}
	var statusLine = $('<p class="text-white"><small><i class="icon-caret-right '+iconType+'"></i> '+line+'</small></p>');
	$('#statusId').prepend(statusLine.hide().fadeIn(2000));
	return statusLine;
}


$('#statusTile').click(function(){
	$('#statusTile').removeClass(_lastStatusTileType).addClass('tile-blue');
	$('#statusId').html('');
});

$(document).ready(function() {
	dao = require('zappy-db');
	displayLoading();
	dao.messenger.on('dbready', function (dbname) {
		console.log('db ready after load: ' + dbname);
		if(dbname == 'profiles'){
			hideLoading();
			loadGlasses();
		}
	});
});


function showNewGlassContent(){
	$('#new-glass-header').show();
	$('#new-glass-body').show();
	$('#new-glass-footer').show();
	$('#edit-glass-header').hide();
	$('#edit-glass-body').hide();
	$('#edit-glass-footer').hide();
	
	$('#inputGlassName').val('');
	$('#inputXBMCIP').val('');
	$('#inputPlayItPort').val('8181');
	$("#saveGlass").removeClass("disabled");
}

function showEditGlassContent(){
	$('#new-glass-header').hide();
	$('#new-glass-body').hide();
	$('#new-glass-footer').hide();
	$('#edit-glass-header').show();
	$('#edit-glass-body').show();
	$('#edit-glass-footer').show();
}