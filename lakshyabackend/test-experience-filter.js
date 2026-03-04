// Test script to verify experience level filter works correctly
const mongoose = require('mongoose');
require('dotenv').config();

const JobModel = require('./models/job-model');

async function testExperienceFilter() {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check what experience levels exist in DB
    console.log('='.repeat(60));
    console.log('TEST 1: What experience levels exist in database?');
    console.log('='.repeat(60));
    
    const distinctLevels = await JobModel.distinct('experienceLevel', {
      isDeleted: false,
      isActive: true,
      status: 'open'
    });
    
    console.log(`Found ${distinctLevels.length} unique experience levels:`);
    distinctLevels.forEach((level, idx) => {
      console.log(`  ${idx + 1}. "${level}" (length: ${level?.length ?? 0})`);
    });
    
    // Count jobs per level
    const levelCounts = await JobModel.aggregate([
      { $match: { isDeleted: false, isActive: true, status: 'open' } },
      { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nJob counts per experience level:');
    levelCounts.forEach((item, idx) => {
      console.log(`  ${idx + 1}. "${item._id}" → ${item.count} jobs`);
    });
    
    // Test 2: Case-insensitive regex matching
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Case-insensitive regex matching');
    console.log('='.repeat(60));
    
    const testLevels = ['Mid-level', 'Senior', 'Entry'];
    
    for (const testLevel of testLevels) {
      console.log(`\nTesting filter: "${testLevel}"`);
      
      // Create regex (same as backend logic)
      const regex = new RegExp(`^${testLevel.trim()}$`, 'i');
      
      const jobs = await JobModel.find({
        status: 'open',
        isActive: true,
        isDeleted: false,
        experienceLevel: regex
      });
      
      console.log(`  ✅ Found ${jobs.length} jobs`);
      if (jobs.length > 0) {
        jobs.slice(0, 3).forEach((job, idx) => {
          console.log(`    ${idx + 1}. ${job.title} (experienceLevel: "${job.experienceLevel}")`);
        });
      }
    }
    
    // Test 3: Multiple levels using $in with regex
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Multiple experience levels (like real filter)');
    console.log('='.repeat(60));
    
    const experienceLevels = ['Mid-level', 'Senior'];
    console.log(`Testing filters: ${JSON.stringify(experienceLevels)}\n`);
    
    // Create regex array (same as backend logic with escapeRegExp)
    const escapeRegExp = (str) => {
      return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const normalizedLevels = experienceLevels
      .filter(level => level && String(level).trim())
      .map(level => {
        const trimmed = String(level).trim();
        const escaped = escapeRegExp(trimmed);
        return new RegExp(`^${escaped}$`, 'i');
      });
    
    console.log('Regex patterns created:', normalizedLevels.length);
    normalizedLevels.forEach((regex, idx) => {
      console.log(`  ${idx + 1}. /${regex.source}/${regex.flags}`);
    });
    
    const jobs = await JobModel.find({
      status: 'open',
      isActive: true,
      isDeleted: false,
      experienceLevel: { $in: normalizedLevels }
    });
    
    console.log(`\n✅ Found ${jobs.length} jobs matching Mid-level OR Senior`);
    if (jobs.length > 0) {
      jobs.slice(0, 5).forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title}`);
        console.log(`     Experience: "${job.experienceLevel}"`);
        console.log(`     Company: ${job.companyName}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testExperienceFilter();
