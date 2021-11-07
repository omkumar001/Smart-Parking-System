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
const alert = require("alert");

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

passport.use( "google",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:process.env.GOOGLE_URL,
      userProfileURL: process.env.GOOGLE_PROFILE,
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        {
          username: profile.emails[0].value,
          googleId: profile.id,
          nameofUser: profile.displayName,
          photoUrl: profile.photos[0].value,
        },
        function (err, user) {
          pic = profile.photos[0].value;
          email = profile.emails[0].value;
          fname = profile.displayName;
          return cb(err, user);
        }
      );
    }
  )
);
  

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"],
  })
);

app.get(
  "/auth/google/dashboard",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    const uname = email.substring(0, email.indexOf("@"));
    res.redirect("/dashboard/" + uname);
  }
);

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

            const username = email.substring(0, email.indexOf("@"));

            res.render("dashboard", {
              picUrl: pic,
              fname: fname,
              email: email,
              vehicleList: vehicles,
              usename : username,
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


 //For spotpark part
 var parkLocation="";

app
.route("/spotpark/:uname")
.get(function (req, res) {

 User.find({ success: { $ne: null } }, function (err, foundUsers) {
 if (err) {
 console.log(err);
  } else {
  if (foundUsers) {
  
    Land.find({ success: { $ne: null } }, function (err, foundSlot) {
      if (err) {
        console.log(err);
      } else {
        const uname = email.substring(0, email.indexOf("@"));
         res.render("spotpark", { slot:foundSlot ,usename :uname ,}); 
         }
    });

      } //if ends
    } //else ends
  });
 })
  .post(function (req, res) {
    parkLocation=req.body.plocation;
    const uname = email.substring(0, email.indexOf("@"));
    res.redirect("/slotbook/"+uname );
    });



    //Creating Booking Schema
    const bookingSchema = new mongoose.Schema({
      vehicleType: String,
      vehicleNumber: String,
      ownername : String,
      parkLocation: String,
      parkCharges: Number,
      chargePort: String
    });
    
    const Booking= new mongoose.model("Booking", bookingSchema);
    bookingSchema.plugin(findOrCreate);

//For E-Vehicle charging port
var cPort = "No";
app
.route("/slotbook/:uname")
.get(function (req, res) {
 User.find({ success: { $ne: null } }, function (err, foundUsers) {
 if (err) {
 console.log(err);
  } else {
   var name= foundUsers[0].nameofUser;
   const uname = email.substring(0, email.indexOf("@"));
  if (foundUsers) {

    Vehicle.find({ owner: email}, function (err, foundVehicles) {
      if (err) {
        console.log(err);
      } else {

        Land.findOne({ location: parkLocation }, function (errr, foundLoc) {
          if (errr) {
            console.log(errr);
          } else {
            res.render("slotbook", { vechile:foundVehicles ,ownername :name , usename:uname, parkLoc : foundLoc});      
          }
        }); 
      }
    });

      } //if ends
    } //else ends
  });
 })
  .post(function (req, res) {

    const vTypeNo = req.body.typeNo;
    const booking = new Booking({
      vehicleType: vTypeNo.substring(0,vTypeNo.indexOf("(")),
      vehicleNumber: vTypeNo.substring(vTypeNo.indexOf("( ")+1, vTypeNo.indexOf(" )")),
      ownername: req.body.owner,
      parkLocation: req.body.location,
      parkCharges: req.body.pType,
      chargePort: req.body.chargePort
    });

    Booking.create(booking, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        //console.log(booking.chargePort);
        if (booking.chargePort !== undefined) {
          if (booking.chargePort == "Yes") {
            cPort = "Occupied";
          } else {
            cPort = "Yes";
          }          
        }

        Land.findOneAndUpdate({ location: parkLocation }, { $inc: { nSlot: -1 }, eVCharge: cPort} , function (errr, result) {
          if (errr) {
            console.log(errr);
          } else {
            alert("Parking Slot Booked!");
            const uname = email.substring(0, email.indexOf("@"));
            res.redirect("/dashboard/" + uname);
          }
        });    
      }
    });
    });

  //------------------------------------------------ USER ROUTING ENDS -----------------------------------------------------


  
  // ---------------------------- Land Owner Schema Starts ---------------------------

  const landownerSchema = new mongoose.Schema({
    username: String,
    ownerpass: String,
    ownergoogleId: String,
    nameofOwner: String,
    ownerphotoUrl: String,
  });
  
  landownerSchema.plugin(passportLocalMongoose);
  landownerSchema.plugin(findOrCreate);
  
  const LandOwner = new mongoose.model("LandOwner", landownerSchema);
  
  //////////////// Land Schema /////////////////
  const LandSchema = new mongoose.Schema({
    nSlot:  Number,
    ncharge1: Number,
    ncharge2:  Number,
    ncharge3:  Number,
    location: String,
    lowner: String,
    eVCharge: String
  });
  
  const Land = new mongoose.model("Land", LandSchema);
  LandSchema.plugin(findOrCreate);
  
  var ownpic = "",
    ownemail = "",
    ownfname = "";
  /////////////// Google Sign In /////////////////

  passport.use( "google-alt",
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:process.env.GOOGLE_URL_LAND ,
        userProfileURL: process.env.GOOGLE_PROFILE,
      },
      function (accessToken, refreshToken, profile, cb) {

        LandOwner.findOrCreate(
          {
            username: profile.emails[0].value,
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
    "/auth/google/landowner",
    passport.authenticate("google-alt", {
      scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"],
    })
  );
  
  app.get(
    "/auth/google/landowner_dash",
    passport.authenticate("google-alt", { failureRedirect: "/login_landowner" }),
    function (req, res) {
      // Successful authentication, redirect to secrets.
      const oname = ownemail.substring(0, ownemail.indexOf("@"));
      res.redirect("/landowner_dash/" + oname);
    }
  );
 
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



//   app
//   .route("/spotpark")
//   .get(function (req, res) {

//    Land.find({ success: { $ne: null } }, function (err, foundSlot) {
//       if (err) {
//         console.log(err);
//       } else {
//          res.render("spotpark", { slot:foundSlot });  }
//     })
//  })
//   .post(function (req, res) {
//     // const vehicle = new Vehicle({
//     //   vehicleType: req.body.vType,
//     //   vehicleNumber: req.body.vNumber,
//     //   owner: email,
//     });


//   app.get("/slotbook", function (req, res) {
//     res.render("slotbook");
//   });
  
  


app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
