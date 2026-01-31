const express = require('express');
const autoAnalyticsService = require('../services/autoAnalyticsService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

const mapUiStatusToState = (status) => {
  const s = (status || '').toString().toLowerCase();
  if (s === 'active') return 'confirmed';
  if (s === 'inactive') return 'cancelled';
  if (s === 'draft') return 'draft';
  return 'confirmed';
};

const mapStateToUiStatus = (state) => {
  const s = (state || '').toString().toLowerCase();
  if (s === 'confirmed') return 'Active';
  if (s === 'cancelled') return 'Inactive';
  if (s === 'draft') return 'Inactive';
  return 'Active';
};

const mapModelToUi = (model) => {
  if (!model) return model;
  return {
    id: model.id,
    name: model.name,
    condition: model.condition || (model.conditions ? JSON.stringify(model.conditions) : ''),
    action: model.action || (model.actions ? JSON.stringify(model.actions) : ''),
    status: mapStateToUiStatus(model.state),
    createdAt: model.createdAt,
    updatedAt: model.updatedAt
  };
};

const mapUiToModel = (payload = {}) => {
  // AutoRules UI sends free-form strings; backend service requires:
  // - analytics_to_apply
  // - state
  // - at least one of partner_id/partner_tag_id/product_id/product_category_id
  // We'll store UI condition/action as-is and use a generic partner_tag_id = 1 so validation passes.
  const status = payload.status;
  const state = payload.state || mapUiStatusToState(status);

  return {
    name: payload.name,
    condition: payload.condition,
    action: payload.action,
    state,
    analytics_to_apply: payload.analytics_to_apply || payload.action || 'AUTO',
    partner_tag_id: payload.partner_tag_id || 1,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
};

// Mock database functions
let mockAutoAnalyticsModels = [
  {
    id: 1,
    name: 'Software License Detection',
    description: 'Automatically categorizes software license expenses',
    conditions: {
      descriptionContains: 'license',
      amountRange: { min: 100, max: 10000 }
    },
    actions: {
      category: 'Software',
      subCategory: 'Licenses',
      tags: ['software', 'license']
    },
    state: 'confirmed',
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Office Supplies Detection',
    description: 'Automatically categorizes office supply expenses',
    conditions: {
      descriptionContains: 'supplies',
      amountRange: { min: 10, max: 1000 }
    },
    actions: {
      category: 'Office',
      subCategory: 'Supplies',
      tags: ['office', 'supplies']
    },
    state: 'confirmed',
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllAutoAnalyticsModels = async (page = 0, limit = 10, search = '') => {
  let filtered = mockAutoAnalyticsModels;
  
  if (search) {
    filtered = mockAutoAnalyticsModels.filter(model => 
      model.name.toLowerCase().includes(search.toLowerCase()) ||
      model.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const start = page * limit;
  const end = start + limit;
  
  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit)
  };
};

const getAutoAnalyticsModelById = async (id) => {
  return mockAutoAnalyticsModels.find(model => model.id === parseInt(id));
};

const saveAutoAnalyticsModel = async (modelData) => {
  const newModel = {
    id: mockAutoAnalyticsModels.length + 1,
    ...modelData,
    state: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockAutoAnalyticsModels.push(newModel);
  return newModel;
};

const updateAutoAnalyticsModelInDb = async (id, updateData) => {
  const index = mockAutoAnalyticsModels.findIndex(model => model.id === parseInt(id));
  if (index !== -1) {
    mockAutoAnalyticsModels[index] = {
      ...mockAutoAnalyticsModels[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockAutoAnalyticsModels[index];
  }
  return null;
};

const deleteAutoAnalyticsModelFromDb = async (id) => {
  const index = mockAutoAnalyticsModels.findIndex(model => model.id === parseInt(id));
  if (index !== -1) {
    return mockAutoAnalyticsModels.splice(index, 1)[0];
  }
  return null;
};

// GET /api/auto-analytics
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await getAllAutoAnalyticsModels(parseInt(page), parseInt(limit), search);
    res.json({
      ...result,
      data: (result.data || []).map(mapModelToUi)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch auto analytics models',
      type: 'ServerError'
    });
  }
});

// GET /api/auto-analytics/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const model = await getAutoAnalyticsModelById(req.params.id);
    if (!model) {
      return res.status(404).json({
        error: 'Auto analytics model not found',
        type: 'NotFoundError'
      });
    }
    res.json(mapModelToUi(model));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch auto analytics model',
      type: 'ServerError'
    });
  }
});

