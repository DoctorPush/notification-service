
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

var config = require('./config.json');

var app = express();

var twilio = require('twilio');
var gcm = require('node-gcm');

var apnagent = require('apnagent'),
    agent = new apnagent.Agent();

mongoose.connect("mongodb://" + config.mongo_user + ":" + config.mongo_pw + "@localhost:" + config.mongo_port + "/" + config.mongo_db);

agent.set('pfx file', './pfx.p12');

agent.enable('sandbox');

agent.connect(function (err) {
  // gracefully handle auth problems
  if (err && err.name === 'GatewayAuthorizationError') {
    console.log('Authentication Error: %s', err.message);
    process.exit(1);
  }

  // handle any other err (not likely)
  else if (err) {
    throw err;
  }

  // it worked!
  var env = agent.enabled('sandbox')
    ? 'sandbox'
    : 'production';

  console.log('apnagent [%s] gateway connected', env);
});

var twilioClient = new twilio.RestClient('ACc9a9a9039f3702af1cf8de8a65e8100c', '7f15e8cfeab5a5223ddb47e8d069f292');

function sendSMS(req,res,next){
  twilioClient.sms.messages.create({
    to:'+491622359650',
    from:'2243243397',
    body:'Yo'
  }, function(error, message) {

    if (!error) {
      console.log('Success! The SID for this SMS message is:');
      console.log(message.sid);

      console.log('Message sent on:');
      console.log(message.dateCreated);
      next();
    }
    else {
      console.log('Oops! There was an error.');
      next();
    }
  });
}

function sendAPN(req,res,next){
  agent.createMessage()
    .device("<30b5b325 80689587 b727149b 0c6b33b0 0eb835d4 0350a5df 15791398 945de832>")
    .alert('Hello Universe!')
    .send();
  console.log('testa');
  next();
}

var sender = new gcm.Sender('AIzaSyBVnJ7JSu2NbjKytHrvW1LjtY269kzIsTM');

function sendGCM(req,res,next) {
  // create a message with default values
  var message = new gcm.Message();

  // or with object values
  var message = new gcm.Message({
      collapseKey: 'demo',
      delayWhileIdle: true,
      timeToLive: 3,
      data: {
          key1: 'message1',
          key2: 'message2'
      }
  });

  sender.send(message, ['APA91bGeIV5CPbkVbCAv0StYikvy9PkXseG25D8XzswKoom9N3TnT-sv8LT00KoIH7xa-uCfErwwTjYTAQ0gLBTx2e9PLWd9WzWJ5SGbf5RtwQqolcAOpiHuyDBYMYZYA1BcNCK0HRwIub326uL_1t2RpPgc3HsAttL9nqGNRysubo0x7IP3etU'], 4, function (err, result) {
    console.log(result);
    next();
  });
}

// all environments
app.set('port', process.env.PORT || 3213);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', sendGCM, routes.index);
app.post('/user', user.findOrCreate);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
