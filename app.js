const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('./models/mongoose');
const User = require('./models/users');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const { ExtractJwt, Strategy } = require('passport-jwt');
// const ExtractJwt = passportJWT.ExtractJwt;
// const Strategy = passportJWT.Strategy;
const jwtSetting = require('./config/jwtSetting');
const jwt = require('jwt-simple');
const cookieParser = require('cookie-parser');


app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cookieParser());

var cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
}

var jwtOptions = {
  secretOrKey: jwtSetting.jwtSecret,
  // jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt")
  jwtFromRequest: cookieExtractor
}



var strategy = new Strategy(jwtOptions, (payload, done) => {
  console.log('payload received, ', payload.id);
  User.findById(payload.id).then((user) => {
    console.log("found users");
    if (user) {
      done(null, user);
    } else {
      done('User not found', null);
    }
  });



  var user = User.findById(payload.id) || null;
  if (user) {
    return done(null, {
      id: user.id
    });
  } else {
    return done(new Error("User not found"), null);
  }
});

passport.use(strategy);

app.get('/', (req, res) => {
  User.find({username: 'lanxiang.wang13@gmail.com'}).then((user) => {
    var payload = {
      foo: 'bar'
    };
    var token = jwt.encode(payload, '123');
    res.cookie('jwtt', token);
    res.send({
      user: user,
      token: token,
      cookie: res.cookie,
      haha: 'yes'
    });
  })
})

// app.get('/test', (req, res) => {
//   res.send(req.cookies.jwt);
// })

app.get('/secret', passport.authenticate('jwt', {session: false}, jwtSetting.secret), (req, res) => {
  res.send("You are good.");
})

app.post('/login', (req, res) => {
  console.log("Catch the request.");
  if (req.body.username && req.body.password) {
    console.log("has username and password.");
    var username = req.body.username;
    var password = req.body.password;
    User.findOne({username: username}).then((user) => {
      console.log(username);
      if (user.password === password) {
        var payload = {
          id: user.id
        }
        var token = jwt.encode(payload, jwtSetting.jwtSecret);
        res.cookie('jwt', token);
        res.status(200).send(token);
      } else {
        res.status(401).send(user.password);
      }
    }).catch((e) => {
      res.status(401).send("Authentication Failed.");
    });
  }
});


app.get('/', (req, res) => {
  res.json({
    text: "Hello, World!"
  });
});

app.post('/register', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    var user = new User({
      username,
      password
    });
    user.save().then(() => {
      console.log('Saved!');
    }).catch((e) => {
      console.log(e);
    });
  }
});

app.listen(3000, () => {
  console.log("Running on Port 3000...");
});

