const express = require('express');
const productionExpenseService = require('../services/productionExpenseService');
const autoAnalyticsService = require('../services/autoAnalyticsService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

// Mock database functions
let mockProductionExpenses = [
  {
    id: 1,
    costCenterId: 3,
    amount: 2000,
    description: 'Raw Materials',
    status: 'draft',
    expenseDate: '2024-01-25',
    productId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllProductionExpenses = async (page = 0, limit = 10, search = '') => {
  let filtered = mockProductionExpenses;
  
  if (search) {
    filtered = mockProductionExpenses.filter(expense => 
      expense.description.toLowerCase().includes(search.toLowerCase())
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

const getProductionExpenseById = async (id) => {
  return mockProductionExpenses.find(pe => pe.id === parseInt(id));
};

const saveProductionExpense = async (productionExpenseData) => {
  const newProductionExpense = {
    id: mockProductionExpenses.length + 1,
    ...productionExpenseData,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockProductionExpenses.push(newProductionExpense);
  return newProductionExpense;
};

const updateProductionExpenseInDb = async (id, updateData) => {
  const index = mockProductionExpenses.findIndex(pe => pe.id === parseInt(id));
  if (index !== -1) {
    mockProductionExpenses[index] = {
      ...mockProductionExpenses[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockProductionExpenses[index];
  }
  return null;
};

const updateProductionExpenseStatus = async (id, status) => {
  return updateProductionExpenseInDb(id, { status });
};

const deleteProductionExpenseFromDb = async (id) => {
  const index = mockProductionExpenses.findIndex(pe => pe.id === parseInt(id));
  if (index !== -1) {
    return mockProductionExpenses.splice(index, 1)[0];
  }
  return null;
};

const getAutoAnalyticalModels = async () => {
  return [
    {
      id: 1,
      name: 'Raw Materials Detection',
      conditions: { descriptionContains: 'materials' },
      actions: { category: 'Production', subCategory: 'Raw Materials' }
    }
  ];
};

// GET /api/production-expenses
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await getAllProductionExpenses(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch production expenses',
      type: 'ServerError'
    });
  }
});

// GET /api/production-expenses/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const productionExpense = await getProductionExpenseById(req.params.id);
    if (!productionExpense) {
      return res.status(404).json({
        error: 'Production expense not found',
        type: 'NotFoundError'
      });
    }
    res.json(productionExpense);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch production expense',
      type: 'ServerError'
    });
  }
});

// POST /api/production-expenses
router.post('/', requireAuth, createResourceAccessMiddleware('productionexpense', 'create'), async (req, res) => {
  try {
    const result = await productionExpenseService.createProductionExpense(req.body, saveProductionExpense);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        type: 'ValidationError',
        details: result.errors
      });
    }

    // Apply auto analytics
    try {
      const analyticsResult = await autoAnalyticsService.applyAutoAnalytics(
        result.productionExpense,
        getAutoAnalyticalModels
      );
      if (analyticsResult.success && analyticsResult.updatedTransaction) {
        await updateProductionExpenseInDb(result.productionExpense.id, analyticsResult.updatedTransaction);
        result.productionExpense = { ...result.productionExpense, ...analyticsResult.updatedTransaction };
      }
    } catch (analyticsError) {
      console.warn('Auto analytics failed:', analyticsError.message);
    }

    res.status(201).json(result.productionExpense);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create production expense',
      type: 'ServerError'
    });
  }
});

// PUT /api/production-expenses/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('productionexpense', 'update'), async (req, res) => {
  try {
    const validation = await productionExpenseService.validateProductionExpenseUpdate(
      req.params.id,
      req.body,
      getProductionExpenseById
    );
    
    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        error: validation.error,
        type: validation.type || 'ValidationError',
        details: validation.errors
      });
    }

    const updatedProductionExpense = await updateProductionExpenseInDb(req.params.id, req.body);
    res.json(updatedProductionExpense);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update production expense',
      type: 'ServerError'
    });
  }
});

// POST /api/production-expenses/:id/post
router.post('/:id/post', requireAuth, createResourceAccessMiddleware('productionexpense', 'post'), async (req, res) => {
  try {
    const result = await productionExpenseService.postProductionExpense(
      req.params.id,
      getProductionExpenseById,
      updateProductionExpenseStatus
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        type: result.type || 'ValidationError'
      });
    }

    res.json(result.productionExpense);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to post production expense',
      type: 'ServerError'
    });
  }
});

// DELETE /api/production-expenses/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('productionexpense', 'delete'), async (req, res) => {
  try {
    const productionExpense = await getProductionExpenseById(req.params.id);
    if (!productionExpense) {
      return res.status(404).json({
        error: 'Production expense not found',
        type: 'NotFoundError'
      });
    }

    if (productionExpense.status === 'posted') {
      return res.status(400).json({
        error: 'Cannot delete posted production expense',
        type: 'ValidationError'
      });
    }

    await deleteProductionExpenseFromDb(req.params.id);
    res.json({ message: 'Production expense deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete production expense',
      type: 'ServerError'
    });
  }
});

module.exports = router;