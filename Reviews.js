var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

//reviews schema
var ReviewSchema = new Schema({
    reviewer_id: { type: Schema.Types.ObjectId, ref: "UserSchema", required: true},
    movie: { type: Schema.Types.ObjectId, ref: "MovieSchema", required: true},
    quote: { type: String, required: true},
    rating: { type: Number, min: 1, max: 5, required: true}
});

ReviewSchema.pre('save', function(next) {
    next();
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);