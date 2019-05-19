const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const creds = process.argv[2].split(':');
const userModel = mongoose.model('Users', new mongoose.Schema({

  username: { type: String, required: true, minlength: 6, maxlength: 32 },
  password: { type: String, required: true },
  iat:      { type: Number, requried: false },
  admin:    { type: Boolean, required: true }

}));

mongoose.connect('mongodb://localhost:27017/pss', { useNewUrlParser: true })
.then(() => {

  console.log('Connected to MongoDB...');

  return bcrypt.hash(creds[1], 10);

})
.then(hash => {

  creds[1] = hash;

  const user = new userModel({
    username: creds[0],
    password: creds[1],
    admin: true
  });

  return user.save();

})
.then(() => {

  console.log('Admin created');
  process.exit();

})
.catch(console.log);
