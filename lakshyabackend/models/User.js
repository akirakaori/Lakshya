const mongoose = require('mongoose');
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
    // role: {
    //   type: String,
    //   enum: ['jobseeker'],
    //   default: 'jobseeker'
    // }
  },
//   { timestamps: true }
);

const UserModel = mongoose.model('User', userschema);
module.exports = UserModel;