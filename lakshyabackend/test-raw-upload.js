require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

async function testRawUpload() {
  try {
    console.log('Testing RAW file upload (forcing resource_type=raw)...\n');
    
    // Create a simple test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n%Test PDF\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF');
    const testFilePath = path.join(__dirname, 'test-resume.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    console.log('Uploading test PDF with explicit resource_type=raw...');
    
    const result = await cloudinary.uploader.upload(testFilePath, {
      folder: 'resumes',
      resource_type: 'raw', // CRITICAL: Force raw, don't let Cloudinary auto-detect
      allowed_formats: ['pdf', 'doc', 'docx'],
      access_mode: 'public'
    });
    
    console.log('\n✅ Upload successful!');
    console.log('════════════════════════════════════════');
    console.log('Resource Type:', result.resource_type);
    console.log('Format:', result.format);
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.url);
    console.log('Secure URL:', result.secure_url);
    console.log('════════════════════════════════════════');
    
    // Verify it's raw, not image
    if (result.resource_type === 'raw') {
      console.log('\n✅ SUCCESS: File uploaded as RAW resource');
    } else {
      console.log('\n❌ ERROR: File uploaded as', result.resource_type, 'instead of raw!');
    }
    
    // Verify URL contains /raw/upload/
    if (result.secure_url.includes('/raw/upload/')) {
      console.log('✅ SUCCESS: URL contains /raw/upload/');
    } else {
      console.log('❌ ERROR: URL does not contain /raw/upload/');
      console.log('URL:', result.secure_url);
    }
    
    console.log('\n📄 Test URL:');
    console.log(result.secure_url);
    console.log('\nOpen this URL in browser - it should:');
    console.log('1. Download as a PDF file, OR');
    console.log('2. Open in the browser PDF viewer');
    console.log('3. NOT show raw binary text like %PDF-1.7 /Subtype /Image');
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error('Message:', error.message);
    console.error('Details:', error);
  }
}

testRawUpload();
