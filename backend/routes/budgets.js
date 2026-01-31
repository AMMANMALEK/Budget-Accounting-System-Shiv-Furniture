const express = require('express');
const budgetService = require('../services/budgetService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');
const { budgetDAL } = require('../database/dal');

const router = express.Router();

const parseUiPeriodToDates = (period) => {
  const now = new Date();
  const year = now.getFullYear();
  const p = (period || '').toString().trim().toUpperCase();
  if (p === 'Q1' || p === 'Q1 ' + year || p.includes('Q1')) {
    return { date_from: `${year}-01-01`, date_to: `${year}-03-31` };
  }
  if (p === 'Q2' || p.includes('Q2')) {
    return { date_from: `${year}-04-01`, date_to: `${year}-06-30` };
  }
  if (p === 'Q3' || p.includes('Q3')) {
    return { date_from: `${year}-07-01`, date_to: `${year}-09-30` };
  }
  if (p === 'Q4' || p.includes('Q4')) {
    return { date_from: `${year}-10-01`, date_to: `${year}-12-31` };
  }

  return { date_from: `${year}-01-01`, date_to: `${year}-12-31` };
};

const mapUiToBudgetPayload = (payload = {}) => {
  const planned_amount = Number(payload.planned_amount ?? payload.amount ?? payload.total_planned_amount) || 0;
  const analytic_account_id = payload.analytic_account_id ?? payload.analyticAccountId ?? payload.costCenterId ?? 1;
  const date_from = payload.date_from ?? payload.dateFrom;
  const date_to = payload.date_to ?? payload.dateTo;

  const dates = date_from && date_to ? { date_from, date_to } : parseUiPeriodToDates(payload.period);

  return {
    name: payload.name,
    analytic_account_id,
    date_from: dates.date_from,
    date_to: dates.date_to,
    planned_amount,

    // Keep UI-only fields so frontend tables/forms keep working
    period: payload.period,
    amount: payload.amount,
    allocated: payload.allocated,
    status: payload.status
  };
};

const mapBudgetToUi = (budget) => {
  if (!budget) return budget;
  const amount = Number(budget.planned_amount ?? budget.total_planned_amount ?? budget.amount) || 0;
  return {
    ...budget,
    id: budget.id,
    name: budget.name,
    period: budget.period || '',
    amount,
    allocated: Number(budget.allocated) || 0,
    state: budget.state || (budget.status ? budget.status.toString().toUpperCase() : undefined),
  };
};

// GET /api/budgets
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await budgetDAL.getAll(parseInt(page), parseInt(limit), search);
    res.json({
      ...result,
      data: (result.data || []).map(mapBudgetToUi)
    });
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
    res.json(mapBudgetToUi(budget));
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
    const payload = mapUiToBudgetPayload(req.body);
    // Get existing budgets for overlap validation
    const existingBudgets = await budgetDAL.getOverlapping(
      payload.analytic_account_id,
      payload.date_from,
      payload.date_to
    );

    const result = await budgetService.createBudget(payload, existingBudgets, budgetDAL.create);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.errors ? result.errors.join(', ') : result.error,
        type: 'ValidationError',
        details: result.errors
      });
    }

    res.status(201).json(mapBudgetToUi({ ...result.budget, ...payload }));
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
    const payload = mapUiToBudgetPayload(req.body);
    // Get existing budgets for overlap validation (excluding current budget)
    const existingBudgets = await budgetDAL.getOverlapping(
      payload.analytic_account_id,
      payload.date_from,
      payload.date_to,
      req.params.id
    );

    const result = await budgetService.updateBudget(
      req.params.id,
      payload,
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

    res.json(mapBudgetToUi({ ...result.budget, ...payload }));
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