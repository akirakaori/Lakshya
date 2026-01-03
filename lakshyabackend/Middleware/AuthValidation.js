const joi = require("joi");
const ROLES = require("../Library/Roles").ROLES;

const signupValidation = (req, res, next) => {
  const schema = joi.object({
    name: joi.string().min(3).max(30).required(),

    email: joi.string().email().required(),

    password: joi.string().min(4).max(100).required(),

    number: joi.string().pattern(/^[0-9]{10}$/).required(),

    role: joi
      .string()
      .valid(ROLES.JOB_SEEKER, ROLES.RECRUITER)
      .required(),

    // ✅ Recruiter-only fields
    companyName: joi.when("role", {
      is: ROLES.RECRUITER,
      then: joi.string().min(2).required(),
      otherwise: joi.forbidden(),
    }),

    location: joi.when("role", {
      is: ROLES.RECRUITER,
      then: joi.string().min(2).required(),
      otherwise: joi.forbidden(),
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Bad request",
      error,
    });
  }

  next();
};

const loginValidation = (req, res, next) => {
    const schema = joi.object({
        
        email: joi.string().email().required(),
        password: joi.string().min(4).max(100).required(),
        
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message:" Bad request", error })
    }
    next();
}
module.exports= { 
    signupValidation,
     loginValidation 
};