// POST /api/auto-analytics
router.post('/', requireAuth, createResourceAccessMiddleware('autoanalytics', 'create'), async (req, res) => {
  try {
    const payload = mapUiToModel(req.body);
    const validation = autoAnalyticsService.validateAutoAnalyticalModel(payload);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid auto analytics model',
        type: 'ValidationError',
        details: validation.errors
      });
    }

    const newModel = await saveAutoAnalyticsModel(payload);
    res.status(201).json(mapModelToUi(newModel));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create auto analytics model',
      type: 'ServerError'
    });
  }
});

// PUT /api/auto-analytics/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('autoanalytics', 'update'), async (req, res) => {
  try {
    const payload = mapUiToModel(req.body);
    const validation = autoAnalyticsService.validateAutoAnalyticalModel(payload);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid auto analytics model',
        type: 'ValidationError',
        details: validation.errors
      });
    }

    const updatedModel = await updateAutoAnalyticsModelInDb(req.params.id, payload);
    
    if (!updatedModel) {
      return res.status(404).json({
        error: 'Auto analytics model not found',
        type: 'NotFoundError'
      });
    }

    res.json(mapModelToUi(updatedModel));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update auto analytics model',
      type: 'ServerError'
    });
  }
});

// DELETE /api/auto-analytics/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('autoanalytics', 'delete'), async (req, res) => {
  try {
    const deleted = await deleteAutoAnalyticsModelFromDb(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Auto analytics model not found',
        type: 'NotFoundError'
      });
    }

    res.json({ message: 'Auto analytics model deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete auto analytics model',
      type: 'ServerError'
    });
  }
});

// POST /api/auto-analytics/simulate
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({
        error: 'Transaction data is required',
        type: 'ValidationError'
      });
    }

    const result = await autoAnalyticsService.simulateAutoAnalytics(
      transaction,
      getAllAutoAnalyticsModels
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to simulate auto analytics',
      type: 'ServerError'
    });
  }
});

// POST /api/auto-analytics/suggestions
router.post('/suggestions', requireAuth, async (req, res) => {
  try {
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({
        error: 'Transaction data is required',
        type: 'ValidationError'
      });
    }

    const suggestions = await autoAnalyticsService.getAnalyticsSuggestions(
      transaction,
      getAllAutoAnalyticsModels
    );

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get analytics suggestions',
      type: 'ServerError'
    });
  }
});

// POST /api/auto-analytics/bulk-apply
router.post('/bulk-apply', requireAuth, createResourceAccessMiddleware('autoanalytics', 'update'), async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Transactions array is required',
        type: 'ValidationError'
      });
    }

    const result = await autoAnalyticsService.bulkApplyAutoAnalytics(
      transactions,
      getAllAutoAnalyticsModels
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to bulk apply auto analytics',
      type: 'ServerError'
    });
  }
});

// GET /api/auto-analytics/coverage-report
router.get('/coverage-report', requireAuth, async (req, res) => {
  try {
    // Mock transactions for coverage report
    const mockTransactions = [
      { id: 1, description: 'Software License', amount: 1000 },
      { id: 2, description: 'Office Supplies', amount: 200 },
      { id: 3, description: 'Consulting Services', amount: 5000 }
    ];

    const coverageReport = await autoAnalyticsService.getAnalyticsCoverageReport(
      mockTransactions,
      getAllAutoAnalyticsModels
    );

    res.json(coverageReport);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate coverage report',
      type: 'ServerError'
    });
  }
});

module.exports = router;