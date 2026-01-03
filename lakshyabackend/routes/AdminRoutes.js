const router = require("express").Router();
const authenticate = require("../Middleware/authMiddleware");
const authorizeRoles = require("../Middleware/roleMiddleware");
const ROLES = require("../Library/Roles").ROLES;

router.get(
  "/users",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    const users = await UserModel.find().select("-password");
    res.json({
      success: true,
      users,
    });
  }
);


module.exports = router;
