var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var mongoose = require('mongoose');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cors());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'Error: a user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'Success: new user created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;
    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if(!user)
        {
            return res.status(403).json({success: false, message: "Error: user not found."});
        }
        if (err) res.send(err);
        else
        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Error: authentication failed.'});
            }
        });


    });
});

router.route('/movies/:movieId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        if(req.query && req.query.reviews && req.query.reviews === "true")
        {
            Movie.aggregate()
                .match({_id: mongoose.Types.ObjectId(req.params.movieId)})
                .lookup({from: 'reviews', localField: '_id', foreignField: 'movie', as: 'reviews'})
                .exec(function(err, movie)
                {
                    if(err)
                    {
                        return res.status(403).json({success: false, message: "Error: movie not found. (with review parameter)"});
                    }
                    else
                    {
                        return res.status(200).json({success: true, message: "Success: movie found! (with review parameter)", movie: movie})
                    }
                })
        }
        else{
            Movie.find({_id: mongoose.Types.ObjectId(req.params.movieId)}).select("title year genre actor").exec(function (err, movie)
            {
                if (err) res.send(err);

                if(movie && movie.length > 0)
                {
                    return res.status(200).json({success: true, message: "Success: movie found! (no review parameter)", movie: movie});
                }
                else
                {
                    return res.status(404).json({success: false, message: "Error: movie not found. (no review parameter)"});
                }
            })
        }
    });

router.route('/movies')
    .post(authJwtController.isAuthenticated, function(req, res)
    {
        if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actor[0] || !req.body.actor[1]
            || !req.body.actor[2])
        {

            res.json({success: false, message: "Error: make sure all fields correctly filled/formatted."});
        }
        else
        {
            var movie = new Movie();
            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.genre = req.body.genre;
            movie.actor = req.body.actor;

            movie.save(function (err)
            {
                if (err)
                {
                    if (err.code === 11000)
                    {
                        return res.json({success: false, message: "Error: a movie with that title already exists."});
                    }
                    else
                    {
                        return res.send(err);
                    }
                }
                res.status(200).send({success: true, message: "Success: new movie added!"});
            });
        }
    })

    .get(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body)
        {
            return res.status(403).json({success: false, message: "Error: an empty query has been provided."});
        }
        else
        {
            if(req.query && req.query.reviews && req.query.reviews === "true")
            {
                Movie.aggregate()
                    .match(req.body)
                    .lookup({from: 'reviews', localField: '_id', foreignField: 'movie', as: 'reviews'})
                    .exec(function(err, movie)
                    {
                        if(err)
                        {
                            return res.status(403).json({success: false, message: "Error: movie not found. (with review parameter)"});
                        }
                        else
                        {
                            return res.status(200).json({success: true, message: "Success: movie found! (with review parameter)", movie: movie})
                        }
                })
            }
            else{
                Movie.find(req.body).select("title year genre actor").exec(function (err, movie)
                {
                    if (err) res.send(err);

                    if(movie && movie.length > 0)
                    {
                        return res.status(200).json({success: true, message: "Success: movie found! (no review parameter)", movie: movie});
                    }
                    else
                    {
                        return res.status(404).json({success: false, message: "Error: movie not found. (no review parameter)"});
                    }
                })
            }
        }
    })
    .put(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body || !req.body.findMovie || !req.body.updateMovieTo)
        {
            return res.status(403).json({success: false, message: "Error: please provide something that can be updated"});
        }
        else
        {
            console.log("FindMovie: " + JSON.stringify(req.body.findMovie));
            console.log("UpdateMovieTo: " + JSON.stringify(req.body.updateMovieTo));
            Movie.updateMany(req.body.findMovie, req.body.updateMovieTo, function(err, doc)
            {
                console.log(JSON.stringify(doc));
                if(err)
                {
                    return res.status(403).json({success: false, message: "Error: cannot update movie."});
                }
                else if(doc.n === 0)
                {
                    return res.status(403).json({success: false, message: "Error: could not find movie to update."});
                }
                else
                {
                    return res.status(200).json({success: true, message: "Success: movie has been updated!"});
                }
            })
        }
    })
    .delete(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body)
        {
            return res.status(403).json({success: false, message: "Error: an empty query has been provided."});
        }
        else
        {
            Movie.deleteOne(req.body, function(err, doc)
            {
                console.log(JSON.stringify(doc));
                if(err)
                {
                    return res.status(403).json({success: false, message: "Error: unable to delete movie."});
                }
                else if(doc.n === 0)
                {
                    return res.status(403).json({success: false, message: "Error: unable to delete movie because it wasn't found."});
                }
                else
                {
                    return res.status(200).json({success: true, message: "Success: movie has been deleted!"});
                }
            })
        }
    })
    .all(function (req, res)
    {
        console.log(req.body);
        res = res.status(403);
        res.send("HTTP method not supported: only GET, POST, PUT, and DELETE requests are supported");
    });

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body.quote || !req.body.rating)
        {
            return res.json({success: false, message: "Error: make sure all fields correctly filled/formatted."});
        }
        else
        {
            var review = new Review();
            //gets authorization from headers and removes first 4 characters (JWT ) so you just have the token
            jwt.verify(req.headers.authorization.substring(4), process.env.SECRET_KEY, function(err, decoded) {
                if(err)
                {
                    return res.status(403).json({success: false, message: "Error: unable to post review."});
                }
                else
                {
                    review.reviewer_id = decoded.id;

                    Movie.findOne({title: req.body.movie_title}, function(err, movie) {
                        if(err)
                        {
                            return res.status(403).json({success: false, message: "Error: unable to post review."});
                        }
                        else if(!movie)
                        {
                            return res.status(403).json({success: false, message: "Error: unable to post review, movie does not exist."});
                        }
                        else
                        {
                            review.movie = movie._id;
                            review.quote = req.body.quote;
                            review.rating = req.body.rating;

                            review.save(function (err)
                            {
                                if(err)
                                {
                                    return res.status(403).json({success: false, message: "Error: unable to post review."});
                                }
                                else {
                                    return res.status(200).send({success: true, message: "Success: new review added!"});
                                }
                            })
                        }
                    })
                }
            })
        }
    })
    .all(function (req, res)
    {
        console.log(req.body);
        res = res.status(403);
        res.send("HTTP method not supported: only POST requests are supported");
    });

router.route('/')
    .all(function(req, res)
    {
        console.log(req.body);
        res = res.status(403);
        res.send("ROOT FAIL! Invalid path/directory!");
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
