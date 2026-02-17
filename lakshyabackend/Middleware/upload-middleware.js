const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Use memoryStorage for resumes - we'll manually upload to Cloudinary
// This is because multer-storage-cloudinary ignores resource_type: 'raw'
const resumeStorage = multer.memoryStorage();

// Configure Cloudinary storage for avatars (Images only)
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    use_filename: true,
    unique_filename: true
  }
});

// File filter for resumes (PDF and DOC files)
const resumeFileFilter = (req, file, cb) => {
  console.log('Resume file filter - checking file:', file.originalname, 'mimetype:', file.mimetype);
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('Resume file filter - ACCEPTED');
    cb(null, true);
  } else {
    console.log('Resume file filter - REJECTED');
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

// File filter for avatars (Images only)
const avatarFileFilter = (req, file, cb) => {
  console.log('Avatar file filter - checking file:', file.originalname, 'mimetype:', file.mimetype);
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('Avatar file filter - ACCEPTED');
    cb(null, true);
  } else {
    console.log('Avatar file filter - REJECTED');
    cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'), false);
  }
};

// Configure multer for resumes
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Configure multer for avatars
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size for images
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer Error:', err);
    console.error('Multer Error Code:', err.code);
    console.error('Multer Error Field:', err.field);
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      error: err.code
    });
  } else if (err) {
    console.error('Upload Error:', err);
    console.error('Upload Error Stack:', err.stack);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      error: err.toString()
    });
  }
  next();
};

// Default export for backward compatibility (resumes)
module.exports = uploadResume;

// Named exports for specific upload types
module.exports.uploadResume = uploadResume;
module.exports.uploadAvatar = uploadAvatar;
module.exports.handleMulterError = handleMulterError;
