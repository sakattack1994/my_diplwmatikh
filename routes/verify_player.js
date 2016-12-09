var User = require('../models/Player');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config.js');
/**
 * συνάρτηση που δέχεται σαν είσοδο τον χρήστη και κάνει την παραγωγή του token
 * και το επιστρέφει στο login route θέτοντας το χρόνο για να λήξει η ζωή του
 * @param user
 * @returns {*}
 */
exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey, {
        expiresIn: 3600
    });
};
/**
 * συνάρτηση που ελέγχει την εγκυρότητα του token και χρησιμοποιείται από συγκεκριμένα
 * routes τα οποία απαιτουν την εισαγωγή του token στο header του request messsage
 * ώστε να αποκτήσει ο χρήστης έγκυρη πρόσβαση στο συγκεκριμένο route
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.verifyOrdinaryUser = function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.secretKey, function (err, decoded) {
            if (err) {
                var err = new Error('You are not authenticated!');
                err.status = 401;
                return next(err);
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        var err = new Error('No token provided!');
        err.status = 403;
        return next(err);
    }
};