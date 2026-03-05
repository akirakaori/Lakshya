const express = require('express');
const router = express.Router();
const publicController = require('../Controller/public-controller');

/**
 * @route   GET /public/landing
 * @desc    Get landing page data (stats + recent jobs)
 * @access  Public
 */
router.get('/landing', publicController.getLandingData);

module.exports = router;
