
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  androidDeviceID : String,
  iosDeviceID : String,
  number : String
});

var User = mongoose.model('User', userSchema);

module.exports.findById = function(id, cb){
  return User.findById(id, function (err, user) {
    if (!err) {
      return cb(null, user);
    }
    return cb(err);
  });
};

module.exports.findByNumber = function (number, cb){
  return User.findOne({number: number}, function (err, user) {
    if (!err) {
      return cb(null, user);
    }
    return cb(err);
  });
};

module.exports.findOrCreate = function (req, res) {
  if(!req.body.number){
    return res.send("No phone number specified");
  }
  module.exports.findByNumber(req.body.number, function(err, user){
    if (err) {
      return res.send(err);
    }

    var entry;
    if(!user){
      entry = new User({
        androidDeviceID : req.body.android,
        iosDeviceID : req.body.ios,
        number : req.body.number
      });
    }else{
      user.androidDeviceID = req.body.android || user.androidDeviceID;
      user.iosDeviceID = req.body.ios || user.iosDeviceID;
      entry = user;
    }

    entry.save(function (err) {
      if (err) {
        res.status(400);
        console.log(err);
        res.send({"status": "error"});
      } else {
        res.status(201);
        res.send(JSON.stringify({ "status": "created", "_id": entry._id }));
      }
    });
  });
};
