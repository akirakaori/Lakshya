require('dotenv').config();
const { generateSignedUrl, extractPublicId } = require('./Utils/cloudinary-helper');

async function testSignedUrl() {
  try {
    console.log('Testing signed URL generation for resumes...\n');
    
    // Test with the existing resume public ID
    const publicId = 'resumes/Screenshot 2026-02-17 130407-1771312785072';
    
    console.log('Public ID:', publicId);
    console.log('\nGenerating signed URL...');
    
    const signedUrl = generateSignedUrl(publicId, 'raw');
    
    console.log('\n✅ Signed URL generated:');
    console.log(signedUrl);
    console.log('\n📄 This URL should work even with "untrusted customer" restriction');
    console.log('Try opening it in your browser!');
    console.log('\nNote: Signed URL includes authentication token and expiration timestamp');
    console.log('Valid for: 1 year from now');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testSignedUrl();
