const cloudinary = require('../config/cloudinary');

/**
 * Generate a signed URL for authenticated Cloudinary assets.
 * Required for resumes uploaded with type: 'authenticated'.
 * 
 * @param {string} publicId - Cloudinary public_id (e.g., 'resumes/resume_123_456.pdf')
 * @param {object} options - Additional options
 * @returns {string} Signed secure URL valid for 1 hour
 */
const getSignedRawAuthenticatedUrl = (publicId, options = {}) => {
  if (!publicId) {
    throw new Error('publicId is required to generate signed URL');
  }

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    ...options
  });
};

/**
 * Generate a long-lived signed URL for viewing/downloading.
 * Use this for "View Resume" buttons.
 * 
 * @param {string} publicId - Cloudinary public_id
 * @returns {string} Signed URL valid for 7 days
 */
const getSignedUrlForViewing = (publicId) => {
  return getSignedRawAuthenticatedUrl(publicId, {
    expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  });
};

module.exports = {
  getSignedRawAuthenticatedUrl,
  getSignedUrlForViewing
};
