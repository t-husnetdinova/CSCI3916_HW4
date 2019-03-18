var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

function validateMovieGenre(genre)
{
    return genre === "Action:" || genre === "Adventure" || genre === "Comedy" || genre === "Drama" || genre === "Fantasy" ||
        genre === "Horror" || genre === "Mystery" || genre === "Thriller" || genre === "Western";
}

// user schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    year: { type: String, required: true},
    genre: { type: String, required: true},
    actor:
    [{ ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true}},
     { ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true}},
     { ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true}}
    ]
});

MovieSchema.pre('save', function(next) {
        next();
    });

// return the model
module.exports = mongoose.model('Movie', MovieSchema);