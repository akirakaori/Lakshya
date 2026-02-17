require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./models/user-model');
const { generateSignedUrl, extractPublicId } = require('./Utils/cloudinary-helper');

async function fixExistingResumes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('Finding users with Cloudinary resume URLs...\n');
    
    // Find all users with resume URLs that contain Cloudinary
    const users = await UserModel.find({
      'jobSeeker.resumeUrl': { $regex: 'cloudinary.com' }
    });
    
    console.log(`Found ${users.length} users with Cloudinary resumes\n`);
    
    let updated = 0;
    
    for (const user of users) {
      const resumeUrl = user.jobSeeker?.resumeUrl;
      
      if (!resumeUrl) continue;
      
      // Check if it's already a signed URL
      if (resumeUrl.includes('/s--')) {
        console.log(`✓ User ${user.email}: Already has signed URL`);
        continue;
      }
      
      // Extract public ID
      const publicId = extractPublicId(resumeUrl);
      
      if (!publicId) {
        console.log(`✗ User ${user.email}: Could not extract public ID from ${resumeUrl}`);
        continue;
      }
      
      // Generate signed URL
      const signedUrl = generateSignedUrl(publicId, 'raw');
      
      // Update user
      user.jobSeeker.resumeUrl = signedUrl;
      if (user.resume) {
        user.resume = signedUrl;
      }
      await user.save();
      
      console.log(`✅ User ${user.email}: Updated to signed URL`);
      console.log(`   Old: ${resumeUrl}`);
      console.log(`   New: ${signedUrl}\n`);
      
      updated++;
    }
    
    console.log(`\n✅ Updated ${updated} resume URLs to signed URLs`);
    console.log('All existing resumes should now be accessible!\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixExistingResumes();
