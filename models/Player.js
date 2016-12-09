var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

//player schema
var playerSchema = new Schema({
        username: {
            type: String,
            unique:true
        },
        password: {
            type: String
        },
        points:{
            type: Number,
            required: false,
            default: 0
        },
        scanned_exhibits:{
            type: Array,
            required: false
        },
        admin:   {
            type: Boolean,
            default: false
        },
        session_id:{
            type: String,
            required: false
        }
    },
    { collection: 'Player'},
    {timestamps: true}
);

playerSchema.plugin(passportLocalMongoose);
var player = mongoose.model('Player', playerSchema);
module.exports = player;