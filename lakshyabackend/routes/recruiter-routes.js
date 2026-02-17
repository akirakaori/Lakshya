const router = require("express").Router();
const authenticate = require("../Middleware/auth-middleware"); // JWT verify
const authorizeRoles = require("../Middleware/role-middleware");
const ROLES = require("../Library/roles").ROLES;

const { createJob } = require("../Controller/recruiter-controller");
const recruiterApplicationController = require("../Controller/recruiter-application-controller");

// Legacy job creation route
router.post(
  "/job",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  createJob
);

// ATS Pipeline Routes

/**
 * @route GET /api/recruiter/jobs/:jobId/applications
 * @desc Get all applications for a specific job with filtering and sorting
 */
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  recruiterApplicationController.getJobApplications
);

/**
 * @route PATCH /api/recruiter/applications/:applicationId/status
 * @desc Update application status
 */
router.patch(
  "/applications/:applicationId/status",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  recruiterApplicationController.updateApplicationStatus
);

/**
 * @route PATCH /api/recruiter/jobs/:jobId/applications/bulk-status
 * @desc Bulk update application statuses
 */
router.patch(
  "/jobs/:jobId/applications/bulk-status",
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  recruiterApplicationController.bulkUpdateApplicationStatus
);

module.exports = router;
