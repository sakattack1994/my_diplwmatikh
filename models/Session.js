var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Session Schema
var sessionSchema = new Schema({
    session_name:  {
        type: String,
        required: true,
        unique:true
    },
    password:  {
        type: String,
        required:true
    },
    participants:  {
        type: Array,
        required: false
    },
    max_players:  {
        type: Number,
        required: true
    },
    game:  {
        type: String,
        required: false
    },
    actions:  {
        type: Array,
        required: false
    },
    admin_username:{
        type: String,
        required: false
    },
    admin_password:{
        type: String,
        required: false
    }
}, { collection: 'Session'}, {
    timestamps: true
});
var session = mongoose.model('Session', sessionSchema);
module.exports = session;