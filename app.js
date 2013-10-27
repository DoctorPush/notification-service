var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config.json');
var twilio = require('twilio');
var gcm = require('node-gcm');
var apnagent = require('apnagent'),
    agent = new apnagent.Agent();
var request = require('request');

var app = express();

mongoose.connect("mongodb://" + config.mongo_user + ":" + config.mongo_pw + "@localhost:" + config.mongo_port + "/" + config.mongo_db);

/*
 * Set up iOS Notifications
 */

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
  var env = agent.enabled('sandbox') ? 'sandbox' : 'production';

  console.log('apnagent [%s] gateway connected', env);
});

function sendAPN(iosDeviceID, message, serviceURL){
  agent.createMessage()
    .device(iosDeviceID)
    .alert(message)
    .set('serviceURL', serviceURL)
    .send();
  console.log('Sent iOS notification to ' + iosDeviceID);
  console.log('Message text:' + message);
  console.log('ServiceURL:' + serviceURL);
}

/*
 * Set up Twilio
 */

var twilioClient = new twilio.RestClient('ACc9a9a9039f3702af1cf8de8a65e8100c', '7f15e8cfeab5a5223ddb47e8d069f292');

function sendSMS(phoneNumber, message, serviceURL){
  var toSend = message;
  request(serviceURL, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var data = JSON.parse(body);
      var start = new Date(data.start);
      toSend = message + " Now at " + start.toString('hh:mm');
    }
    twilioClient.sms.messages.create({
      to: phoneNumber,
      from:'2243243397',
      body: toSend
    }, function(error, message) {

      if (!error) {
        console.log('Sent SMS notification to ' + phoneNumber);
        console.log('Success! The SID for this SMS message is:');
        console.log(message.sid);

        console.log('Message sent on:');
        console.log(message.dateCreated);
      }else {
        console.log('Oops! There was an error.');
      }
    });
  });
}

/*
 * Set up Android Notifications
 */

var sender = new gcm.Sender('AIzaSyBVnJ7JSu2NbjKytHrvW1LjtY269kzIsTM');

function sendGCM(androidDeviceID, message, serviceURL) {

  var m = new gcm.Message({
      collapseKey: 'demo',
      delayWhileIdle: true,
      timeToLive: 3,
      data: {
          message: message,
          serviceURL : serviceURL
      }
  });

  sender.send(m, [androidDeviceID], 4, function (err, result) {
    console.log(err || result);
    console.log('Sent Android notification to ' + androidDeviceID);
    console.log('Message text:' + message);
    console.log('ServiceURL:' + serviceURL);
  });
}

function sendMessage(req, res){
  var phoneNumber = req.body.phoneNumber;
  var message = req.body.message;
  var serviceURL = req.body.serviceURL;


  if(!(phoneNumber && message && serviceURL)){
    return res.send("Missing parameter");
  }

  user.findByNumber(phoneNumber, function(err, user){
    if(err){
      return res.send(err);
    }

    if(!user){
      sendSMS(phoneNumber, message, serviceURL);
      res.status(201);
      return res.send(JSON.stringify({ "status": "sent SMS"}));
    }

    if(user.androidDeviceID){
      sendGCM(user.androidDeviceID, message, serviceURL);
    }

    if(user.iosDeviceID){
      sendAPN(user.iosDeviceID, message, serviceURL);
    }

    res.status(201);
    res.send(JSON.stringify({ "status": "sent"}));
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
app.post('/user', user.findOrCreate);
app.post('/message', sendMessage);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
