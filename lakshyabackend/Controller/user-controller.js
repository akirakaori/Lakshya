const userService = require('../Services/user-service');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserProfile(userId);
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
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
 * Upload resume
 */
const uploadResume = async (req, res) => {
  try {
    console.log('=== UPLOAD RESUME CONTROLLER ===');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.get('content-type'));
    const userId = req.user.id;
    console.log('User ID:', userId);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    
    if (!req.file) {
      console.log('ERROR: No resume file uploaded - req.file is undefined');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const resumePath = req.file.path;
    console.log('Resume path:', resumePath);
    console.log('Resume filename:', req.file.filename);
    console.log('Resume mimetype:', req.file.mimetype);
    console.log('Resume size:', req.file.size);
    
    const user = await userService.updateUserResume(userId, resumePath);
    
    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: user
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
    
    res.status(200).json({
      success: true,
      message: 'Candidate profile retrieved successfully',
      data: candidate
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
  getCandidateProfile
};
