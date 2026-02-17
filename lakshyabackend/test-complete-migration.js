require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('CLOUDINARY MIGRATION - COMPREHENSIVE TEST');
console.log('='.repeat(80));
console.log('\n');

// Test 1: Cloudinary Configuration
console.log('TEST 1: Cloudinary Configuration');
console.log('-'.repeat(80));
console.log('Cloud Name:', process.env.CLOUD_NAME || '❌ MISSING');
console.log('API Key:', process.env.API_KEY ? '✓ Set' : '❌ MISSING');
console.log('API Secret:', process.env.API_SECRET ? '✓ Set' : '❌ MISSING');
console.log('');

// Test 2: Resume Storage Configuration
console.log('TEST 2: Resume Storage Configuration (PDF/DOC/DOCX)');
console.log('-'.repeat(80));
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'resumes',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx'],
    access_mode: 'public'
  }
});
console.log('✓ Resume storage configured');
console.log('  - Folder: resumes');
console.log('  - Resource Type: raw');
console.log('  - Allowed Formats: pdf, doc, docx');
console.log('  - Access Mode: public');
console.log('');

// Test 3: Avatar Storage Configuration  
console.log('TEST 3: Avatar Storage Configuration (Images)');
console.log('-'.repeat(80));
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
console.log('✓ Avatar storage configured');
console.log('  - Folder: avatars');
console.log('  - Resource Type: image');
console.log('  - Allowed Formats: jpg, jpeg, png');
console.log('');

// Test 4: Actual Resume Upload Test
console.log('TEST 4: Actual Resume Upload Test');
console.log('-'.repeat(80));

async function testResumeUpload() {
  try {
    // Create a test PDF
    const testPdfContent = Buffer.from(
      '%PDF-1.4\n%Test PDF Document\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\n' +
      'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\n' +
      'startxref\n0\n%%EOF'
    );
    
    const testFilePath = path.join(__dirname, 'test-migration-resume.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    console.log('Uploading test resume PDF...');
    
    const result = await cloudinary.uploader.upload(testFilePath, {
      folder: 'resumes',
      resource_type: 'raw',
      allowed_formats: ['pdf', 'doc', 'docx'],
      access_mode: 'public'
    });
    
    console.log('\n✅ RESUME UPLOAD SUCCESSFUL!');
    console.log('-'.repeat(80));
    console.log('Resource Type:', result.resource_type);
    console.log('Format:', result.format || 'N/A');
    console.log('Public ID:', result.public_id);
    console.log('Bytes:', result.bytes);
    console.log('URL:', result.url);
    console.log('Secure URL:', result.secure_url);
    
    // Validation checks
    console.log('\nVALIDATION CHECKS:');
    console.log('-'.repeat(80));
    
    if (result.resource_type === 'raw') {
      console.log('✅ Resource type is RAW (correct for PDFs)');
    } else {
      console.log('❌ Resource type is', result.resource_type, '(should be RAW!)');
    }
    
    if (result.secure_url.includes('/raw/upload/')) {
      console.log('✅ URL contains /raw/upload/ (correct)');
    } else {
      console.log('❌ URL does NOT contain /raw/upload/');
    }
    
    if (result.secure_url.includes('/image/upload/')) {
      console.log('❌ ERROR: URL contains /image/upload/ (WRONG!)');
    } else {
      console.log('✅ URL does not contain /image/upload/ (good)');
    }
    
    console.log('\n📄 TEST RESUME URL:');
    console.log(result.secure_url);
    console.log('\nTry opening this URL in your browser.');
    console.log('Expected: PDF should download or open in viewer');
    console.log('NOT: Raw binary text like %PDF-1.7 /Subtype /Image');
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\n✓ Test file cleaned up');
    
  } catch (error) {
    console.error('\n❌ UPLOAD FAILED:');
    console.error('Error:', error.message);
    console.error('Details:', error);
  }
}

// Test 5: Avatar Upload Test
console.log('\nTEST 5: Avatar Upload Test');
console.log('-'.repeat(80));

async function testAvatarUpload() {
  try {
    // Create a tiny 1x1 PNG
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const testFilePath = path.join(__dirname, 'test-migration-avatar.png');
    fs.writeFileSync(testFilePath, pngData);
    
    console.log('Uploading test avatar PNG... ');
    
    const result = await cloudinary.uploader.upload(testFilePath, {
      folder: 'avatars',
      resource_type: 'image'
    });
    
    console.log('\n✅ AVATAR UPLOAD SUCCESSFUL!');
    console.log('-'.repeat(80));
    console.log('Resource Type:', result.resource_type);
    console.log('Format:', result.format);
    console.log('Public ID:', result.public_id);
    console.log('Width x Height:', result.width, 'x', result.height);
    console.log('Secure URL:', result.secure_url);
    
    console.log('\nVALIDATION CHECKS:');
    console.log('-'.repeat(80));
    
    if (result.resource_type === 'image') {
      console.log('✅ Resource type is IMAGE (correct for avatars)');
    } else {
      console.log('❌ Resource type is', result.resource_type);
    }
    
    if (result.secure_url.includes('/image/upload/')) {
      console.log('✅ URL contains /image/upload/ (correct for images)');
    } else {
      console.log('❌ URL does NOT contain /image/upload/');
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\n✓ Test file cleaned up');
    
  } catch (error) {
    console.error('\n❌ AVATAR UPLOAD FAILED:');
    console.error('Error:', error.message);
  }
}

// Run all tests
(async () => {
  await testResumeUpload();
  console.log('\n');
  await testAvatarUpload();
  
  console.log('\n');
  console.log('='.repeat(80));
  console.log('MIGRATION TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\nSUMMARY:');
  console.log('- Configuration: ✓ Loaded from .env');
  console.log('- Resume uploads: Use resource_type = "raw"');
  console.log('- Avatar uploads: Use resource_type = "image"');
  console.log('- URLs: Cloudinary CDN (httpส://res.cloudinary.com/...)');
  console.log('- Storage: Cloud-based (no local files)');
  console.log('\nNext Steps:');
  console.log('1. Restart your backend server');
  console.log('2. Upload a real resume through your app');
  console.log('3. Check backend console logs for validation');
  console.log('4. Open the resume URL - should display PDF correctly');
  console.log('');
})();
