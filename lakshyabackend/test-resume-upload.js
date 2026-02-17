require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

async function testResumeUpload() {
  try {
    console.log('Testing Cloudinary resume upload with resource_type=raw...\n');
    
    // Create a simple test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n%Test PDF\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF');
    const testFilePath = path.join(__dirname, 'test-resume.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    console.log('Uploading test PDF to Cloudinary...');
    
    const result = await cloudinary.uploader.upload(testFilePath, {
      folder: 'resumes',
      resource_type: 'raw',
      use_filename: true,
      unique_filename: true
    });
    
    console.log('\n✅ Upload successful!');
    console.log('Resource Type:', result.resource_type);
    console.log('Format:', result.format);
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.url);
    console.log('Secure URL:', result.secure_url);
    console.log('\n📄 Use this URL to download/view the PDF:');
    console.log(result.secure_url);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    console.log('\n✓ Test completed successfully');
    console.log('\nIf you open this URL in a browser, it should:');
    console.log('1. Download as a PDF file, OR');
    console.log('2. Open in the browser PDF viewer');
    console.log('3. NOT show raw binary text');
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error('Message:', error.message);
    console.error('Details:', error);
  }
}

testResumeUpload();
