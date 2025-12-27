const mongoose = require('mongoose');
const ROLES = require('../Library/Roles').ROLES;
const schema = mongoose.Schema;

const userschema = new schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,  
    },
    password: {
        type: String,
        required: true,
         
    },
    number: {
        type:String,
        required: true,
        unique: true,
         
    },
    role: {
    type: String,
    enum: Object.values(ROLES), // job_seeker | recruiter | admin
    required: true,             // must be provided
  },
  resetOTP: String,
  resetOTPExpiry: Date,
  }

);

const UserModel = mongoose.model('User', userschema);
module.exports = UserModel;