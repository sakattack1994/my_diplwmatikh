var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//WorkOfArt schema
var woaSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
},
    { collection: 'WorkOfArt'},
    {timestamps: true}
    );

var woa = mongoose.model('WorkOfArt', woaSchema);
module.exports = woa;