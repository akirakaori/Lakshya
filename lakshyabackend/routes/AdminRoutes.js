const router = require("express").Router();
const authenticate = require("../Middleware/authMiddleware");
const authorizeRoles = require("../Middleware/roleMiddleware");
const ROLES = require("../Library/Roles").ROLES;

router.get(
  "/users",
   authenticate,
  authorizeRoles(ROLES.ADMIN),
  (req, res) => {
    res.json({ message: "Admin can see all users" });
  }
);

module.exports = router;
