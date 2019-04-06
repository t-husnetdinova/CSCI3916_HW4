var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

//reviews schema
var ReviewSchema = new Schema({
    reviewer_name: { type: String, required: true, index: { unique: true }},
    quote: { type: String, required: true},
    rating: { type: int, required: true}
});

ReviewSchema.pre('save', function(next) {
    next();
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);