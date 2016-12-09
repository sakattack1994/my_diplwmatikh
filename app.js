var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var exhibit = require('./models/scrabble_museum_models/exhibit');
var woa = require('./models/scrabble_museum_models/workofart');
var default_keys=require('./models/scrabble_museum_models/Keys');
var fs = require('fs');

var json1 = fs.readFileSync('./public/db_scripts/Scrabble/exhibits.json', 'utf-8');
var json2 = fs.readFileSync('./public/db_scripts/Scrabble/woa.json', 'utf-8');
var json3 = fs.readFileSync('./public/db_scripts/Scrabble/Keys.json', 'utf-8');

mongoose.connect(config.mongoUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Server started successfully.\nConnected to database.");
  exhibit.count(function (err, count) {
    if (!err && count === 0) {
      exhibit.create(JSON.parse(json1), function (err, y) {
        if (err) throw err;
      });
    }
  });
  woa.count(function (err, count) {
    if (!err && count === 0) {
      woa.create(JSON.parse(json2), function (err, y) {
        if (err) throw err;
      });
    }
  });
  default_keys.count(function (err, count) {
    if (!err && count === 0) {
      default_keys.create(JSON.parse(json3), function (err, y) {
        if (err) throw err;
      });
    }
  });
});

var routes = require('./routes/index');
var users = require('./routes/users');
var sessions = require('./routes/sessions');
var scrabble = require('./routes/Scrabble_router');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// passport config User
var User = require('./models/Player');
app.use(passport.initialize());
passport.use('user_auth',new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/sessions', sessions);
app.use('/Scrabble', scrabble);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

module.exports = app;