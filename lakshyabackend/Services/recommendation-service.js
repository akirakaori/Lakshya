/**
 * Job Recommendation Service
 * --------------------------
 * Scores every open/active job against the logged-in job seeker's profile.
 *
 * Scoring formula (deterministic, no embeddings):
 *   finalScore = 0.7 * skillScore + 0.2 * locationScore + 0.1 * experienceScore
 *   recommendationScore = Math.round(finalScore * 100)
 *
 * Reuses computeSkillMatch from job-match-service for consistent skill logic.
 */

const UserModel = require('../models/user-model');
const JobModel = require('../models/job-model');
const ApplicationModel = require('../models/application-model');
const { computeSkillMatch } = require('./job-match-service');

const TOP_N = 6;
const INTERNAL_TEST_JOB_EXCLUSION = {
  isTestData: { $ne: true },
  $nor: [
    {
      title: /^Withdraw Flow QA$/i,
      companyName: /^TestCo$/i,
      description: /withdraw lifecycle/i,
    },
  ],
};

// --------------- Experience helpers -----------------

/**
 * Parse a rough number of years from a free-text experience string.
 * e.g. "3 years of React experience" → 3
 *      "5+ years"                    → 5
 * Returns null if unable to parse.
 */
function parseExperienceYears(experienceText) {
  if (!experienceText || typeof experienceText !== 'string') return null;
  const match = experienceText.match(/(\d+)\s*\+?\s*year/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Map a job's experienceLevel label to an approximate [minYears, maxYears] band.
 * Returns null when the level is unknown / unset (treated as "no constraint").
 */
function experienceLevelToBand(level) {
  if (!level || typeof level !== 'string') return null;
  const l = level.toLowerCase();

  if (l.includes('intern')) return [0, 1];
  if (l.includes('entry') || l.includes('junior') || l.includes('fresher')) return [0, 2];
  if (l.includes('mid') || l.includes('intermediate')) return [2, 5];
  if (l.includes('senior')) return [5, 99];
  if (l.includes('lead') || l.includes('principal') || l.includes('staff')) return [7, 99];

  // Numeric patterns like "0-1", "1-3", "5+"
  const rangeMatch = l.match(/^(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
  const plusMatch = l.match(/^(\d+)\s*\+/);
  if (plusMatch) return [parseInt(plusMatch[1]), 99];

  return null;
}

/**
 * Returns 0..1 expressing how well the user's experience fits the job's level.
 * 1.0  = within band
 * 0.5  = adjacent band (one level off — don't hard-penalise)
 * 0.5  = unknown data (neutral)
 * 0.0  = clearly outside band
 */
function computeExperienceScore(user, job) {
  const userYears = parseExperienceYears(user.jobSeeker?.experience);
  const band = experienceLevelToBand(job.experienceLevel);

  // Missing data → neutral
  if (userYears === null || band === null) return 0.5;

  const [min, max] = band;
  if (userYears >= min && userYears <= max) return 1;
  if (userYears === min - 1 || userYears === max + 1) return 0.5;
  return 0;
}

// --------------- Location helper -----------------

/**
 * Returns 1 if user's preferredLocation partially matches job location, else 0.
 * Case-insensitive, handles substring matches (city inside "City, Country").
 */
function computeLocationScore(user, job) {
  const preferred = (user.jobSeeker?.preferredLocation || '').toLowerCase().trim();
  const jobLocation = (job.location || '').toLowerCase().trim();
  if (!preferred || !jobLocation) return 0;
  return preferred === jobLocation ||
    jobLocation.includes(preferred) ||
    preferred.includes(jobLocation)
    ? 1
    : 0;
}

// --------------- Core scorer -----------------

function scoreJob(user, job) {
  const { matchedSkills, missingSkills, skillScore } = computeSkillMatch(
    user.jobSeeker?.skills,
    job.skillsRequired
  );

  const locationScore = computeLocationScore(user, job);
  const experienceScore = computeExperienceScore(user, job);

  const finalScore = 0.7 * skillScore + 0.2 * locationScore + 0.1 * experienceScore;
  const recommendationScore = Math.round(finalScore * 100);

  return { matchedSkills, missingSkills, recommendationScore };
}

// --------------- Public API -----------------

/**
 * Compute and return the top-N recommended jobs for a job seeker.
 *
 * Rules:
 *  - Only open + active + non-deleted jobs
 *  - Exclude jobs the user has already applied for
 *  - If user has no skills → include all jobs as "low-confidence" (score capped at 30)
 *  - Sorted descending by recommendationScore, then by newest posting as tiebreaker
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getRecommendedJobsForUser(userId) {
  const [user, applications] = await Promise.all([
    UserModel.findById(userId),
    ApplicationModel.find({ applicant: userId }).select('jobId').lean(),
  ]);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const appliedJobIds = new Set(applications.map((a) => a.jobId.toString()));

  const jobs = await JobModel.find({
    status: 'open',
    isActive: true,
    isDeleted: { $ne: true },
    ...INTERNAL_TEST_JOB_EXCLUSION,
  }).lean();

  const userHasSkills = (user.jobSeeker?.skills || []).length > 0;

  const scored = jobs
    .filter((job) => !appliedJobIds.has(job._id.toString()))
    .map((job) => {
      const { matchedSkills, missingSkills, recommendationScore } = scoreJob(user, job);
      return {
        _id: job._id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        jobType: job.jobType,
        remoteType: job.remoteType,
        experienceLevel: job.experienceLevel,
        category: job.category,
        salary: job.salary,
        salaryVisible: job.salaryVisible,
        createdAt: job.createdAt,
        recommendationScore: userHasSkills ? recommendationScore : Math.min(recommendationScore, 30),
        matchedSkills,
        missingSkills,
        isLowConfidence: !userHasSkills,
      };
    });

  // Sort: highest score first, newest post as tiebreaker
  scored.sort((a, b) => {
    if (b.recommendationScore !== a.recommendationScore) {
      return b.recommendationScore - a.recommendationScore;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return scored.slice(0, TOP_N);
}

module.exports = { getRecommendedJobsForUser };
