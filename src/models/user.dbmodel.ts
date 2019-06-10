import mongoose from 'mongoose';

export const UserModel = mongoose.model('Users', new mongoose.Schema({

  username:       { type: String, required: true, minlength: 6, maxlength: 32 },
  password:       { type: String, required: true },
  iat:            { type: Number, requried: false },
  admin:          { type: Boolean, required: true },
  accessCode:     { type: String, required: false, minlength: 6, maxlength: 6 },
  accessCodeIat:  { type: Number, required: false }

}));
