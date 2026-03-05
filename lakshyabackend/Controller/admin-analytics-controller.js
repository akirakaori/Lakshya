const { getAdminAnalyticsService } = require('../Services/admin-analytics-service');

const getAdminAnalytics = async (req, res) => {
  try {
    const result = await getAdminAnalyticsService();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAdminAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics data'
    });
  }
};

module.exports = { getAdminAnalytics };
