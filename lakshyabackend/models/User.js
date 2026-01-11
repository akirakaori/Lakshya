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

  // ✅ ADD THESE FIELDS
  companyName: {
    type: String,
    required: function () {
      return this.role === ROLES.RECRUITER;
    }
  },

  location: {
    type: String,
    required: function () {
      return this.role === ROLES.RECRUITER;
    }
  },
  password: {
        type: String,
        required: true,
         
    },

  
  resetOTP: String,
  resetOTPExpiry: Date,
  },
 { timestamps: true }

  

);

const UserModel = mongoose.model('User', userschema);
module.exports = UserModel;