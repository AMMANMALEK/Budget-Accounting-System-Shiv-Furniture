const express = require('express');
const budgetService = require('../services/budgetService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');
const { budgetDAL } = require('../database/dal');

const router = express.Router();

// GET /api/budgets
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await budgetDAL.getAll(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      error: 'Failed to fetch budgets',
      type: 'ServerError'
    });
  }
});

// GET /api/budgets/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const budget = await budgetDAL.getById(req.params.id);
    if (!budget) {
      return res.status(404).json({
        error: 'Budget not found',
        type: 'NotFoundError'
      });
    }
    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget',
      type: 'ServerError'
    });
  }
});

// POST /api/budgets
router.post('/', requireAuth, createResourceAccessMiddleware('budget', 'create'), async (req, res) => {
  try {
    // Get existing budgets for overlap validation
    const existingBudgets = await budgetDAL.getOverlapping(
      req.body.analytic_account_id,
      req.body.date_from,
      req.body.date_to
    );
    
    const result = await budgetService.createBudget(req.body, existingBudgets, budgetDAL.create);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.errors ? result.errors.join(', ') : result.error,
        type: 'ValidationError',
        details: result.errors
      });
    }

    res.status(201).json(result.budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      error: 'Failed to create budget',
      type: 'ServerError'
    });
  }
});

// PUT /api/budgets/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('budget', 'update'), async (req, res) => {
  try {
    // Get existing budgets for overlap validation (excluding current budget)
    const existingBudgets = await budgetDAL.getOverlapping(
      req.body.analytic_account_id,
      req.body.date_from,
      req.body.date_to,
      req.params.id
    );
    
    const result = await budgetService.updateBudget(
      req.params.id,
      req.body,
      existingBudgets,
      budgetDAL.update
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.errors ? result.errors.join(', ') : result.error,
        type: result.type || 'ValidationError',
        details: result.errors
      });
    }

    res.json(result.budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      error: 'Failed to update budget',
      type: 'ServerError'
    });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('budget', 'delete'), async (req, res) => {
  try {
    const result = await budgetService.deleteBudget(req.params.id, budgetDAL.delete);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        type: result.type || 'ValidationError'
      });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      error: 'Failed to delete budget',
      type: 'ServerError'
    });
  }
});

module.exports = router;