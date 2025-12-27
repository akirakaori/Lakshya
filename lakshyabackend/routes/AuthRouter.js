const { signup, login } = require('../Controller/AuthController');
const { signupValidation, loginValidation } = require('../Middleware/AuthValidation');
const { forgotPassword, resetPassword } = require('../Controller/AuthController');

const router = require('express').Router();

router.post('/login', loginValidation, login);

router.post('/signup',signupValidation,signup);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;