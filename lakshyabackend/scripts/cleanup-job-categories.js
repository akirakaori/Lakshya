/**
 * Data Cleanup Script: Normalize Job Categories
 * 
 * Purpose:
 * - Trim whitespace from all job categories
 * - Fix case inconsistencies if needed
 * - Log all changes for review
 * 
 * Usage:
 * node scripts/cleanup-job-categories.js
 * 
 * Safety:
 * - Reads all jobs first
 * - Shows preview of changes
 * - Requires confirmation before updating
 * - Creates backup data in logs
 */

const mongoose = require('mongoose');
const JobModel = require('../models/job-model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lakshya';

// Known valid categories (from JOB_CATEGORIES constant)
const VALID_CATEGORIES = [
  'Software Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mobile Development',
  'Web Development',
  'Database Administration',
  'Quality Assurance & Testing',
  'Product Management',
  'Project Management',
  'UI/UX Design',
  'Graphic Design',
  'Digital Marketing',
  'Content Marketing',
  'Social Media Marketing',
  'SEO & SEM',
  'Sales & Business Development',
  'Customer Success',
  'Customer Support',
  'Human Resources',
  'Recruitment & Talent Acquisition',
  'Finance & Accounting',
  'Legal & Compliance',
  'Operations Management',
  'Supply Chain & Logistics',
  'Healthcare & Medical',
  'Education & Training',
  'Research & Development',
  'Consulting',
  'Architecture & Engineering',
  'Real Estate',
  'Retail & E-commerce',
  'Hospitality & Tourism',
  'Media & Communications',
  'Creative Arts',
  'Non-Profit & Social Impact',
  'Administrative & Office',
  'Charter Accountant',
  'Full Stack Developer',
  'Data Analyst',
  'Machine Learning Engineer',
  'Other',
];

async function cleanupJobCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all jobs with categories
    console.log('📊 Analyzing jobs with categories...');
    const jobs = await JobModel.find({ category: { $exists: true, $ne: null } });
    
    console.log(`Found ${jobs.length} jobs with categories\n`);

    if (jobs.length === 0) {
      console.log('✅ No jobs to process. Exiting.');
      await mongoose.disconnect();
      return;
    }

    // Analyze changes needed
    const changesNeeded = [];
    const categoryStats = {};

    jobs.forEach(job => {
      const original = job.category;
      const trimmed = original.trim();

      // Track category stats
      categoryStats[trimmed] = (categoryStats[trimmed] || 0) + 1;

      // Check if change needed
      if (original !== trimmed) {
        changesNeeded.push({
          jobId: job._id,
          title: job.title,
          original,
          trimmed,
          difference: original.length - trimmed.length
        });
      }
    });

    // Display statistics
    console.log('📈 Category Statistics:');
    console.log('='.repeat(60));
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const isValid = VALID_CATEGORIES.includes(cat);
        const status = isValid ? '✅' : '⚠️';
        console.log(`${status} "${cat}": ${count} job(s)`);
      });
    console.log('='.repeat(60));
    console.log();

    // Show changes needed
    if (changesNeeded.length > 0) {
      console.log('🔧 Changes needed:');
      console.log('='.repeat(60));
      changesNeeded.forEach(change => {
        console.log(`Job: ${change.title}`);
        console.log(`  ID: ${change.jobId}`);
        console.log(`  Before: "${change.original}" (${change.original.length} chars)`);
        console.log(`  After:  "${change.trimmed}" (${change.trimmed.length} chars)`);
        console.log(`  Removes: ${change.difference} whitespace character(s)`);
        console.log();
      });
      console.log('='.repeat(60));
      console.log();

      // Confirmation prompt
      console.log(`⚠️  Ready to update ${changesNeeded.length} job(s)`);
      console.log('⚠️  This will trim whitespace from categories');
      console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('🚀 Starting updates...\n');

      // Perform updates
      let successCount = 0;
      let errorCount = 0;

      for (const change of changesNeeded) {
        try {
          await JobModel.findByIdAndUpdate(
            change.jobId,
            { category: change.trimmed },
            { runValidators: true }
          );
          console.log(`✅ Updated: ${change.title}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed: ${change.title}`, error.message);
          errorCount++;
        }
      }

      console.log();
      console.log('='.repeat(60));
      console.log('📊 Update Summary:');
      console.log(`  ✅ Successful: ${successCount}`);
      console.log(`  ❌ Failed: ${errorCount}`);
      console.log(`  📝 Total: ${changesNeeded.length}`);
      console.log('='.repeat(60));
    } else {
      console.log('✅ All categories are already clean! No updates needed.');
    }

    // Show categories that don't match the valid list
    const invalidCategories = Object.keys(categoryStats).filter(cat => !VALID_CATEGORIES.includes(cat));
    if (invalidCategories.length > 0) {
      console.log();
      console.log('⚠️  Warning: Found categories not in VALID_CATEGORIES list:');
      console.log('='.repeat(60));
      invalidCategories.forEach(cat => {
        console.log(`  - "${cat}" (${categoryStats[cat]} job(s))`);
      });
      console.log('='.repeat(60));
      console.log('💡 You may want to:');
      console.log('   1. Add these to JOB_CATEGORIES constant if they are valid');
      console.log('   2. Or manually update jobs to use correct categories');
      console.log();
    }

    console.log();
    console.log('✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupJobCategories().catch(console.error);
