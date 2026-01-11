const router = require("express").Router();
const authenticate = require("../Middleware/authMiddleware");
const authorizeRoles = require("../Middleware/roleMiddleware");
const ROLES = require("../Library/Roles").ROLES;
const UserModel = require("../models/User");

router.get(
  "/users",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
      res.json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  }
);


module.exports = router;
