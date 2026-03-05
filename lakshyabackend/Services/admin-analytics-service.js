const UserModel = require('../models/user-model');
const JobModel = require('../models/job-model');
const ApplicationModel = require('../models/application-model');

const getAdminAnalyticsService = async () => {
  try {
    // Get current date boundaries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf14Days = new Date(today);
    startOf14Days.setDate(startOf14Days.getDate() - 13); // Last 14 days including today

    // 1. TOTALS - Run aggregations in parallel
    const [
      totalUsersCount,
      totalRecruitersCount,
      totalJobSeekersCount,
      totalJobsCount,
      openJobsCount,
      closedJobsCount,
      totalApplicationsCount,
      applicationsTodayCount,
      previousPeriodStats
    ] = await Promise.all([
      // Total users (excluding admin)
      UserModel.countDocuments({ role: { $ne: 'admin' } }),
      
      // Total recruiters (active)
      UserModel.countDocuments({ role: 'recruiter', isActive: true }),
      
      // Total job seekers (active)
      UserModel.countDocuments({ role: 'job_seeker', isActive: true }),
      
      // Total jobs (all, including deleted)
      JobModel.countDocuments({}),
      
      // Open jobs
      JobModel.countDocuments({ status: 'open', isDeleted: { $ne: true } }),
      
      // Closed jobs
      JobModel.countDocuments({ status: 'closed' }),
      
      // Total applications
      ApplicationModel.countDocuments({}),
      
      // Applications today
      ApplicationModel.countDocuments({ createdAt: { $gte: today } }),
      
      // Previous 14 days stats for percentage calculation
      (async () => {
        const prev14DaysStart = new Date(startOf14Days);
        prev14DaysStart.setDate(prev14DaysStart.getDate() - 14);
        
        return {
          users: await UserModel.countDocuments({ 
            role: { $ne: 'admin' },
            createdAt: { $gte: prev14DaysStart, $lt: startOf14Days }
          }),
          jobSeekers: await UserModel.countDocuments({ 
            role: 'job_seeker', 
            isActive: true,
            createdAt: { $gte: prev14DaysStart, $lt: startOf14Days }
          }),
          recruiters: await UserModel.countDocuments({ 
            role: 'recruiter', 
            isActive: true,
            createdAt: { $gte: prev14DaysStart, $lt: startOf14Days }
          }),
          jobs: await JobModel.countDocuments({ 
            status: 'open',
            createdAt: { $gte: prev14DaysStart, $lt: startOf14Days }
          })
        };
      })()
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    // 2. TREND 14D - Applications per day for last 14 days
    const trendData = await ApplicationModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf14Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill missing days with 0
    const trend14d = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(startOf14Days);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = trendData.find(d => d._id === dateStr);
      trend14d.push({
        date: dateStr,
        count: existing ? existing.count : 0
      });
    }

    // 3. TOP JOBS - Top 5 jobs by application count
    const topJobsData = await ApplicationModel.aggregate([
      {
        $group: {
          _id: '$jobId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: JobModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: { path: '$job', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          jobId: '$_id',
          title: { $ifNull: ['$job.title', 'Unknown Job'] },
          companyName: { $ifNull: ['$job.companyName', 'Unknown Company'] },
          count: 1,
          _id: 0
        }
      }
    ]);

    // 4. TOP SKILLS - Top 8 skills from job postings
    let topSkills = [];
    try {
      topSkills = await JobModel.aggregate([
        {
          $match: {
            skillsRequired: { $exists: true, $ne: [] },
            isDeleted: { $ne: true }
          }
        },
        {
          $unwind: '$skillsRequired'
        },
        {
          $project: {
            skill: {
              $trim: {
                input: { $toLower: '$skillsRequired' }
              }
            }
          }
        },
        {
          $match: {
            skill: { $ne: '' }
          }
        },
        {
          $group: {
            _id: '$skill',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 8
        },
        {
          $project: {
            skill: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('Could not calculate top skills:', error.message);
      topSkills = [];
    }

    // 5. RECRUITER ACTIVITY - Jobs posted + Applications received per recruiter
    const recruiterActivity = await JobModel.aggregate([
      {
        $match: {
          createdBy: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          jobsPosted: { $sum: 1 },
          jobIds: { $push: '$_id' }
        }
      },
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'recruiter'
        }
      },
      {
        $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: ApplicationModel.collection.name,
          let: { jobIds: '$jobIds' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$jobId', '$$jobIds'] }
              }
            },
            {
              $count: 'total'
            }
          ],
          as: 'applications'
        }
      },
      {
        $project: {
          recruiterId: '$_id',
          recruiterName: { $ifNull: ['$recruiter.name', 'Unknown Recruiter'] },
          recruiterEmail: { $ifNull: ['$recruiter.email', 'N/A'] },
          jobsPosted: 1,
          applicationsReceived: {
            $ifNull: [{ $arrayElemAt: ['$applications.total', 0] }, 0]
          },
          status: { 
            $cond: [
              { $ifNull: ['$recruiter.isActive', false] },
              'Active',
              'Inactive'
            ]
          },
          _id: 0
        }
      },
      {
        $sort: { applicationsReceived: -1 }
      },
      {
        $limit: 20
      }
    ]);

    return {
      success: true,
      data: {
        totals: {
          totalUsers: totalUsersCount,
          totalRecruiters: totalRecruitersCount,
          totalJobSeekers: totalJobSeekersCount,
          totalJobs: totalJobsCount,
          openJobs: openJobsCount,
          closedJobs: closedJobsCount,
          totalApplications: totalApplicationsCount,
          applicationsToday: applicationsTodayCount,
          // Percentage changes
          userChange: calculateChange(totalUsersCount, previousPeriodStats.users),
          jobSeekerChange: calculateChange(totalJobSeekersCount, previousPeriodStats.jobSeekers),
          recruiterChange: calculateChange(totalRecruitersCount, previousPeriodStats.recruiters),
          jobChange: calculateChange(openJobsCount, previousPeriodStats.jobs)
        },
        trend14d,
        topJobs: topJobsData,
        topSkills,
        recruiterActivity
      }
    };
  } catch (error) {
    console.error('Error in getAdminAnalyticsService:', error);
    throw error;
  }
};

module.exports = { getAdminAnalyticsService };
