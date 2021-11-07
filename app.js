require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_SERVER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Land Schema  -----------------------------------------------------

// const landrequestSchema = new mongoose.Schema({
//   charge1: Number,
//   charge2:Number,
//   charge3: Number,
//   sNumber:Number,
//   location: String,
// });
//
// const LandRequest = new mongoose.model("LandRequest", landrequestSchema);

const landSchema = new mongoose.Schema({
  charge1: Number,
  charge2:  Number,
  charge3:  Number,
  sNumber: Number,
  location: String

});

const Land = new mongoose.model("Land", landSchema);
landSchema.plugin(findOrCreate);

var ownpic = "",
  ownemail = "",
  ownfname = "";


// User Schema  -----------------------------------------------------

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  nameofUser: String,
  photoUrl: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//Admin login
passport.use(new GoogleStrategy({
        clientID: "710954828474-s3fhnps69b4g3p4kr499tr91qcnsgmr3.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "http://localhost:3000/auth/google/admin",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile.displayName);
        console.log(profile);

    },

));


app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile", "email"] })
);


app.get("/auth/google/admin",
    passport.authenticate('google', { failureRedirect: "/admin" }),
    function(req, res) {

        res.redirect("/admin");
    });


//////////////// Vehicle Schema /////////////////
const vehicleSchema = new mongoose.Schema({
  vehicleType: String,
  vehicleNumber: String,
  owner: String,
});

const Vehicle = new mongoose.model("Vehicle", vehicleSchema);
vehicleSchema.plugin(findOrCreate);

var pic = "",
  email = "",
  fname = "";
/////////////// Google Sign In /////////////////



// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.CLIENT_ID,
//       clientSecret: process.env.CLIENT_SECRET,
//       callbackURL:process.env.  GOOGLE_URL,
//       userProfileURL: process.env.GOOGLE_PROFILE,
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       //console.log(profile);
//       User.findOrCreate(
//         {
//           username: profile.emails[0].value,
//           googleId: profile.id,
//           nameofUser: profile.displayName,
//           photoUrl: profile.photos[0].value,
//         },
//         function (err, user) {
//           pic = profile.photos[0].value;
//           email = profile.emails[0].value;
//           fname = profile.displayName;
//           return cb(err, user);
//         }
//       );
//     }
//   )
// );

// Post Request

app.post("/addLand", function (req, res) {

  const land = new Land({
    charge1: req.body.Charge1,
    charge2: req.body.Charge2,
    charge3: req.body.Charge3,
    sNumber: req.body.sNumber,
    location: req.body.Location
  });
// console.log(landrequest);
  land.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('data saved');
      // res.redirect("/admin");
    }
  });
  res.redirect('/admin');
});


app.get("/admin", function (req, res) {

  Land.find({}, function (err, data) {
    if (data !== null) {
      // console.log(data);
      // console.log(data);
      res.render("admin", { land: data });
    }
    else {
      console.log("there is a error");
    }
  });
});


app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"],
  })
);

// app.get(
//   "/auth/google/dashboard",
//   passport.authenticate("google", { failureRedirect: "/login" }),
//   function (req, res) {
//     // Successful authentication, redirect to secrets.
//     const uname = email.substring(0, email.indexOf("@"));
//     res.redirect("/dashboard/" + uname);
//   }
// );

/////////////// Log Out /////////////////
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

/////////////// Log In /////////////////
app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })

  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, function (err) {
      if (err) {
        alert("Invalid Email or Password!!!");
      } else {
        passport.authenticate("local")(req, res, function () {
          pic = "https://bootdey.com/img/Content/avatar/avatar7.png";
          email = user.username;
          User.findOne({ username: email }, function (errr, foundUser) {
            if (errr) {
              console.log(err);
            } else {
              fname = foundUser.nameofUser;
            }
          });
          const uname = email.substring(0, email.indexOf("@"));
          res.redirect("/dashboard/" + uname);
        });
      }
    });
  });

