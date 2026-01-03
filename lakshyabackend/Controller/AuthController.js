const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const ROLES = require('../Library/Roles').ROLES;
const sendEmail = require("../Library/sendEmails");
const crypto = require("crypto");


const signup = async (req, res) => {
   try{
    const { name, email, password, number, role, companyName, location } = req.body;

    const user = await UserModel.findOne({email});
    const ALLOWED_SIGNUP_ROLES = [
      ROLES.JOB_SEEKER,
      ROLES.RECRUITER,
    ];
    if (!role || !ALLOWED_SIGNUP_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        error: "Invalid role for signup",
      });
    }
    if (role === ROLES.RECRUITER) {
      if (!companyName || !location) {
        return res.status(400).json({
          success: false,
          message: "Company name and location are required for recruiters",
        });
      }
    }
    if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Admin signup is not allowed",
      });
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error: "User already exists",
        success: false,
      });
    }
    const userModel = new UserModel({name, email, password, number,role, companyName: role === ROLES.RECRUITER ? companyName : undefined,
  location: role === ROLES.RECRUITER ? location : undefined,});
    userModel.password = await bcrypt.hash(password, 10);
    
    await userModel.save();
    return res.status(201)
        .json({
            message:"User registered successfully",
            success:true
        })

   } catch (err){
    console.error("Signup error:", err);
    return res.status(500)
    .json({
        error:"Internal server error",
        success:false});

   }
}

const login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await UserModel.findOne({email});
        const errorMsg = "Auth failed, email or password is wrong";
        if(!user){
            return res.status(403).json({message:errorMsg ,success:false});
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if(!isPassEqual){
            return res.status(403)
                .json({message:errorMsg ,success:false});
        }
        const jwtToken = jwt.sign(
                    {email: user.email, id: user._id,role: user.role}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: '1h'}
                )
        return res.status(200)
            .json({
                message:"Login successful",
                success:true,
                jwtToken,
                email: user.email,
                name: user.name,
                role: user.role
            });   /////////added the semi column
    } catch (err){
        console.error("Login error:", err);
        return res.status(500)
        .json({
            error:"Internal server error",
            success:false});
    }
}

//for the forgot password functionality

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
// Generate NEW OTP every time (send or resend)
    const otp = crypto.randomInt(100000, 999999).toString();

    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail(
      user.email,
      "Password Reset OTP",
      `Your OTP is ${otp}. It will expire in 10 minutes.`
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
 //reset password functionality

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findOne({ email });
    if (
      !user ||
      user.resetOTP !== otp ||
      user.resetOTPExpiry < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = { 
    signup,
    login,
    forgotPassword,
  resetPassword
};