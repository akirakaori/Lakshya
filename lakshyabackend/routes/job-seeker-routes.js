const router = require("express").Router();
const authenticate = require("../Middleware/auth-middleware"); // JWT verify
const authorizeRoles = require("../Middleware/role-middleware");

const ROLES = require("../Library/roles").ROLES;


// Add this function or import from controller
const getProfile = (req, res) => {
  res.json({ message: "Job seeker profile", user: req.user });
};


router.get(
  "/profile",
    authenticate,
  authorizeRoles(ROLES.JOB_SEEKER),
  getProfile
);
module.exports = router;