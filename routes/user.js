
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

module.exports.findNumber = function(number, cb){
  return User.findOne({number: number}, function (err, user) {
    if (!err) {
      return cb(null, user);
    }
    return cb(err);
  });
};
