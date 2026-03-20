const UserModel = require('../models/user-model');
const JobModel = require('../models/job-model');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const { mergeProfile } = require('../Utils/profile-autofill');

const INTERNAL_TEST_JOB_EXCLUSION = {
  isTestData: { $ne: true },
  $nor: [
    {
      title: /^Withdraw Flow QA$/i,
      companyName: /^TestCo$/i,
      description: /withdraw lifecycle/i,
    },
  ],
};

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
        ...updateData.jobSeeker,
        // Track profile update time for match analysis versioning
        profileUpdatedAt: new Date()
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
    const user = await UserModel.findById(userId).select('jobSeeker.resumeUrl jobSeeker.resumePublicId');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const resumeUrl = user.jobSeeker?.resumeUrl;
    
    if (!resumeUrl) {
      const error = new Error('Resume not uploaded');
      error.statusCode = 404;
      throw error;
    }
    
    // Since resumes are uploaded as public (type: 'upload'), 
    // return the direct Cloudinary URL
    console.log('Returning direct resume URL for user:', userId);
    
    return resumeUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * Smart Resume Autofill: Intelligently merge resume analysis with profile
 * Only fills EMPTY fields, never overwrites existing values
 * 
 * @param {string} userId - User ID
 * @param {Object} analysisData - Resume analysis data from parser
 * @returns {Promise<Object>} - { updatedProfile, changes }
 */
const autofillProfile = async (userId, analysisData) => {
  try {
    console.log('\n🚀 ========================================');
    console.log('🚀 AUTOFILL PROFILE SERVICE');
    console.log('🚀 ========================================');
    console.log('🚀 User ID:', userId);
    console.log('🚀 Analysis data preview:');
    console.log('   - Title:', analysisData.title || '(none)');
    console.log('   - Skills:', analysisData.skills?.length || 0);
    console.log('   - Has experience:', !!analysisData.experience);
    console.log('   - Has education:', !!analysisData.education);
    console.log('========================================\n');
    
    // Fetch current profile
    const currentProfile = await UserModel.findById(userId).select('-password -resetOTP -resetOTPExpiry');
    
    if (!currentProfile) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Convert to plain object for manipulation
    const profileObj = currentProfile.toObject();
    
    // Use the smart merge function
    const { updatedProfile, changes } = mergeProfile(profileObj, analysisData);
    
    // Prepare MongoDB update object (only update changed fields)
    const dbUpdates = {};
    
    // Map profile fields to MongoDB update format
    if (updatedProfile.name !== profileObj.name) {
      dbUpdates.name = updatedProfile.name;
    }
    
    if (updatedProfile.email !== profileObj.email) {
      dbUpdates.email = updatedProfile.email;
    }
    
    if (updatedProfile.number !== profileObj.number) {
      dbUpdates.number = updatedProfile.number;
    }
    
    // Handle jobSeeker nested updates (use dot notation)
    const jobSeekerFields = ['title', 'bio', 'skills', 'experience', 'education'];
    
    for (const field of jobSeekerFields) {
      const newValue = updatedProfile.jobSeeker?.[field];
      const oldValue = profileObj.jobSeeker?.[field];
      
      // Compare properly (for arrays, use JSON.stringify)
      const hasChanged = Array.isArray(newValue)
        ? JSON.stringify(newValue) !== JSON.stringify(oldValue)
        : newValue !== oldValue;
      
      if (hasChanged) {
        dbUpdates[`jobSeeker.${field}`] = newValue;
      }
    }
    
    console.log('\n💾 Database updates to apply:', Object.keys(dbUpdates).length);
    console.log('💾 Fields:', Object.keys(dbUpdates).join(', '));
    
    // Apply updates to database if there are changes
    let savedProfile = currentProfile;
    
    if (Object.keys(dbUpdates).length > 0) {
      savedProfile = await UserModel.findByIdAndUpdate(
        userId,
        { $set: dbUpdates },
        { new: true, runValidators: false }
      ).select('-password -resetOTP -resetOTPExpiry');
      
      console.log('✅ Profile updated in database');
    } else {
      console.log('ℹ️  No changes needed - profile already complete');
    }
    
    console.log('\n✅ ========================================');
    console.log('✅ AUTOFILL COMPLETED SUCCESSFULLY');
    console.log('✅ ========================================\n');
    
    return {
      success: true,
      profile: savedProfile,
      changes,
      fieldsUpdated: Object.keys(dbUpdates).length
    };
  } catch (error) {
    console.error('\n❌ Autofill profile error:', error);
    throw error;
  }
};

/**
 * Save a job for the given user (bookmark)
 * Uses $addToSet to avoid duplicate entries
 */
const saveJobForUser = async (userId, jobId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID');
      error.statusCode = 400;
      throw error;
    }

    // Ensure job exists and is not hard-deleted
    const job = await JobModel.findById(jobId).select('_id isActive isDeleted status');
    if (!job || job.isDeleted) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    ).select('savedJobs');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user.savedJobs || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a saved job for the given user
 * Uses $pull to remove jobId from savedJobs array
 */
const removeSavedJobForUser = async (userId, jobId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID');
      error.statusCode = 400;
      throw error;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { savedJobs: jobId } },
      { new: true }
    ).select('savedJobs');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user.savedJobs || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get all saved jobs for the given user
 * Populates job details, filters out deleted/inactive jobs, and paginates
 */
const getSavedJobsForUser = async (userId, options = {}) => {
  try {
    const parsedPage = Number(options.page);
    const parsedLimit = Number(options.limit);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 6;

    const user = await UserModel.findById(userId)
      .select('savedJobs')
      .populate({
        path: 'savedJobs',
        match: { isDeleted: false, isActive: true, ...INTERNAL_TEST_JOB_EXCLUSION },
      });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Filter out any nulls that may result from populate match
    const jobs = (user.savedJobs || []).filter(Boolean);

    const total = jobs.length;
    const pages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, pages);
    const startIndex = (safePage - 1) * limit;
    const paginatedJobs = jobs.slice(startIndex, startIndex + limit);

    return {
      data: paginatedJobs,
      pagination: {
        total,
        page: safePage,
        limit,
        pages,
      },
    };
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
  getMyResumeSignedUrl,
  autofillProfile,
  saveJobForUser,
  removeSavedJobForUser,
  getSavedJobsForUser
};
