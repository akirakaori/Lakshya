const express = require('express');
const router = express.Router();
const userController = require('../Controller/user-controller');
const verifyToken = require('../Middleware/verify-token');
const { uploadResume, uploadAvatar, handleMulterError } = require('../Middleware/upload-middleware');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`\n=== PROFILE ROUTE REQUEST ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Full URL: ${req.originalUrl}`);
  console.log(`Content-Type: ${req.get('content-type')}`);
  next();
});

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private (All authenticated users)
 */
router.get('/', verifyToken, userController.getProfile);

/**
 * @route   GET /api/profile/debug-skills
 * @desc    Debug endpoint - show raw MongoDB skills data
 * @access  Private (All authenticated users)
 */
router.get('/debug-skills', verifyToken, async (req, res) => {
  try {
    const UserModel = require('../models/user-model');
    const user = await UserModel.findById(req.user.id).select('jobSeeker');
    
    res.json({
      success: true,
      debug: {
        userId: req.user.id,
        skills: user?.jobSeeker?.skills || [],
        skillsCount: user?.jobSeeker?.skills?.length || 0,
        education: user?.jobSeeker?.education || null,
        experience: user?.jobSeeker?.experience || null,
        title: user?.jobSeeker?.title || null,
        bio: user?.jobSeeker?.bio || null,
        parseStatus: user?.jobSeeker?.resumeParseStatus,
        parseRunId: user?.jobSeeker?.resumeParseRunId,
        parseSummary: user?.jobSeeker?.resumeParseResultSummary,
        rawJobSeeker: user?.jobSeeker
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/profile/candidate/:userId
 * @desc    Get candidate profile by user ID (for recruiters viewing job seekers)
 * @access  Private (All authenticated users)
 */
router.get('/candidate/:userId', verifyToken, userController.getCandidateProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private (All authenticated users)
 */
router.put('/', verifyToken, userController.updateProfile);

/**
 * @route   POST /api/profile/upload-resume
 * @desc    Upload resume
 * @access  Private (All authenticated users)
 */
router.post('/upload-resume', verifyToken, uploadResume.single('resume'), handleMulterError, userController.uploadResume);

/**
 * @route   GET /api/profile/resume-parse-status
 * @desc    Get resume parsing status (for polling)
 * @access  Private (All authenticated users)
 */
router.get('/resume-parse-status', verifyToken, userController.getResumeParseStatus);

/**
 * @route   POST /api/profile/autofill
 * @desc    Smart Resume Autofill - Merge resume analysis with profile (only fills empty fields)
 * @access  Private (All authenticated users)
 */
router.post('/autofill', verifyToken, userController.autofillProfile);

/**
 * @route   GET /api/profile/resume-url
 * @desc    Get signed resume URL for viewing
 * @access  Private (All authenticated users)
 */
router.get('/resume-url', verifyToken, userController.getMyResumeUrl);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload profile avatar/photo
 * @access  Private (All authenticated users)
 */
router.post('/avatar', verifyToken, uploadAvatar.single('avatar'), handleMulterError, userController.uploadAvatar);

/**
 * @route   POST /api/profile/change-password
 * @desc    Change password
 * @access  Private (All authenticated users)
 */
router.post('/change-password', verifyToken, userController.changePassword);

module.exports = router;
