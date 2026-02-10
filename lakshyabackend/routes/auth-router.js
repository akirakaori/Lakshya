const { signup, login } = require('../Controller/auth-controller');
const { signupValidation, loginValidation } = require('../Middleware/auth-validation');
const { forgotPassword, resetPassword } = require('../Controller/auth-controller');

const router = require('express').Router();

router.post('/login', loginValidation, login);

router.post('/signup',signupValidation,signup);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;