require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');
    console.log('Cloud Name:', process.env.CLOUD_NAME);
    console.log('API Key:', process.env.API_KEY ? '✓ Set' : '✗ Not set');
    console.log('API Secret:', process.env.API_SECRET ? '✓ Set' : '✗ Not set');
    
    // Test API connection
    const result = await cloudinary.api.ping();
    console.log('\n✅ SUCCESS! Cloudinary connection working:', result);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR connecting to Cloudinary:');
    console.error('Message:', error.message);
    console.error('HTTP Code:', error.http_code);
    process.exit(1);
  }
}

testCloudinary();
