const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

// Test configuration on startup
console.log('Cloudinary Cloud Name:', process.env.CLOUD_NAME ? 'Set ✓' : 'Missing ✗');

module.exports = cloudinary;
