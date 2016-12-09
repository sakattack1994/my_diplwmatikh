const SESSION_CREATION_SUCCESSFUL=1;
const ERROR_INPUT_USERNAME=2;
const ERROR_INPUT_PASSWORD=3;
const ERROR_INPUT_SESSION_NAME=4;
const ERROR_INPUT_MAX_PLAYERS=5;
const ERROR_INPUT_ADMIN_USERNAME=6;
const ERROR_INPUT_ADMIN_PASSWORD=7;
const ERROR_PLAYER_NOT_EXIST_TO_DATABASE=8;
const ERROR_WRONG_ADMIN_NAME_OF_THIS_SESSION=9;
const ERROR_WRONG_TOKEN=10;
const ERROR_SESSION_NOT_FOUND=11;
const SUCCESSFULLY_JOINED_SESSION=12;
const ERROR_FULL_SESSION_CANT_ENTER=13;
const ERROR_WRONG_PASSWORD=14;
const SUCCESSFULLY_LEFT_THE_SESSION=15;
const ERROR_PLAYER_DOESNT_BELONG_TO_SESSION=16;
const SUCCESSFULLY_SESSION_DELETED=17;
const ERROR_NO_ADMIN_PRIVILEGIES=18;

var express = require('express');
var router = express.Router();
var Session = require('../models/Session');
var Verify_player  = require('./verify_player');
var player=require('../models/Player');
var key_states = require('../models/scrabble_museum_models/keys_state');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});
/**
 * route που αφορά την δημιουργία ενός session από κάποιον χρήστη που υπάρχει ήδη στο σύστημα
 * ΔΟΜΗ request:
 *
 * session_name:ονομα του session
 * password:κωδικος για πρόσβαση στο session
 * max_players:μέγιστος αριθμος χρηστών στο session
 * admin_username:ονομα του user που φτιαχνει το session
 * admin_password:κωδικος ώστε να έχει δικαίωμα σαν administrator να μπορει αργότερα να το διαγράψει
 */
router.route('/create_new')
    .post(Verify_player.verifyOrdinaryUser, function(req, res) {
        /**
         * ελεγχος της δομης του body του μυνήματος που στέλνουν οι clients για το
         * συγκεκριμένο route
         */
        if(!req.body.session_name){
            return res.send(500, ERROR_INPUT_SESSION_NAME);
        }
        else if(!req.body.password){
            return res.send(500, ERROR_INPUT_PASSWORD);
        }
        else if(!req.body.max_players){
            return res.send(500, ERROR_INPUT_MAX_PLAYERS);
        }
        else if(!req.body.admin_username){
            return res.send(500, ERROR_INPUT_ADMIN_USERNAME);
        }
        else if(!req.body.admin_password){
            return res.send(500, ERROR_INPUT_ADMIN_PASSWORD);
        }
        else {
            /**
             * ελέγχει αν ο χρήστης που πάει να δημιουργήσει το session υπάρχει στο σύστημα οπότε έχει
             * όντως token και έχει το δικαίωμα να μπορέσει να το δημιουργήσει
             */
            player.findOne({"username": req.body.admin_username}, function (err, this_player) {
                if (!this_player) {
                    return res.send(500, ERROR_PLAYER_NOT_EXIST_TO_DATABASE);
                }
                else if (this_player.token != req.headers['x-access-token'])
                    res.end(ERROR_WRONG_TOKEN);
                else {
                    var fs = require('fs');
                    Session.create({
                        "session_name": req.body.session_name,
                        "password": req.body.password,
                        "max_players": req.body.max_players,
                        "admin_username": req.body.admin_username,
                        "admin_password": req.body.admin_password
                    }, function (err, y) {
                        if (err) throw err;
                    });
                    var json = fs.readFileSync('./public/db_scripts/Scrabble/default_state_keys.json', 'utf-8');
                    key_states.create(JSON.parse(json), function (err, y) {
                        if (err) throw err;
                        key_states.update({"session_name": "-"}, {
                            $set: {"session_name": req.body.session_name}
                        }, {
                            multi: true
                        }, function (err, state) {
                            if (err) throw err;
                        });
                    });
                    res.end(SESSION_CREATION_SUCCESSFUL);
                }
            });
        }
});
/**
 * route μέσα από το οποίο ο user κάνει join σε κάποιο session και στην ουσία πρέπει να
 * έχει το κατάλληλο token και να ξέρει το κωδικό (αν έχει) για να εισέλθει στο session
 * * ΔΟΜΗ request:
 *
 * session_name:ονομα του session
 * password:κωδικος για πρόσβαση στο session
 * username:ονομα του user που θέλει να εισέλθει στο session
 */
