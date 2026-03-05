const landingService = require('../Services/landing-service');

/**
 * Get landing page data (stats + recent jobs)
 * Public endpoint - no authentication required
 */
const getLandingData = async (req, res) => {
  try {
    const data = await landingService.getLandingData();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching landing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch landing data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search jobs (public endpoint)
 * Query params: keyword, page, limit
 */
const searchPublicJobs = async (req, res) => {
  try {
    const { keyword = '', page = 1, limit = 8 } = req.query;
    
    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 results per page
    
    const data = await landingService.searchPublicJobs(keyword, pageNum, limitNum);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getLandingData,
  searchPublicJobs
};
