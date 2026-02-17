const userService = require('../Services/user-service');
const resumeParserService = require('../Services/resume-parser-service');
const { queueResumeParseJob } = require('../Services/resume-parse-queue');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserProfile(userId);
    
    // Debug: Log profile data being returned
    console.log('\n📤 ========================================');
    console.log('📤 RETURNING PROFILE TO FRONTEND');
    console.log('📤 ========================================');
    console.log('📤 User ID:', userId);
    console.log('📤 Skills count:', user.jobSeeker?.skills?.length || 0);
    console.log('📤 Skills array:', user.jobSeeker?.skills || []);
    console.log('📤 Education:', user.jobSeeker?.education ? `${user.jobSeeker.education.substring(0, 50)}...` : '(empty)');
    console.log('📤 Experience:', user.jobSeeker?.experience ? `${user.jobSeeker.experience.substring(0, 50)}...` : '(empty)');
    console.log('📤 Title:', user.jobSeeker?.title || '(empty)');
    console.log('📤 Bio:', user.jobSeeker?.bio ? `${user.jobSeeker.bio.substring(0, 50)}...` : '(empty)');
    console.log('📤 Parse Status:', user.jobSeeker?.resumeParseStatus);
    console.log('📤 Parse RunId:', user.jobSeeker?.resumeParseRunId);
    console.log('📤 Parse Summary:', JSON.stringify(user.jobSeeker?.resumeParseResultSummary));
    console.log('========================================\n');
    
    // Resume URL - since resumes are uploaded as public, use direct URL
    // (They're public so Python parser can access them)
    const resumeUrl = user.jobSeeker?.resumeUrl || null;
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
      signedResumeUrl: resumeUrl // Direct Cloudinary URL (public)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    const user = await userService.updateUserProfile(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Upload resume (ASYNC - responds immediately, parsing happens in background)
 */
const uploadResume = async (req, res) => {
  try {
    console.log('=== UPLOAD RESUME CONTROLLER (ASYNC) ===');
    const userId = req.user.id;
    console.log('User ID:', userId);
    
    if (!req.file) {
      console.log('ERROR: No resume file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    
    // Upload to Cloudinary
    // Note: Using 'upload' type (public) instead of 'authenticated' 
    // so Python service can access it without signed URLs
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          public_id: `resume_${userId}_${Date.now()}`,
          type: 'upload', // Public access for parsing
          format: req.file.originalname.split('.').pop()
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
    
    console.log('✅ Cloudinary upload successful');
    console.log('Public ID:', uploadResult.public_id);
    console.log('URL:', uploadResult.secure_url);
    console.log('Format:', uploadResult.format);
    
    // Update user with resume URL immediately
    const user = await userService.updateUserResume(userId, {
      resumeUrl: uploadResult.secure_url,
      resumePublicId: uploadResult.public_id,
      resumeFormat: uploadResult.format
    });
    
    console.log('✅ User resume metadata saved to DB');
    
    // 🚀 QUEUE PARSING JOB (runs in background - doesn't block response)
    try {
      console.log('\n📋 Queueing background parsing job...');
      const jobId = await queueResumeParseJob(userId, uploadResult.secure_url, {
        resumePublicId: uploadResult.public_id,
        originalName: req.file.originalname
      });
      console.log('✅ Parsing job queued:', jobId);
    } catch (queueError) {
      console.error('❌ Failed to queue parsing job:', queueError.message);
      // Don't fail the upload - just log the error
    }
    
    console.log('\n📤 INSTANT RESPONSE - parsing will continue in background');
    console.log('========================================\n');
    
    // RESPOND IMMEDIATELY - parsing happens in background
    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: user,
      parsingStatus: 'queued' // Tell frontend parsing is queued
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Upload profile avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    console.log('=== UPLOAD AVATAR CONTROLLER ===');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.get('content-type'));
    const userId = req.user.id;
    console.log('User ID:', userId);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    
    if (!req.file) {
      console.log('ERROR: No file uploaded - req.file is undefined');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const imagePath = req.file.path;
    console.log('Image path:', imagePath);
    console.log('Image filename:', req.file.filename);
    console.log('Image mimetype:', req.file.mimetype);
    console.log('Image size:', req.file.size);
    
    const user = await userService.updateUserProfileImage(userId, imagePath);
    console.log('Updated user profileImageUrl:', user.profileImageUrl);
    
    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required'
      });
    }
    
    const result = await userService.changePassword(userId, oldPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get candidate profile by user ID (for recruiters viewing job seekers)
 */
const getCandidateProfile = async (req, res) => {
  try {
    const candidateId = req.params.userId;
    
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const candidate = await userService.getCandidateProfile(candidateId);
    
    // Resume URL - since resumes are uploaded as public, use direct URL
    const resumeUrl = candidate.jobSeeker?.resumeUrl || null;
    
    res.status(200).json({
      success: true,
      message: 'Candidate profile retrieved successfully',
      data: candidate,
      signedResumeUrl: resumeUrl // Direct Cloudinary URL (public)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get signed resume URL for authenticated Cloudinary delivery
 */
const getMyResumeUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const signedUrl = await userService.getMyResumeSignedUrl(userId);
    
    res.status(200).json({
      success: true,
      data: {
        url: signedUrl
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get resume parse status (for polling by frontend)
 */
const getResumeParseStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserProfile(userId);
    
    if (!user || !user.jobSeeker) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    // Return parse status and current profile fields
    res.status(200).json({
      success: true,
      parseStatus: {
        status: user.jobSeeker.resumeParseStatus || 'idle',
        error: user.jobSeeker.resumeParseError || null,
        parsedAt: user.jobSeeker.resumeParsedAt || null,
        resumeParseRunId: user.jobSeeker.resumeParseRunId || null,
        summary: user.jobSeeker.resumeParseResultSummary || null
      },
      profile: {
        title: user.jobSeeker.title || '',
        bio: user.jobSeeker.bio || '',
        skills: user.jobSeeker.skills || [],
        experience: user.jobSeeker.experience || '',
        education: user.jobSeeker.education || ''
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadAvatar,
  changePassword,
  getCandidateProfile,
  getMyResumeUrl,
  getResumeParseStatus
};
