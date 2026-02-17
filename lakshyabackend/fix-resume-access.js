require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function fixExistingResume() {
  try {
    console.log('Checking existing resume access...\n');
    
    const publicId = 'resumes/Screenshot 2026-02-17 130407-1771312785072';
    
    console.log('Public ID:', publicId);
    
    // Try to get resource details
    try {
      const result = await cloudinary.api.resource(publicId, { 
        resource_type: 'raw'
      });
      
      console.log('\n📄 Resource Details:');
      console.log('Public ID:', result.public_id);
      console.log('Format:', result.format);
      console.log('Resource Type:', result.resource_type);
      console.log('Type:', result.type);
      console.log('Access Mode:', result.access_mode);
      console.log('URL:', result.url);
      console.log('Secure URL:', result.secure_url);
      
      // If it's authenticated, try to update to public
      if (result.type === 'authenticated') {
        console.log('\n⚠️  File is uploaded as AUTHENTICATED (private)');
        console.log('Attempting to change to public...\n');
        
        const updated = await cloudinary.uploader.explicit(publicId, {
          type: 'upload',
          resource_type: 'raw'
        });
        
        console.log('✅ Updated to public!');
        console.log('New URL:', updated.secure_url);
        console.log('\nTry accessing this URL now.');
      } else {
        console.log('\n✅ File is already public!');
      }
      
    } catch (error) {
      console.error('Error fetching resource:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixExistingResume();
