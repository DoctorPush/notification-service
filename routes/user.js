
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  androidDeviceID : String,
  iosDeviceID : String,
  number : String
});

var User = mongoose.model('User', userSchema);

/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};
