var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var exhibit = require('../models/scrabble_museum_models/exhibit');
var woa = require('../models/scrabble_museum_models/workofart');
var default_keys=require('../models/scrabble_museum_models/Keys');
var key_states = require('../models/scrabble_museum_models/keys_state');
var session= require('../models/Session');
var player=require('../models/Player');
var Verify = require('./verify');

var dbrouter = express.Router();
dbrouter.use(bodyParser.json());

// LOAD OF WHOLE DATABASE
dbrouter.route('/Create_Session/:sessionId')
    .post(function (req, res, next) {
        var fs = require('fs');
        var json1 = fs.readFileSync('./public/db_scripts/Scrabble/exhibits.json', 'utf-8');
        var json2 = fs.readFileSync('./public/db_scripts/Scrabble/woa.json', 'utf-8');
        var json3 = fs.readFileSync('./public/db_scripts/Scrabble/default_state_keys.json', 'utf-8');
        var json4 = fs.readFileSync('./public/db_scripts/Scrabble/Keys.json', 'utf-8');
        exhibit.create(JSON.parse(json1), function (err, y) {
            if (err) throw err;
        });
        woa.create(JSON.parse(json2), function (err, y) {
            if (err) throw err;
        });
        key_states.create(JSON.parse(json3), function (err, y) {
            if (err) throw err;
        });
        default_keys.create(JSON.parse(json4), function (err, y) {
            if (err) throw err;
        });
        session.create({"session_id":req.params.sessionId,"password":req.body.password,"max_players":req.body.max_players}, function (err, y) {
            if (err) throw err;

        });
        res.write('Creating session.... \nPlease wait\n');
        res.end('Session created succesfully');
    });

//SCAN OF EXHIBIT
dbrouter.route('/Session/scan')
    .post(function (req, res, next) {
        exhibit.findOne({"collectdata":req.body.collectdata}, function (err, exhibit) {
            if (err) throw err;
            player.update({"username" :req.body.username}, {
                $addToSet:{"scanned_exhibits":exhibit.id}
            }, function (err, state) {
                if (err) throw err;
            });
            player.findOne({"username":req.body.username}, function (err, p) {
                if (err) throw err;
                res.end(p.username+" scanned the exhibit with id "+exhibit.id);
            });
        });
    });

//LOCK OF EXHIBIT
dbrouter.route('/Session/lock')
    .put(function (req, res, next) {
        //H KATAXWRHSH TWN STOIXEIWN TOU LOCK
        key_states.update({"key_id" :req.body.key_id}, {
            $set:{ "state": true,"exhibit_id":req.body.exhibit_id, "username":req.body.username}
        }, function (err, state) {
            if (err) throw err;
        });
        //TO MINIMA POU EPISTREFEI KAI ELEGXOS AN HTAN SWSTOS
        var newpoints;
        default_keys.findOne({"key_id" :req.body.key_id}, function (err, rightkey) {
            if (err) throw err;
            key_states.findOne({"key_id" :req.body.key_id}, function (err2, playerkey) {
                if (err2) throw err2;
                if(playerkey.exhibit_id===rightkey.exhibit_id){
                    player.findOne({"username":req.body.username},function (err, p) {
                        if (err) throw err;
                        newpoints= p.points+rightkey.value;
                        res.write(p.username+" wins "+rightkey.value+" points.\n");
                        player.update({"username":req.body.username}, {
                            $set:{ "points": newpoints }
                        }, function (err, state) {
                            if (err) throw err;
                        });
                    });
                }
                player.findOne({"username":req.body.username},function (err, p) {
                    if (err) throw err;
                    res.end("key "+req.body.key_id+" locked with the exhibit "+req.body.exhibit_id+" from "+ p.username);
                });
            });
        });
    });

//UNLOCK OF EXHIBIT
dbrouter.route('/Session/unlock')
    .put(function (req, res, next) {
        //check if the choice was right
        var newpoints;
        default_keys.findOne({"key_id" :req.body.key_id}, function (err, rightkey) {
            if (err) throw err;
            key_states.findOne({"key_id" :req.body.key_id}, function (err2, playerkey) {
                if (err2) throw err2;
                //CHECK IF PLAYER CHOICE WAS WRONG
                if(playerkey.exhibit_id!==rightkey.exhibit_id){
                    player.findOne({"username":req.body.username},function (err, p) {
                        if (err) throw err;
                        newpoints= p.points-3;
                        res.end(p.username+" lost 3 points.");
                        player.update({"username":req.body.username}, {
                            $set:{ "points": newpoints }
                        }, function (err, state) {
                            if (err) throw err;
                        });
                    });
                }
                else{
                    res.end("key "+req.body.key_id+" unlocked.");
                }
                //unlock from the database the key
                key_states.update({"key_id" :req.body.key_id}, {
                    $set:{ "state": false,"exhibit_id":"" }
                }, function (err, state) {
                    if (err) throw err;
                });
            });
        });
    });

//THEME SELECT
dbrouter.route('/Session/theme_select')
    .post(function (req, res, next) {
        woa.find(req.body,{_id:0,id:0}, function (err, exhibit) {
            if (err) throw err;
            res.json(exhibit);
        });
    });

//Join session of a player
dbrouter.route('/Join_Session/:sessionId')
    .post(function (req, res, next) {
        session.findOne({"session_id":req.params.sessionId}, function (err, this_session) {
            if (err) throw err;
            if(req.body.password===this_session.password) {
                if (this_session.max_players > this_session.participants.length){
                    player.update({"username": req.body.username}, {
                        $set: {"session_id": req.params.sessionId}
                    }, function (err, state) {
                        if (err) throw err;
                    });
                    session.update({"session_id": req.params.sessionId}, {
                        $addToSet: {"participants": req.body.username}
                    }, function (err, state) {
                        if (err) throw err;
                    });
                    res.end(req.body.username + " joined session " + req.params.sessionId);
                }
                else{
                    res.end("This session is full you can't enter.");
                }
            }
            else{
                res.end("Wrong password, you can't enter that session.");
            }
        });
    });


module.exports = dbrouter;