/////////////// Register /////////////////
app
  .route("/admin")
  .get(function (req, res) {
    res.render("admin");
  })

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })

  .post(function (req, res) {
    User.register(
      { username: req.body.username, nameofUser: req.body.nameofuser },
      req.body.password,
      function (err, user) {
        if (err) {
          alert("User already exist");
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            email = user.username;
            pic = "https://bootdey.com/img/Content/avatar/avatar7.png";
            User.findOne({ username: email }, function (errr, foundUser) {
              if (!errr) {
                fname = foundUser.nameofUser;
              } else {
                console.log(err);
              }
            });
            const uname = email.substring(0, email.indexOf("@"));
            res.redirect("/dashboard/" + uname);
          });
        }
      }
    );
  });

app.route("/dashboard/:uname").get(function (req, res) {
  User.find({ success: { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        Vehicle.find({ owner: email }, function (errr, vehicles) {
          if (errr) {
            console.log(errr);
          } else {
            res.render("dashboard", {
              picUrl: pic,
              fname: fname,
              email: email,
              vehicleList: vehicles,
            });
          }
        });
      }
    }
  });
});


app
  .route("/addVehicle")
  .get(function (req, res) {
    res.render("addVehicle");
  })
  .post(function (req, res) {
    const vehicle = new Vehicle({
      vehicleType: req.body.vType,
      vehicleNumber: req.body.vNumber,
      owner: email,
    });

    Vehicle.create(vehicle, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        const uname = email.substring(0, email.indexOf("@"));
        res.redirect("/dashboard/" + uname);
      }
    });
  });



  //------------------------------------------------ USER ROUTING ENDS -----------------------------------------------------





  // ---------------------------- Land Owner Schema Starts ---------------------------

  const landownerSchema = new mongoose.Schema({
    owneruname: String,
    ownerpass: String,
    ownergoogleId: String,
    nameofOwner: String,
    ownerphotoUrl: String,
  });

  landownerSchema.plugin(passportLocalMongoose);
  landownerSchema.plugin(findOrCreate);

  const LandOwner = new mongoose.model("LandOwner", landownerSchema);

  passport.use(LandOwner.createStrategy());

  passport.serializeUser(function (landOwner, done) {
    done(null, landOwner.id);
  });

  passport.deserializeUser(function (id, done) {
    LandOwner.findById(id, function (err, owner) {
      done(err, owner);
    });
  });

  //////////////// Land Schema /////////////////
  // const LandSchema = new mongoose.Schema({
  //   nSlot:  Number,
  //   ncharge1: Number,
  //   ncharge2:  Number,
  //   ncharge3:  Number,
  //   location: String,
  //   lowner: String
  // });
  //
  // const Land = new mongoose.model("Land", LandSchema);
  // LandSchema.plugin(findOrCreate);
  //
  // var ownpic = "",
  //   ownemail = "",
  //   ownfname = "";
  /////////////// Google Sign In /////////////////

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:process.env.GOOGLE_URL ,
        userProfileURL: process.env.GOOGLE_PROFILE,
      },
      function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);

        LandOwner.findOrCreate(
          {
            owneruname: profile.emails[0].value,
            ownergoogleId: profile.id,
            nameofOwner: profile.displayName,
            ownerphotoUrl: profile.photos[0].value,
          },
          function (err, owner) {
            ownpic = profile.photos[0].value;
            ownemail = profile.emails[0].value;
            ownfname = profile.displayName;
            return cb(err, owner);
          }
        );
      }
    )
  );



  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"],
    })
  );

  app.get(
    "/auth/google/dashboard",
    passport.authenticate("google", { failureRedirect: "/login_landowner" }),
    function (req, res) {
      // Successful authentication, redirect to secrets.
      const oname = ownemail.substring(0, ownemail.indexOf("@"));
      res.redirect("/landowner_dash/" + oname);
    }
  );

  /////////////// Log Out /////////////////
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  /////////////// Log In /////////////////
  app
    .route("/login_landowner")
    .get(function (req, res) {
      res.render("login_landowner");
    })

    .post(function (req, res) {

      const owner = new LandOwner({
        ownname: req.body.ownername,
        ownpassword: req.body.ownerpass,
      });

      req.login(owner, function (err) {
        if (err) {
          alert("Invalid Email or Password!!!");
        } else {
          passport.authenticate("local")(req, res, function () {
            ownpic = "https://bootdey.com/img/Content/avatar/avatar7.png";
            ownemail = owner.ownname;
            LandOwner.findOne({  ownname: ownemail },
              function (errr, foundOwner) {
              if (errr) {
                console.log(err);
              } else {
                ownfname = foundOwner. nameofOwner;
              }
            });
            const oname = ownemail.substring(0, ownemail.indexOf("@"));
            res.redirect("/landowner_dash/" + oname);
          });
        }
      });
    });

  /////////////// Register /////////////////
  // app
  //   .route("/register")
  //   .get(function (req, res) {
  //     res.render("register");
  //   })

  //   .post(function (req, res) {
  //     User.register(
  //       { username: req.body.username, nameofUser: req.body.nameofuser },
  //       req.body.password,
  //       function (err, user) {
  //         if (err) {
  //           alert("User already exist");
  //           res.redirect("/register");
  //         } else {
  //           passport.authenticate("local")(req, res, function () {
  //             email = user.username;
  //             pic = "https://bootdey.com/img/Content/avatar/avatar7.png";
  //             User.findOne({ username: email }, function (errr, foundUser) {
  //               if (!errr) {
  //                 fname = foundUser.nameofUser;
  //               } else {
  //                 console.log(err);
  //               }
  //             });
  //             const uname = email.substring(0, email.indexOf("@"));
  //             res.redirect("/dashboard/" + uname);
  //           });
  //         }
  //       }
  //     );
  //   });

  app.route("/landowner_dash/:oname").get(function (req, res) {
    LandOwner.find({ success: { $ne: null } }, function (err, foundOwners) {
      if (err) {
        console.log(err);
      } else {
        if (foundOwners) {
          Land.find({ lowner: ownemail }, function (errr, lands) {
            if (errr) {
              console.log(errr);
            } else {
              res.render("landowner_dash", {
                picUrl: ownpic,
                fname: ownfname,
                email: ownemail,
               LandList: lands,
              });
            }
          });
        }
      }
    });
  });

  app
    .route("/addLand")
    .get(function (req, res) {
      res.render("addLand");
    })
    .post(function (req, res) {
      const land = new Land({
        nSlot: req.body.sNumber,
        ncharge1: req.body.Charge1,
        ncharge2: req.body.Charge2,
        ncharge3: req.body.Charge3,
        location:req.body.Location,
        lowner: ownemail,
      });

      Land.create(land, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          const oname = ownemail.substring(0, ownemail.indexOf("@"));
          res.redirect("/landowner_dash/" + oname);
        }
      });
    });



  //-------------------------------------LAND OWNER ENDS ---------------------------------



  app
  .route("/spotpark")
  .get(function (req, res) {

   Land.find({ success: { $ne: null } }, function (err, foundSlot) {
      if (err) {
        console.log(err);
      } else {
         res.render("spotpark", { slot:foundSlot });  }
    })
 })
  .post(function (req, res) {
    // const vehicle = new Vehicle({
    //   vehicleType: req.body.vType,
    //   vehicleNumber: req.body.vNumber,
    //   owner: email,
    });





  // app.get("/login_landowner", function (req, res) {
  //   res.render("login_landowner");
  // });

  // app.get("/landowner_dash", function (req, res) {
  //   res.render("landowner_dash");
  // });


  // app.get("/addLand", function (req, res) {
  //   res.render("addLand");
  // });



  // app.get("/spotpark", function (req, res) {
  //   res.render("spotpark");
  // });

  app.get("/slotbook", function (req, res) {
    res.render("slotbook");
  });

  // app.post("/spotpark", function (req, res) {
  // });


  app.get("/slotpark", function (req, res) {
    res.sendFile(__dirname + "/Index.html");
  });




app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
