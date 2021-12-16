var graph = require('./graph');
require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');

const CosmosClient = require('@azure/cosmos').CosmosClient;
const config = require('./config');

var passport = require('passport');
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const admin = require( 'firebase-admin' );
const FirestoreStore = require( 'firestore-store' )(session);

 
const firebase = admin.initializeApp( {
  credential:  admin.credential.cert(path.resolve(__dirname, 'service-key.json')),
  databaseURL: process.env.FIREBASE_DB
} );
 
const database = firebase.firestore();

const endpoint = config.endpoint;
const key = config.key;


// Configure simple-oauth2
const oauth2 = require('simple-oauth2').create({
  client: {
    id: process.env.TOKEN_ID,
    secret: process.env.SECRET
  },
  auth: {
    tokenHost: "https://login.microsoftonline.com/common",
    authorizePath: "/oauth2/v2.0/authorize",
    tokenPath: "/oauth2/v2.0/token"
  }
});

// Callback function called once the sign-in is complete
// and an access token has been obtained
async function signInComplete(iss, sub, profile, accessToken, refreshToken, params, done) {
  if (!profile.oid) {
    return done(new Error("No OID found in user profile."), null);
  }

  try{
    const user = await graph.getUserDetails(accessToken);

    var email =user.mail?(user.mail).toLowerCase():(user.userPrincipalName).toLowerCase();
    console.log(email);

    if (user) {
        // Add properties to profile
        profile['mail'] = user.mail ? user.mail : user.userPrincipalName;
        profile['displayName'] = switchOrder(user.displayName);
        console.log(profile['displayName']);
    }
  } catch (err) {
    done(err, null);
  }

  // Create a simple-oauth2 token from raw tokens
  let oauthToken = oauth2.accessToken.create(params);

  // Save the profile and tokens in user storage
  users[profile.oid] = { profile, oauthToken };
  return done(null, users[profile.oid]);
}

// Configure OIDC strategy
passport.use(new OIDCStrategy(
  {
    identityMetadata: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    clientID: "ecd6cb8d-7e27-459f-9b8a-11389817c2bc",
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: "https://symp2020.azurewebsites.net/auth/callback",
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.CLIENT_SECRET,
    validateIssuer: false,
    passReqToCallback: false,
    scope: "profile user.read".split(' ')
  },
  signInComplete
));

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store:  new FirestoreStore( {
    database: database
  } ),
  secret:            '__session',
  resave:            true,
  saveUninitialized: true,
  unset: 'destroy'
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Flash middleware
app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  next();
});

// view engine setup
console.log(__dirname);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());

app.use(cookieParser());

app.use(function(req, res, next) {
  // Set the authenticated user in the
  // // template locals
  
  if (req.user) {
    res.locals.user = req.user.profile;
  }
  next();
});

app.use('/', indexRouter);
app.use('/auth', authRouter);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  if(req.user){
    res.redirect('/');
  }else{
    req.logout();
    res.redirect('/');
  }
  

});

module.exports = app;

