const publicService = require('../Services/public-service');

/**
 * Get landing page data (stats + recent jobs)
 * Public endpoint - no authentication required
 */
const getLandingData = async (req, res) => {
  try {
    const data = await publicService.getLandingData();
    
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

module.exports = {
  getLandingData
};
