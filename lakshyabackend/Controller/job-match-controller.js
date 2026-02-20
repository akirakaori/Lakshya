const { getOrComputeMatch, getBatchMatchScores } = require('../Services/job-match-service');

/**
 * GET /api/job-seeker/jobs/:jobId/match
 * Returns match analysis (cached or freshly computed) for the authenticated job seeker.
 */
const getJobMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const analysis = await getOrComputeMatch(userId, jobId);

    res.status(200).json({
      success: true,
      message: 'Match analysis retrieved',
      data: {
        matchScore: analysis.matchScore,
        skillScorePercent: analysis.skillScorePercent,
        semanticPercent: analysis.semanticPercent,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        suggestions: analysis.suggestions,
        summaryRewrite: analysis.summaryRewrite,
        suggestionSource: analysis.suggestionSource,
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (error) {
    console.error('[getJobMatch] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * POST /api/job-seeker/jobs/match-scores
 * Returns cached match scores for multiple jobs (batch endpoint).
 * Body: { jobIds: string[] }
 * Response: { [jobId]: { matchScore: number, analyzedAt: string, source: "cache" } | { matchScore: null, source: "missing" } }
 */
const getJobMatchScores = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobIds } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'jobIds array is required and must not be empty' 
      });
    }

    // Limit batch size to prevent abuse
    if (jobIds.length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 100 jobIds allowed per request' 
      });
    }

    const matchScores = await getBatchMatchScores(userId, jobIds);

    res.status(200).json({
      success: true,
      message: 'Match scores retrieved',
      data: matchScores,
    });
  } catch (error) {
    console.error('[getJobMatchScores] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = { getJobMatch, getJobMatchScores };
