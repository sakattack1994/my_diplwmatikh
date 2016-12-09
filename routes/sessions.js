var express = require('express');
var router = express.Router();
var Session = require('../models/Session');
var Verify_player  = require('./verify_player');
var player=require('../models/Player');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.route('/create_new')
    .post(Verify_player.verifyOrdinaryUser, function(req, res) {
        Session.create({"session_id":req.body.session_id,"password":req.body.password,"max_players":req.body.max_players,"admin_username":req.body.admin_username,"admin_password":req.body.admin_password}, function (err,y) {
            if (err) throw err;
            res.end("The session with id "+req.body.session_id+" was successfully created.");
        });
});

router.route('/join')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        Session.findOne({"session_id":req.body.session_id}, function (err, this_session) {
            if (err) throw err;
            if(req.body.password===this_session.password) {
                if (this_session.max_players > this_session.participants.length){
                    player.update({"username": req.body.username}, {
                        $set: {"session_id": req.body.session_id}
                    }, function (err, state) {
                        if (err) throw err;
                    });
                    Session.update({"session_id": req.body.session_id}, {
                        $addToSet: {"participants": req.body.username}
                    }, function (err, state) {
                        if (err) throw err;
                    });
                    res.end(req.body.username + " joined session " + req.body.session_id);
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

router.route('/quit')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        player.update({"username": req.body.username}, {
            $set: {"session_id": ""}
        }, function (err, state) {
            if (err) throw err;
        });
        Session.update({"session_id": req.body.session_id}, {
            $pull: {"participants": req.body.username}
        }, function (err, state) {
            if (err) throw err;
        });
        res.end(req.body.username + " left the session " + req.body.session_id);
    });

router.route('/delete')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        Session.findOne({"session_id":req.body.session_id}, function (err, this_session) {
            if (err) throw err;
            if(this_session.admin_username===req.body.admin_username && this_session.admin_password===req.body.admin_password) {
                Session.remove({"session_id": req.body.session_id}, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    res.end("Session " + req.body.session_id + " was deleted.");
                });
                player.update({"session_id": req.body.session_id}, {
                    $set: {"session_id": ""}
                }, {
                    multi: true
                }, function (err, state) {
                    if (err) throw err;
                });
            }
            else{
                res.end("You have no administrator privileges. You can't delete the session.");
            }
        });
    });

module.exports = router;