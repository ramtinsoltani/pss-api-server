import mongoose from 'mongoose';

export const UserModel = mongoose.model('Users', new mongoose.Schema({

  username: { type: String, required: true, minlength: 6, maxlength: 32 },
  password: { type: String, required: true },
  iat:      { type: Number, requried: false },
  admin:    { type: Boolean, required: true }

}));
