const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Business Manager', 'University Student'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  birthday: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: false,
  },
  profilePicture: {
    type: String,
  },
  universityName: String,
  major: String,
  location: String,
  year: String,
  phoneNumber: String,
  business: String,
});


const User = mongoose.model('User', UserSchema);

module.exports = User; 