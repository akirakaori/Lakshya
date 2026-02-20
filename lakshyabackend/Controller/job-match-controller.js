const { getOrComputeMatch, getBatchMatchScores, getCachedMatchWithOutdatedFlag, computeAndUpsertMatch } = require('../Services/job-match-service');

/**
 * GET /api/job-seeker/jobs/:jobId/match
 * Returns cached match analysis (if exists) with isOutdated flag.
 * Does NOT compute — user must click "Analyze" button to trigger POST /analyze.
 */
const getJobMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;
    
    console.log(`🔍 GET /match: userId=${userId}, jobId=${jobId}`);

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const { analysis, isOutdated } = await getCachedMatchWithOutdatedFlag(userId, jobId);

    if (!analysis) {
      console.log(`ℹ️ No analysis found for user=${userId} job=${jobId}`);
      return res.status(200).json({
        success: true,
        message: 'No analysis found',
        data: null,
        isOutdated: false,
      });
    }

    console.log(`✅ Match analysis retrieved for user=${userId} job=${jobId}, isOutdated=${isOutdated}`);
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
      isOutdated,
    });
  } catch (error) {
    console.error('[getJobMatch] Error:', error.message);
    console.error('Error details:', { 
      userId: req.user?.id, 
      jobId: req.params?.jobId,
      hasAuthHeader: !!req.headers.authorization,
      errorStack: error.stack
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * POST /api/job-seeker/jobs/:jobId/analyze
 * Computes fresh match analysis and upserts into JobMatchAnalysis.
 * Called when user explicitly clicks "Analyze My Match" or "Analyze Again".
 */
const analyzeJobMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;
    
    console.log(`🔬 POST /analyze: userId=${userId}, jobId=${jobId}`);

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const analysis = await computeAndUpsertMatch(userId, jobId);
    
    console.log(`✅ Match analysis computed for user=${userId} job=${jobId}, score=${analysis.matchScore}`);

    res.status(200).json({
      success: true,
      message: 'Match analysis computed',
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
      isOutdated: false, // Fresh analysis
    });
  } catch (error) {
    console.error('[analyzeJobMatch] Error:', error.message);
    console.error('Error details:', { 
      userId: req.user?.id, 
      jobId: req.params?.jobId,
      hasAuthHeader: !!req.headers.authorization,
      errorStack: error.stack
    });
    
    // Return user-friendly error message
    const statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    
    if (message.includes('timeout') || message.includes('ECONNREFUSED')) {
      message = 'Analysis service is temporarily unavailable. Please try again.';
    }
    
    res.status(statusCode).json({
      success: false,
      message,
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

module.exports = { getJobMatch, analyzeJobMatch, getJobMatchScores };
