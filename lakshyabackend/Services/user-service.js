const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');

// Note: URL parsing for resumes removed. Use resumePublicId instead.
// Avatar logic remains untouched.

/**
 * Get user profile by ID
 */
const getUserProfile = async (userId) => {
  try {
    const user = await UserModel.findById(userId).select('-password -resetOTP -resetOTPExpiry');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    return user.toObject();
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    console.log('=== UPDATE PROFILE SERVICE ===');
    console.log('User ID:', userId);
    console.log('Update Data:', JSON.stringify(updateData, null, 2));
    
    // Map fullName to name if provided
    if (updateData.fullName) {
      updateData.name = updateData.fullName;
      delete updateData.fullName;
    }
    
    // Map phone to number if provided
    if (updateData.phone) {
      updateData.number = updateData.phone;
      delete updateData.phone;
    }
    
    // Don't allow updating certain fields directly
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.resetOTP;
    delete updateData.resetOTPExpiry;
    
    // CRITICAL FIX: Handle nested objects (jobSeeker, recruiter) properly
    // MongoDB's findByIdAndUpdate REPLACES nested objects instead of merging
    // We need to fetch current user and merge nested fields manually
    const currentUser = await UserModel.findById(userId).select('-password -resetOTP -resetOTPExpiry');
    
    if (!currentUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Merge jobSeeker fields if provided (don't replace entire object)
    if (updateData.jobSeeker) {
      updateData.jobSeeker = {
        ...currentUser.jobSeeker,
        ...updateData.jobSeeker
      };
    }
    
    // Merge recruiter fields if provided (don't replace entire object)
    if (updateData.recruiter) {
      updateData.recruiter = {
        ...currentUser.recruiter,
        ...updateData.recruiter
      };
    }
    
    console.log('Mapped Update Data (with merged nested objects):', JSON.stringify(updateData, null, 2));
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetOTP -resetOTPExpiry');
    
    console.log('Updated User:', JSON.stringify(user, null, 2));
    
    return user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Update user's resume with Cloudinary data (URL + public_id + format)
 */
const updateUserResume = async (userId, resumeData) => {
  try {
    console.log('=== UPDATE USER RESUME SERVICE ===');
    console.log('User ID:', userId);
    console.log('Resume data:', resumeData);
    
    const { resumeUrl, resumePublicId, resumeFormat } = resumeData;
    
    // Update resume (legacy), jobSeeker.resumeUrl, resumePublicId, and resumeFormat
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        resume: resumeUrl,
        'jobSeeker.resumeUrl': resumeUrl,
        'jobSeeker.resumePublicId': resumePublicId,
        'jobSeeker.resumeFormat': resumeFormat
      },
      { new: true }
    ).select('-password -resetOTP -resetOTPExpiry');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    console.log('Updated user resume - PublicId:', user.jobSeeker.resumePublicId, 'Format:', user.jobSeeker.resumeFormat);
    
    return user;
  } catch (error) {
    console.error('Update resume error:', error);
    throw error;
  }
};

/**
 * Update user's profile image
 */
const updateUserProfileImage = async (userId, imagePath) => {
  try {
    console.log('=== UPDATE USER PROFILE IMAGE SERVICE ===');
    console.log('User ID:', userId);
    console.log('Image path:', imagePath);
    
    // For Cloudinary URLs, use as-is. For local paths, add /uploads/ prefix
    const imageUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://') 
      ? imagePath 
      : `/uploads/${imagePath.replace(/\\/g, '/').split('uploads/')[1] || imagePath}`;
    
    console.log('Image URL:', imageUrl);
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profileImageUrl: imageUrl },
      { new: true }
    ).select('-password -resetOTP -resetOTPExpiry');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    console.log('Updated user profileImageUrl:', user.profileImageUrl);
    
    return user;
  } catch (error) {
    console.error('Update profile image error:', error);
    throw error;
  }
};

/**
 * Change user password
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await UserModel.findById(userId).select('+password');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const error = new Error('Old password is incorrect');
      error.statusCode = 400;
      throw error;
    }
    
    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    return { message: 'Password changed successfully' };
  } catch (error) {
    throw error;
  }
};

/**
 * Get candidate/job seeker profile by user ID (for recruiters)
 */
const getCandidateProfile = async (userId) => {
  try {
    const user = await UserModel.findOne({ 
      _id: userId, 
      role: 'job_seeker' 
    }).select('-password -resetOTP -resetOTPExpiry');
    
    if (!user) {
      const error = new Error('Candidate not found');
      error.statusCode = 404;
      throw error;
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get signed resume URL for authenticated delivery
 * Generates a temporary signed URL (10 min TTL) for downloading resumes
 * Uses private_download_url for authenticated raw files
 */
const getMyResumeSignedUrl = async (userId) => {
  try {
    const user = await UserModel.findById(userId).select('jobSeeker.resumePublicId jobSeeker.resumeFormat');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const resumePublicId = user.jobSeeker?.resumePublicId;
    const resumeFormat = user.jobSeeker?.resumeFormat || 'pdf';
    
    if (!resumePublicId) {
      const error = new Error('Resume not uploaded');
      error.statusCode = 404;
      throw error;
    }
    
    // Generate signed download URL using private_download_url
    // This is the proper method for authenticated/private resources
    const signedUrl = cloudinary.utils.private_download_url(
      resumePublicId,
      resumeFormat,
      {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        secure: true
      }
    );
    
    console.log('Generated signed resume download URL for user:', userId);
    
    return signedUrl;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserResume,
  updateUserProfileImage,
  changePassword,
  getCandidateProfile,
  getMyResumeSignedUrl
};
