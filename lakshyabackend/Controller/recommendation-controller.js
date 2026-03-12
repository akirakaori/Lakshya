const { getRecommendedJobsForUser } = require('../Services/recommendation-service');

/**
 * GET /api/job-seeker/recommendations
 * Returns top recommended jobs for the logged-in job seeker.
 */
async function getRecommendations(req, res, next) {
  try {
    const userId = req.user.id;
    const recommendations = await getRecommendedJobsForUser(userId);
    res.json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendations };
