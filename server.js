const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const passport = require("passport");
const session = require('express-session');
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.set("views", path.resolve(__dirname, "views"));
require('dotenv').config()

app.listen(3000)

function isLoggedIn(req, res, next){
  req.user ? next() : res.sendStatus(401);
}


// Below is the implementation of login page
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

app.get('/', (req, res)=>{
    res.render('login.ejs')
})

app.post("/", async function (req, res) {
    let { email, password } = req.body;
    let rst = await lookUp(email, password);
    if (rst == -1) {
      res.render("error");
    } else {
      res.send(`<h1>Hello ${rst.name}</h1>`);
    }
  });
  
app.get('/error', (req, res)=>{
    res.render('error.ejs')
})

app.get('/register', (req, res)=>{
    res.render('register.ejs')
})


app.post("/welcome", async function (req, res) {
    let { name, email, password } = req.body;
    let variables = {
      name: name,
      email: email,
      password: password
    };

    res.send(`<h1>Hello ${variables.name}</h1>`);
    await insert(variables);
  });

  app.get('/',(req, res)=>{
    res.sendFile('index.html');
})

// I linked the page to my mongodb 
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const data = process.env.MONGO_DB_NAME;
const coll = process.env.MONGO_COLLECTION;
const uri = `mongodb+srv://${userName}:${password}@cluster0.whrrl.mongodb.net/?retryWrites=true&w=majority`;

async function insert(value) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  await client.connect();
  const result = await client.db(data).collection(coll).insertOne(value);
}

async function lookUp(emailaddr, pwd) {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    await client.connect();
    let filter = { email: emailaddr, password: pwd };
    const result = await client.db(data).collection(coll).findOne(filter);
    if (result) {
      return result;
    } else {
      return -1;
    }
  }

// Below is the how I login using google. I implement it with passport
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    done(null, profile);
  }
));

passport.serializeUser((user, done)=>{
    done(null,user)
})

passport.deserializeUser((user, done)=>{
    done(null,user)
})
app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }))

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/auth/protected',
        failureRedirect: '/auth/google/failure'
}));

app.get('/auth/google/failure', (req, res)=>{
    res.send("failure");
})

app.get('/auth/protected', isLoggedIn, (req, res)=>{
    let name = req.user.displayName;
    res.send(`<h1>Hello ${name}</h1>`);
})


  

