const express = require('express');
const router = express.Router();
const landingController = require('../Controller/landing-controller');

/**
 * @route   GET /public/landing
 * @desc    Get landing page data (stats + recent jobs)
 * @access  Public
 */
router.get('/landing', landingController.getLandingData);

/**
 * @route   GET /public/jobs
 * @desc    Search jobs (public)
 * @query   keyword, page, limit
 * @access  Public
 */
router.get('/jobs', landingController.searchPublicJobs);

module.exports = router;
