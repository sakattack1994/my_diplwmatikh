var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//exhibit schema
var exhibitSchema = new Schema({
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
    exhibithint: {
        type: String,
        required: true
    },
    collecttype: {
        type: String,
        required: true
    },
    collectdata: {
        type: String,
        required: true
    },
    coords: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
}, { collection: 'Exhibit'},
    {
    timestamps: true
});

var Exhibit = mongoose.model('Exhibit', exhibitSchema);
module.exports = Exhibit;