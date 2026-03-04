// Quick script to check categories in database
const mongoose = require('mongoose');
require('dotenv').config();

const JobModel = require('./models/job-model');

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to MongoDB\n');
    
    // Get all distinct categories
    const categories = await JobModel.distinct('category');
    console.log('='.repeat(60));
    console.log(`📊 Found ${categories.length} unique categories in database:`);
    console.log('='.repeat(60));
    categories.forEach((cat, idx) => {
      console.log(`${idx + 1}. "${cat}" (length: ${cat?.length || 0})`);
    });
    console.log('='.repeat(60));
    
    // Count jobs per category
    const counts = await JobModel.aggregate([
      { $match: { isDeleted: false, isActive: true, status: 'open' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Job counts per category (active & open only):');
    console.log('='.repeat(60));
    counts.forEach((item, idx) => {
      console.log(`${idx + 1}. "${item._id}" → ${item.count} jobs`);
    });
    console.log('='.repeat(60));
    
    // Test search for "UI/UX Design"
    const testCategory = 'UI/UX Design';
    console.log(`\n🔍 Testing search for category: "${testCategory}"`);
    console.log('='.repeat(60));
    
    const regex = new RegExp(testCategory, 'i');
    const matchingJobs = await JobModel.find({
      status: 'open',
      isActive: true,
      isDeleted: false,
      $or: [
        { category: { $regex: testCategory, $options: 'i' } },
        { title: { $regex: testCategory, $options: 'i' } },
        { description: { $regex: testCategory, $options: 'i' } }
      ]
    });
    
    console.log(`✅ Found ${matchingJobs.length} jobs matching "${testCategory}"`);
    if (matchingJobs.length > 0) {
      matchingJobs.forEach((job, idx) => {
        console.log(`\n  ${idx + 1}. ${job.title}`);
        console.log(`     Category: "${job.category}"`);
        console.log(`     Title contains: ${job.title.toLowerCase().includes(testCategory.toLowerCase())}`);
        console.log(`     Description contains: ${job.description.toLowerCase().includes(testCategory.toLowerCase())}`);
      });
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCategories();
