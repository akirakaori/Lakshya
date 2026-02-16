const express = require('express');
const router = express.Router();
const applicationController = require('../Controller/application-controller');
const authorizeRoles = require('../Middleware/authorize-roles');
const { ROLES } = require('../Library/roles');

/**
 * @route   POST /api/applications/:jobId
 * @desc    Apply for a job
 * @access  Private (Job Seeker only)
 */
router.post('/:jobId', authorizeRoles(ROLES.JOB_SEEKER), applicationController.applyForJob);

/**
 * @route   GET /api/applications/my
 * @desc    Get all applications by the logged-in job seeker
 * @access  Private (Job Seeker only)
 */
router.get('/my', authorizeRoles(ROLES.JOB_SEEKER), applicationController.getMyApplications);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get all applications for a specific job
 * @access  Private (Recruiter only - must be the job creator)
 */
router.get('/job/:jobId', authorizeRoles(ROLES.RECRUITER), applicationController.getJobApplications);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update application status (shortlisted/rejected)
 * @access  Private (Recruiter only - must be the job creator)
 */
router.patch('/:id/status', authorizeRoles(ROLES.RECRUITER), applicationController.updateApplicationStatus);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Private (Authenticated users)
 */
router.get('/:id', authorizeRoles(ROLES.JOB_SEEKER, ROLES.RECRUITER), applicationController.getApplicationById);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Withdraw application
 * @access  Private (Job Seeker only - must be the applicant)
 */
router.delete('/:id', authorizeRoles(ROLES.JOB_SEEKER), applicationController.withdrawApplication);

module.exports = router;