router.route('/join')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        /**
         * ελεγχος της δομης του body του μυνήματος που στέλνουν οι clients για το
         * συγκεκριμένο route
         */
        if(!req.body.session_name){
            return res.send(500, ERROR_INPUT_SESSION_NAME);
        }
        else if(!req.body.password){
            return res.send(500, ERROR_INPUT_PASSWORD);
        }
        else if(!req.body.username){
            return res.send(500, ERROR_INPUT_USERNAME);
        }
        else {
            /**
             * ελέγχει αν ο χρήστης που πάει να εισέλθει στο session υπάρχει στο σύστημα οπότε έχει
             * όντως token και έχει το δικαίωμα να μπορέσει να μπει σε αυτό
             */
            player.findOne({"username": req.body.username}, function (err, this_player) {
                if (!this_player) {
                    return res.send(500, ERROR_PLAYER_NOT_EXIST_TO_DATABASE);
                }
                else if(this_player.token!= req.headers['x-access-token'])
                    res.end(ERROR_WRONG_TOKEN);
                else {
                    Session.findOne({"session_name": req.body.session_name}, function (err, this_session) {
                        if (err) throw err;
                        if (!this_session) {
                            return res.send(500, ERROR_SESSION_NOT_FOUND);
                        }
                        else {
                            if (req.body.password === this_session.password) {
                                if (this_session.max_players > this_session.participants.length) {
                                    player.update({"username": req.body.username}, {
                                        $set: {"session_name": req.body.session_name}
                                    }, function (err, state) {
                                        if (err) throw err;
                                    });
                                    Session.update({"session_name": req.body.session_name}, {
                                        $addToSet: {"participants": req.body.username}
                                    }, function (err, state) {
                                        if (err) throw err;
                                    });
                                    res.end(SUCCESSFULLY_JOINED_SESSION);
                                }
                                else {
                                    res.end(ERROR_FULL_SESSION_CANT_ENTER);
                                }
                            }
                            else {
                                res.end(ERROR_WRONG_PASSWORD);
                            }
                        }
                    });
                }
            });
        }
});
/**
 * το συγκεκριμενο route δινει τη δυνατότητα να απποχωρήσει από κάποιο session
 * * ΔΟΜΗ request:
 *
 * session_name:ονομα του session
 * admin_username:ονομα του user που θέλει να βγει από το session
 */
router.route('/quit')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        /**
         * ελεγχος της δομης του body του μυνήματος που στέλνουν οι clients για το
         * συγκεκριμένο route
         */
        if(!req.body.session_name){
            return res.send(500, ERROR_INPUT_SESSION_NAME);
        }
        else if(!req.body.username){
            return res.send(500, ERROR_INPUT_USERNAME);
        }
        else {
            Session.findOne({"session_name": req.body.session_name}, function (err, this_session) {
                if (err) throw err;
                if (!this_session) {
                    return res.send(500, ERROR_SESSION_NOT_FOUND);
                }
                else {
                    player.findOne({"username": req.body.username}, function (err, this_player) {
                        if (!this_player) {
                            return res.send(500, ERROR_PLAYER_NOT_EXIST_TO_DATABASE);
                        }
                        else if(this_player.token != req.headers['x-access-token'])
                            res.end(ERROR_WRONG_TOKEN);
                        else {
                            if(this_player.session_name==this_session.session_name) {
                                player.update({"username": req.body.username}, {
                                    $set: {"session_name": ""}
                                }, function (err, state) {
                                    if (err) throw err;
                                });
                                Session.update({"session_name": req.body.session_name}, {
                                    $pull: {"participants": req.body.username}
                                }, function (err, state) {
                                    if (err) throw err;
                                });
                                res.end(SUCCESSFULLY_LEFT_THE_SESSION);
                            }
                            else{
                                res.end(ERROR_PLAYER_DOESNT_BELONG_TO_SESSION);
                            }
                        }
                    });
                }
            });
        }
    });
/**
 * το συγκεκριμένο route δίνει τη δυνατότητα σε κάποιον που έχει administrator privileges στο
 * συγκεριμένο session μονο αυτός με βάση τα στοιχεία που έχει δώσει μπορεί να το διαγράψει
 * * ΔΟΜΗ request:
 *
 * session_name:ονομα του session που θέλει ο user να διαγραφθεί
 * admin_username:ονομα του user που έχει το δικαίωμα να διαγράψει το session
 * admin_password:κωδικος ώστε να έχει δικαίωμα σαν administrator να μπορει να το διαγράψει
 */
router.route('/delete')
    .post(Verify_player.verifyOrdinaryUser,function(req, res, next) {
        /**
         * ελεγχος της δομης του body του μυνήματος που στέλνουν οι clients για το
         * συγκεκριμένο route
         */
        if(!req.body.session_name){
            return res.send(500, ERROR_INPUT_SESSION_NAME);
        }
        else if(!req.body.admin_username){
            return res.send(500, ERROR_INPUT_ADMIN_USERNAME);
        }
        else if(!req.body.admin_password){
            return res.send(500, ERROR_INPUT_ADMIN_PASSWORD);
        }
        else {
            player.findOne({"username": req.body.admin_username}, function (err, this_player) {
                if (!this_player) {
                    return res.send(500, ERROR_WRONG_ADMIN_NAME_OF_THIS_SESSION);
                }
                else if (this_player.token != req.headers['x-access-token'])
                    res.end(ERROR_WRONG_TOKEN);
                else {
                    Session.findOne({"session_name": req.body.session_name}, function (err, this_session) {
                        if (err) throw err;
                        if (!this_session) {
                            return res.send(500, ERROR_SESSION_NOT_FOUND);
                        }
                        else {
                            if (this_session.admin_username === req.body.admin_username && this_session.admin_password === req.body.admin_password) {
                                Session.remove({"session_name": req.body.session_name}, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    res.end(SUCCESSFULLY_SESSION_DELETED);
                                });
                                player.update({"session_name": req.body.session_name}, {
                                    $set: {"session_name": ""}
                                }, {
                                    multi: true
                                }, function (err, state) {
                                    if (err) throw err;
                                });
                                key_states.remove({"session_name": req.body.session_name}, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            else {
                                res.end(ERROR_NO_ADMIN_PRIVILEGIES);
                            }
                        }
                    });
                }
            });
        }
    });

module.exports = router;