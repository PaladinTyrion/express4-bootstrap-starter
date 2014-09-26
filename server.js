// Module dependencies
var path     = require('path');
var fs       = require('fs');
var express  = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config   = require(__dirname + '/app/config/config');
var app      = express();

var configPath = __dirname + '/app/config';
var modelsPath = __dirname + '/app/models';

app.config = config;

// Database
require(configPath + '/database')(app, mongoose);

fs.readdirSync(modelsPath).forEach(function (file) {
  if (~file.indexOf('.js'))
    require(modelsPath + '/' + file);
});

// Passport validation
require(configPath + '/passport')(app, passport);

// express settings
require(configPath + '/express')(app, express, passport);

// create a server instance
// passing in express app as a request event handler
app.listen(app.get('port'), function() {
  console.log("\n✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
