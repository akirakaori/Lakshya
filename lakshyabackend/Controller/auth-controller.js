const authService = require("../Services/auth-service");

const signup = async (req, res) => {
  try {
    const { name, email, password, number, role, companyName, location } = req.body;

    const result = await authService.signupService({
      name,
      email,
      password,
      number,
      role,
      companyName,
      location,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("Signup error:", err);
    
    if (err.statusCode) {
      const response = {
        success: err.success !== undefined ? err.success : false,
      };
      response[err.errorField || "error"] = err.message;
      return res.status(err.statusCode).json(response);
    }

    return res.status(500).json({
      error: "Internal server error",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginService({
      email,
      password,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Login error:", err);
    
    if (err.statusCode) {
      const response = {
        success: err.success !== undefined ? err.success : false,
      };
      response[err.errorField || "error"] = err.message;
      return res.status(err.statusCode).json(response);
    }

    return res.status(500).json({
      error: "Internal server error",
      success: false,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPasswordService({
      email,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Forgot password error:", err);
    
    if (err.statusCode) {
      const response = {
        success: err.success !== undefined ? err.success : false,
      };
      response[err.errorField || "error"] = err.message;
      return res.status(err.statusCode).json(response);
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPasswordService({
      email,
      otp,
      newPassword,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Reset password error:", err);
    
    if (err.statusCode) {
      const response = {
        success: err.success !== undefined ? err.success : false,
      };
      response[err.errorField || "error"] = err.message;
      return res.status(err.statusCode).json(response);
    }

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
  resetPassword,
};