/**
 * Αποτελεί το secret key με βάση το οποίο γίνεται η κρυπτογράφηση των tokens για το authorization των users
 * @type {{secretKey: string, mongoUrl: string}}
 */
module.exports = {
    'secretKey': '12345-67890-09876-54321',
    'mongoUrl' : 'mongodb://localhost:27017/ScrabbleGame'
}