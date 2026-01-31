const express = require('express');
const { dashboardDAL } = require('../database/dal');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/admin/dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const dashboardData = await dashboardDAL.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      type: 'ServerError'
    });
  }
});

module.exports = router;