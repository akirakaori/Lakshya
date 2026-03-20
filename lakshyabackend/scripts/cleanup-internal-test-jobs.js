require('dotenv').config();
const mongoose = require('mongoose');
const JobModel = require('../models/job-model');
const ApplicationModel = require('../models/application-model');
const UserModel = require('../models/user-model');

const run = async () => {
  if (!process.env.MONGO_CONN) {
    throw new Error('MONGO_CONN is not set.');
  }

  await mongoose.connect(process.env.MONGO_CONN);

  const testJobFilter = {
    $or: [
      { isTestData: true },
      {
        title: /^Withdraw Flow QA$/i,
        companyName: /^TestCo$/i,
        description: /withdraw lifecycle/i,
      },
    ],
  };

  const jobs = await JobModel.find(testJobFilter).select('_id title companyName').lean();

  if (jobs.length === 0) {
    console.log('No internal test jobs found.');
    await mongoose.disconnect();
    return;
  }

  const jobIds = jobs.map((job) => job._id);

  const [applicationsResult, usersResult, jobsResult] = await Promise.all([
    ApplicationModel.deleteMany({ jobId: { $in: jobIds } }),
    UserModel.updateMany(
      { savedJobs: { $in: jobIds } },
      { $pull: { savedJobs: { $in: jobIds } } }
    ),
    JobModel.deleteMany({ _id: { $in: jobIds } }),
  ]);

  console.log('Deleted test jobs:', jobs.length);
  console.log('Removed related applications:', applicationsResult.deletedCount || 0);
  console.log('Updated users savedJobs:', usersResult.modifiedCount || 0);
  console.log('Deleted job records:', jobsResult.deletedCount || 0);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Cleanup failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
