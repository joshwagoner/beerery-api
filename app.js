var express = require('express'),
	http = require('http'),
	fs = require('fs'),
	_ = require('underscore'),
	path = require('path'),
	bodyParser = require('body-parser');

var INPUT_CONFIGS_PATH = "/home/pi/highbank/src/beerery/config/inputs.json";
var OUTPUT_CONFIGS_PATH = "/home/pi/highbank/src/beerery/config/outputs.json";
var STATE_FOLDER_PATH = "/home/pi/highbank/src/beerery/state/";

var guid = (function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return function() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	};
})();

function loadJSONFile(path, loaded) {
	if (loaded) {
		fs.readFile(path, function(err, data) {
			if (err) {
				console.log(err);
			}

			loaded(err, data);
		});
	}
}

function respondWithJSON(path, res) {
	loadJSONFile(path, function(err, jsonString) {
		if (err) {
			res.status(404).send('Not found');
		} else {
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.end(jsonString);
		}
	});
}

function updateConfigItem(inputId, path, newConfig, res, next) {
	loadJSONFile(path, function(err, jsonString) {
		if (err) {
			res.status(404).send('Not found');
		} else {
			var config = JSON.parse(jsonString);

			var configItem = _.find(config, function(c) {
				return c.id === inputId;
			});

			if (!configItem) {
				res.status(404).send('Not found');
			} else {
				// merge and save the config
				_.extend(configItem, newConfig);

				fs.writeFile(path, JSON.stringify(config), function(err) {
					if (err) {
						next(err);
					} else {
						res.json(config);
					}
				});
			}
		}
	});
}

function removeConfigItem(inputId, path, newConfig, res, next) {
	loadJSONFile(path, function(err, jsonString) {
		if (err) {
			res.status(404).send('Not found');
		} else {
			var config = JSON.parse(jsonString);

			var configWithout = _.reject(config, function(c) {
				return c.id === inputId;
			});

			if (config.length === configWithout.length) {
				res.status(404).send('Not found');
			} else {
				// save the config
				fs.writeFile(path, JSON.stringify(configWithout), function(err) {
					if (err) {
						next(err);
					} else {
						res.json(configWithout);
					}
				});
			}
		}
	});
}

function addConfigItem(path, newConfigItem, callback) {
	loadJSONFile(path, function(err, jsonString) {
		if (err) {
			callback(err);
		} else {
			var config = JSON.parse(jsonString);

			config.push(newConfigItem);

			fs.writeFile(path, JSON.stringify(config), function(err2) {
				if (err2) {
					callback(err2);
				} else {
					callback();
				}
			});
		}
	});
}

// function socketConnect(socket) {
// 	socket.on("");
// }

var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	next();
};

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(allowCrossDomain);
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.json({
		"beerery-api": {
			version: "0.0.1"
		}
	});
});

app.get("/config/inputs", function(req, res) {
	respondWithJSON(INPUT_CONFIGS_PATH, res);
});

app.get("/config/inputs/:inputId", function(req, res) {
	var inputId = req.params.inputId;

	loadJSONFile(INPUT_CONFIGS_PATH, function(err, jsonString) {
		if (err) {
			res.status(404).send('Not found');
		} else {
			var config = JSON.parse(jsonString);

			var inputConfig = _.find(config, function(c) {
				return c.name === inputId;
			});

			if (!inputConfig) {
				res.status(404).send('Not found');
			} else {
				res.json(inputConfig);
			}
		}
	});
});

app.put("/config/inputs/:inputId", function(req, res, next) {
	var inputId = req.params.inputId;
	var newConfig = req.body;

	//todo: add some validation of the config passed

	updateConfigItem(inputId, INPUT_CONFIGS_PATH, newConfig, res, next);
});

app.post("/config/inputs", function(req, res) {
	// create a new id
	var inputId = guid();
	var newConfig = req.body;

	// add the id to the data sent from the client
	newConfig.id = inputId;

	// save to the input file
	addConfigItem(INPUT_CONFIGS_PATH, newConfig, function(error) {
		if (error) {
			res.status(404).send('Not found');
		} else {
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.end(JSON.stringify(newConfig));
		}
	});
});

app.delete("/config/inputs/:inputId", function(req, res, next) {
	var inputId = req.params.inputId;
	var newConfig = req.body;

	removeConfigItem(inputId, INPUT_CONFIGS_PATH, newConfig, res, next);
});

app.get("/config/outputs", function(req, res) {
	respondWithJSON(OUTPUT_CONFIGS_PATH, res);
});

app.get("/config/outputs/:outputId", function(req, res) {
	var outputId = req.params.outputId;

	loadJSONFile(OUTPUT_CONFIGS_PATH, function(err, jsonString) {
		if (err) {
			res.status(404).send('Not found');
		} else {
			var config = JSON.parse(jsonString);

			var outputConfig = _.find(config, function(c) {
				return c.name === outputId;
			});

			if (!outputConfig) {
				res.status(404).send('Not found');
			} else {
				res.json(outputConfig);
			}
		}
	});
});

app.put("/config/outputs/:outputId", function(req, res, next) {
	var outputId = req.params.outputId;
	var newConfig = req.body;

	//todo: add some validation of the config passed

	updateConfigItem(outputId, OUTPUT_CONFIGS_PATH, newConfig, res);
});

app.get("/inputs/:inputId", function(req, res) {
	var inputId = req.params.inputId;

	respondWithJSON(STATE_FOLDER_PATH + "input_" + inputId + ".json", res);
});

app.get("/outputs/:outputId", function(req, res) {
	var outputId = req.params.outputId;

	respondWithJSON(STATE_FOLDER_PATH + "output_" + outputId + ".json", res);
});

var server = http.createServer(app);
// var io = require('socket.io')(server);

// io.on("connection", socketConnect);

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});