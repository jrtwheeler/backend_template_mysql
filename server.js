const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;
const http= require("http").Server(app);

const routes = require("./routes");

const session = require("express-session"); 
// Requiring passport as we've configured it
const passportLog = require("./config/passport"); 
const passport = require("passport");
const fileupload = require("express-fileupload"); 
const isAuthenticated = require("./config/middleware/isAuthenticated");

//Define middleware
const cors = require("cors");
if(process.env.NODE_ENV !== "production"){
  app.options("*", cors());
  app.use(cors());
}

const db = require("./models");
app.use(fileupload());
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(express.static("public"));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

app.use(
  session({ secret: "keyboard cat", resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

app.post("/api/login", passportLog.authenticate("local"), (req, res) => {
  // Sending back a password, even a hashed password, isn't a good idea
  res.json({    
    email: req.user.email,
    id: req.user.id
  });
});

app.post("/api/register", (req, res) => {
  console.log(req.body);
  db.User.create(req.body)
    .then(dbUser => {
      // res.json(dbUser);
      res.redirect(307, "/api/login");
    })
    .catch(err => {
      res.status(401).json(err);
    });
});

// Route for logging user out
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.use(routes);
// Syncing our database and logging a message to the user upon success
db.sequelize.sync().then(() => {
  http.listen(PORT, () => {
    console.log(
      "==> :earth_americas:  Listening on port %s. Visit http://localhost:%s/ in your browser.",
      PORT,
      PORT
    );
  });
});