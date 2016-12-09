var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var key_state_schema = new Schema({
    key_id: {
        type: String,
        required: true,
        unique: true
    },
    state: {
        type: Boolean,
        required: true
    },
    exhibit_id: {
        type: String,
        required: false
    },
    player_id:{
        type: String,
        required: false
    }
}, { collection: 'Key_State'},
    {
    timestamps: true
});

var Key_State = mongoose.model('Key_State', key_state_schema);

// make this available to our Node applications
module.exports = Key_State;