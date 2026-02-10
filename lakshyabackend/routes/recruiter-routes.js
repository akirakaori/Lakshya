const router = require("express").Router();
const authenticate = require("../Middleware/auth-middleware"); // JWT verify
const authorizeRoles = require("../Middleware/role-middleware");
const ROLES = require("../Library/roles").ROLES;

const { createJob } = require("../Controller/recruiter-controller");
router.post(
  "/job",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  createJob
);
module.exports = router;
