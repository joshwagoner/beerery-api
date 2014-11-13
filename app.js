var express = require('express'),
	http = require('http'),
	fs = require('fs'),
	_ = require('underscore'),
	path = require('path'),
	bodyParser = require('body-parser');

var INPUT_CONFIGS_PATH = "config/inputs.json";
var OUTPUT_CONFIGS_PATH = "config/outputs.json";

function loadJSONFile(path, loaded){
	if (loaded){
		fs.readFile(path, function(err, data) {
			if (err) {
				console.log(err);
			}

	        loaded(err, data);
	    });
	}
}

function respondWithJSON(path, res){
	loadJSONFile(path, function(err, jsonString){
		if (err){
			res.status(404).send('Not found');
		}
		else {
			res.writeHead(200, {
		        'Content-Type':'application/json'
		    });
		 	res.end(jsonString); 
		 }
	});
}

function updateConfigItem(inputId, path, newConfig, res){
	loadJSONFile(path, function(err, jsonString){
		if (err){
			res.status(404).send('Not found');
		}
		else {
			var config = JSON.parse(jsonString);

			var configItem = _.find(config, function(c){
				return c.name === inputId;
			});

			if (!configItem){
				res.status(404).send('Not found');
			}
			else {
				// merge and save the config
				_.extend(configItem, newConfig);

				fs.writeFile(path, JSON.stringify(config), function(err){
					if (err){
						next(err);
					}
					else {
						res.json(config); 
					}
				});
			 }
		 }
	});
}

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.json({
    	"beerery-api":{
    		version: "0.0.1"
    	}
    });
});

app.get("/config/inputs", function(req, res) {
	respondWithJSON(INPUT_CONFIGS_PATH, res);
});

app.get("/config/inputs/:inputId", function(req, res) {
	var inputId = req.params.inputId;

	loadJSONFile(INPUT_CONFIGS_PATH, function(err, jsonString){
		if (err){
			res.status(404).send('Not found');
		}
		else {
			var config = JSON.parse(jsonString);

			var inputConfig = _.find(config, function(c){
				return c.name === inputId;
			});

			if (!inputConfig){
				res.status(404).send('Not found');
			}
			else {
			 	res.json(inputConfig); 
			 }
		 }
	});
});

app.post("/config/inputs/:inputId", function(req, res, next) {
	var inputId = req.params.inputId;
	var newConfig = req.body;

	//todo: add some validation of the config passed

	updateConfigItem(inputId, INPUT_CONFIGS_PATH, newConfig, res);
});

app.get("/config/outputs", function(req, res) {
	respondWithJSON("config/outputs.json", res);
});

app.get("/config/outputs/:outputId", function(req, res) {
	var outputId = req.params.outputId;

	loadJSONFile(OUTPUT_CONFIGS_PATH, function(err, jsonString){
		if (err){
			res.status(404).send('Not found');
		}
		else {
			var config = JSON.parse(jsonString);

			var outputConfig = _.find(config, function(c){
				return c.name === outputId;
			});

			if (!outputConfig){
				res.status(404).send('Not found');
			}
			else {
			 	res.json(outputConfig); 
			 }
		 }
	});
});

app.post("/config/outputs/:outputId", function(req, res, next) {
	var outputId = req.params.outputId;
	var newConfig = req.body;

	//todo: add some validation of the config passed

	updateConfigItem(outputId, OUTPUT_CONFIGS_PATH, newConfig, res);
});

app.get("/inputs/:inputId", function(req, res) {
	var inputId = req.params.inputId;

	respondWithJSON("state/input_" + inputId + ".json", res);
});

app.get("/outputs/:outputId", function(req, res) {
	var outputId = req.params.outputId;

	respondWithJSON("state/output_" + outputId + ".json", res);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});