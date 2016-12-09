var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Key Schema
var keySchema = new Schema({
    key_id:  {
        type: String,
        required: true,
        unique:true
    },
    exhibit_id:  {
        type: String,
        required: true
    },
    value:  {
        type: Number,
        required: true
    },
    key_text:  {
        type: String,
        required: true
    },
    key_hint:  {
        type: String,
        required: true
    }
}, { collection: 'Default_keys'}, {
    timestamps: true
});

var keys = mongoose.model('Keys', keySchema);
module.exports = keys;