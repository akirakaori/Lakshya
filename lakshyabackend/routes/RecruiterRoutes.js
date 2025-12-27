const router = require("express").Router();
const authenticate = require("../Middleware/authMiddleware"); // JWT verify
const authorizeRoles = require("../Middleware/roleMiddleware");
const ROLES = require("../Library/Roles").ROLES;

const { createJob } = require("../Controller/RecruiterController");
router.post(
  "/job",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  createJob
);
module.exports = router;
