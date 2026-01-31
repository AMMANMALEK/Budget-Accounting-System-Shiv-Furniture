const express = require('express');
const costCenterService = require('../services/costCenterService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');
const { analyticAccountDAL } = require('../database/dal');

const router = express.Router();

// GET /api/cost-centers
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await analyticAccountDAL.getAll(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    console.error('Get analytic accounts error:', error);
    res.status(500).json({
      error: 'Failed to fetch cost centers',
      type: 'ServerError'
    });
  }
});

// GET /api/cost-centers/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const analyticAccount = await analyticAccountDAL.getById(req.params.id);
    if (!analyticAccount) {
      return res.status(404).json({
        error: 'Cost center not found',
        type: 'NotFoundError'
      });
    }
    res.json(analyticAccount);
  } catch (error) {
    console.error('Get analytic account error:', error);
    res.status(500).json({
      error: 'Failed to fetch cost center',
      type: 'ServerError'
    });
  }
});

// POST /api/cost-centers
router.post('/', requireAuth, createResourceAccessMiddleware('costcenter', 'create'), async (req, res) => {
  try {
    // Basic validation
    if (!req.body.name) {
      return res.status(400).json({
        error: 'Name is required',
        type: 'ValidationError'
      });
    }

    const newAnalyticAccount = await analyticAccountDAL.create({
      name: req.body.name,
      code: req.body.code || req.body.name.toUpperCase().replace(/\s+/g, '_')
    });

    res.status(201).json(newAnalyticAccount);
  } catch (error) {
    console.error('Create analytic account error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Cost center with this name or code already exists',
        type: 'ConflictError'
      });
    }
    res.status(500).json({
      error: 'Failed to create cost center',
      type: 'ServerError'
    });
  }
});

// PUT /api/cost-centers/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('costcenter', 'update'), async (req, res) => {
  try {
    // Basic validation
    if (!req.body.name) {
      return res.status(400).json({
        error: 'Name is required',
        type: 'ValidationError'
      });
    }

    const updatedAnalyticAccount = await analyticAccountDAL.update(req.params.id, {
      name: req.body.name,
      code: req.body.code || req.body.name.toUpperCase().replace(/\s+/g, '_')
    });
    
    if (!updatedAnalyticAccount) {
      return res.status(404).json({
        error: 'Cost center not found',
        type: 'NotFoundError'
      });
    }

    res.json(updatedAnalyticAccount);
  } catch (error) {
    console.error('Update analytic account error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Cost center with this name or code already exists',
        type: 'ConflictError'
      });
    }
    res.status(500).json({
      error: 'Failed to update cost center',
      type: 'ServerError'
    });
  }
});

// DELETE /api/cost-centers/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('costcenter', 'delete'), async (req, res) => {
  try {
    const deletedAnalyticAccount = await analyticAccountDAL.delete(req.params.id);
    
    if (!deletedAnalyticAccount) {
      return res.status(404).json({
        error: 'Cost center not found',
        type: 'NotFoundError'
      });
    }

    res.json({ message: 'Cost center deleted successfully' });
  } catch (error) {
    console.error('Delete analytic account error:', error);
    res.status(500).json({
      error: 'Failed to delete cost center',
      type: 'ServerError'
    });
  }
});

module.exports = router;