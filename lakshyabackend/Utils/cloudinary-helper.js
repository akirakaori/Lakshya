const cloudinary = require('../config/cloudinary');

/**
 * Generate a signed URL for a Cloudinary resource
 * This is needed for raw files (PDFs/DOCs) when account has delivery restrictions
 * 
 * @param {string} publicId - The public ID of the resource (e.g., 'resumes/file-123456')
 * @param {string} resourceType - The resource type ('raw' for PDFs/DOCs, 'image' for images)
 * @param {object} options - Additional options (expiration, transformations, etc.)
 * @returns {string} Signed URL that bypasses "untrusted customer" restrictions
 */
const generateSignedUrl = (publicId, resourceType = 'raw', options = {}) => {
  const defaultOptions = {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365), // 1 year expiration
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string} Public ID (without version but with extension for raw files)
 */
const extractPublicId = (url) => {
  if (!url) return null;
  
  // If already a public ID (no http), return as-is
  if (!url.startsWith('http')) {
    return url;
  }
  
  // Match pattern: .../upload/v12345/folder/file.ext OR .../upload/folder/file.ext
  // For raw files, we need to keep the full path including extension
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  let afterUpload = url.substring(uploadIndex + 8); // Skip '/upload/'
  
  // Remove version if present (e.g., 'v1771312786/')
  afterUpload = afterUpload.replace(/^v\d+\//, '');
  
  // Remove query parameters if any
  afterUpload = afterUpload.split('?')[0];
  
  // Decode URL encoding
  afterUpload = decodeURIComponent(afterUpload);
  
  return afterUpload;
};

module.exports = {
  generateSignedUrl,
  extractPublicId
};
