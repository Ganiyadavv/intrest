const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.user.userId);
    return res.status(200).json({ statusCode: 200, status: 'SUCCESS', message: 'Dashboard fetched successfully', data: dashboard });
  } catch (error) {
    return res.status(500).json({ statusCode: 500, status: 'ERROR', message: error.message });
  }
};

module.exports = { getDashboard };
