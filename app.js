require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_SERVER, {useNewUrlParser: true , useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String, 
    nameofUser: String,
    photoUrl: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

var pic = "";
/////////////// Google Sign In /////////////////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_URL,
    userProfileURL: process.env.GOOGLE_PROFILE
  },
  function(accessToken, refreshToken, profile, cb) {
      //console.log(profile);
      User.findOrCreate({username: profile.emails[0].value,
                        googleId: profile.id,
                        nameofUser: profile.displayName, 
                        photoUrl: profile.photos[0].value}, function (err, user) {
        pic = profile.photos[0].value;
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"] })
);

app.get("/auth/google/success", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/success");
});

/////////////// Log Out /////////////////
app.get("/logout", function(req, res){
    req.logout();
    res.redirect('/');
});

/////////////// Log In /////////////////
app.route("/login") 
.get(function(req,res){
    res.render("login");
})

.post(function(req,res){
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            alert("Invalid Email or Password!!!");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/success");
            });
        }
    });
});

/////////////// Register /////////////////
app.route("/register")
.get(function(req,res){
    res.render("register");
})

.post(function(req,res){

   User.register({username: req.body.username, nameofUser: req.body.nameofuser}, req.body.password,function(err,user){
       if(err){
           alert("User already exist");
           res.redirect("/register");
       }else{
           passport.authenticate("local")(req, res, function () {
               pic = "";
               res.redirect("/success");
           });
       }
   });

});

app.get("/success", function(req,res){
    
    User.find({"success": {$ne : null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render("success",{picUrl: pic});
            }
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000.");
});