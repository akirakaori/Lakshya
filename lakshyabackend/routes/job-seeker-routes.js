const router = require("express").Router();
const authenticate = require("../Middleware/auth-middleware"); // JWT verify
const authorizeRoles = require("../Middleware/role-middleware");
const { getJobMatch, analyzeJobMatch, getJobMatchScores } = require("../Controller/job-match-controller");

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

/**
 * @route   POST /api/job-seeker/jobs/match-scores
 * @desc    Get cached match scores for multiple jobs (batch)
 * @access  Private (Job Seeker only)
 */
router.post(
  "/jobs/match-scores",
  authenticate,
  authorizeRoles(ROLES.JOB_SEEKER),
  getJobMatchScores
);

/**
 * @route   GET /api/job-seeker/jobs/:jobId/match
 * @desc    Get cached match analysis for a specific job (with isOutdated flag)
 * @access  Private (Job Seeker only)
 */
router.get(
  "/jobs/:jobId/match",
  authenticate,
  authorizeRoles(ROLES.JOB_SEEKER),
  getJobMatch
);

/**
 * @route   POST /api/job-seeker/jobs/:jobId/analyze
 * @desc    Compute fresh match analysis for a specific job
 * @access  Private (Job Seeker only)
 */
router.post(
  "/jobs/:jobId/analyze",
  authenticate,
  authorizeRoles(ROLES.JOB_SEEKER),
  analyzeJobMatch
);

module.exports = router;