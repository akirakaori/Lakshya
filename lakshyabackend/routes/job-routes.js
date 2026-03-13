const express = require('express');
const router = express.Router();
const jobController = require('../Controller/job-controller');
const authorizeRoles = require('../Middleware/authorize-roles');
const { ROLES } = require('../Library/roles');

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 * @access  Private (Recruiter only)
 */
router.post('/', authorizeRoles(ROLES.RECRUITER), jobController.createJob);

/**
 * @route   GET /api/jobs
 * @desc    Browse and search jobs with filters
 * @access  Public
 */
router.get('/', jobController.searchJobs);

/**
 * @route   GET /api/jobs/my-jobs
 * @desc    Get all jobs posted by the logged-in recruiter
 * @access  Private (Recruiter only)
 */
router.get('/my-jobs', authorizeRoles(ROLES.RECRUITER), jobController.getMyJobs);

/**
 * @route   POST /api/jobs/:jobId/save
 * @desc    Save a job for the logged-in job seeker
 * @access  Private (Job Seeker only)
 */
router.post('/:jobId/save', authorizeRoles(ROLES.JOB_SEEKER), jobController.saveJobForUser);

/**
 * @route   DELETE /api/jobs/:jobId/save
 * @desc    Remove a job from the logged-in user's saved list
 * @access  Private (Job Seeker only)
 */
router.delete('/:jobId/save', authorizeRoles(ROLES.JOB_SEEKER), jobController.removeSavedJobForUser);

/**
 * @route   GET /api/jobs/saved
 * @desc    Get all jobs saved by the logged-in user
 * @access  Private (Job Seeker only)
 */
router.get('/saved', authorizeRoles(ROLES.JOB_SEEKER), jobController.getSavedJobsForUser);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a single job by ID
 * @access  Public
 */
router.get('/:id', jobController.getJobById);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update a job
 * @access  Private (Recruiter only - must be the creator)
 */
router.put('/:id', authorizeRoles(ROLES.RECRUITER), jobController.updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job (hard delete - DEPRECATED)
 * @access  Private (Recruiter only - must be the creator)
 */
router.delete('/:id', authorizeRoles(ROLES.RECRUITER), jobController.deleteJob);

/**
 * @route   PATCH /api/jobs/:id/soft-delete
 * @desc    Soft delete a job (recommended)
 * @access  Private (Recruiter only - must be the creator)
 */
router.patch('/:id/soft-delete', authorizeRoles(ROLES.RECRUITER), jobController.softDeleteJob);

/**
 * @route   PATCH /api/jobs/:id/toggle-status
 * @desc    Toggle job status (open/closed)
 * @access  Private (Recruiter only - must be the creator)
 */
router.patch('/:id/toggle-status', authorizeRoles(ROLES.RECRUITER), jobController.toggleJobStatus);

module.exports = router;
