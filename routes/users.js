const REGISTRATION_SUCCESSFUL=1;
const ERROR_INPUT_USERNAME=2;
const ERROR_INPUT_PASSWORD=3;
const ERROR_LOGGING_FAILURE=4;
const SUCCESSFUL_LOGIN=5;
const MISSING_TOKEN=6;
const SUCCESSFUL_LOGOUT=7;

var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/Player');
var Verify  = require('./verify_player');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/**
 *route κομμάτι κώδικα που αφορά την εγγραφή των χρηστών στο σύστημα γενικά
 */
router.post('/register', function(req, res) {
  if(!req.body.username){
    return res.send(500, ERROR_INPUT_USERNAME);
  }
  else if(!req.body.password){
    return res.send(500, ERROR_INPUT_PASSWORD);
  }
  else {
    User.register(new User({username: req.body.username}),
        req.body.password, function (err, user) {
          if (err) {
            return res.status(500).json({err: err});
          }
          passport.authenticate('user_auth')(req, res, function () {
            return res.status(200).json({status: REGISTRATION_SUCCESSFUL });
          });
        });
  }
});

/**
 * route κομμάτι κώδικα που κάνει login τους users που έχουν κάνει ήδη εγγραφη στο σύστημα και τους επιστρέφει
 * ένα μοναδικό token με το οποίο μπορούν να έχουν πρόσβαση σε routes του server που απαιτεί authentication
 */
router.post('/login', function(req, res, next) {
  /**
   * ελεγχος της δομης του body του μυνήματος που στέλνουν οι clients για το
   * συγκεκριμένο route
   */
  if(!req.body.username){
    return res.send(500, ERROR_INPUT_USERNAME);
  }
  else if(!req.body.password){
    return res.send(500, ERROR_INPUT_PASSWORD);
  }
  else {
    /**
     * έλεγχος των στοιχείων του χρήστη για εγκυρότητα δεδομένων για πραγματοποίηση
     * του login του user
     */
    passport.authenticate('user_auth', function (err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          err: info
        });
      }
      req.logIn(user, function (err) {
        if (err) {
          return res.status(500).json({
            err: ERROR_LOGGING_FAILURE
          });
        }
        var token = Verify.getToken(user);
        User.update({"username": req.body.username}, {
          $set: {"token": token}
        }, function (err, state) {
          if (err) throw err;
        });
        res.status(200).json({
          status: SUCCESSFUL_LOGIN,
          success: true,
          token: token
        });
      });
    })(req, res, next);
  }
});
/**
 * route που κάνει τη διαδικασία του logout του user
 * στο οποίο πρέπει στο request να περιλαμβάνει στο header το token
 * που του έχει δοθεί
 */
router.get('/logout', function(req, res) {
  if(!req.headers['x-access-token']){
    return res.send(500, MISSING_TOKEN);
  }
  else {
    req.logout();
    res.status(200).json({
      status: SUCCESSFUL_LOGOUT
    });
  }
});

module.exports = router;