const express = require('express');
const purchaseBillService = require('../services/purchaseBillService');
const autoAnalyticsService = require('../services/autoAnalyticsService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

// Mock database functions
let mockPurchaseBills = [
  {
    id: 1,
    costCenterId: 1,
    amount: 3000,
    description: 'Office Supplies',
    status: 'draft',
    billDate: '2024-01-20',
    dueDate: '2024-02-20',
    supplierId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllPurchaseBills = async (page = 0, limit = 10, search = '') => {
  let filtered = mockPurchaseBills;
  
  if (search) {
    filtered = mockPurchaseBills.filter(bill => 
      bill.description.toLowerCase().includes(search.toLowerCase())
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

const getPurchaseBillById = async (id) => {
  return mockPurchaseBills.find(pb => pb.id === parseInt(id));
};

const savePurchaseBill = async (purchaseBillData) => {
  const newPurchaseBill = {
    id: mockPurchaseBills.length + 1,
    ...purchaseBillData,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPurchaseBills.push(newPurchaseBill);
  return newPurchaseBill;
};

const updatePurchaseBillInDb = async (id, updateData) => {
  const index = mockPurchaseBills.findIndex(pb => pb.id === parseInt(id));
  if (index !== -1) {
    mockPurchaseBills[index] = {
      ...mockPurchaseBills[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockPurchaseBills[index];
  }
  return null;
};

const updatePurchaseBillStatus = async (id, status) => {
  return updatePurchaseBillInDb(id, { status });
};

const deletePurchaseBillFromDb = async (id) => {
  const index = mockPurchaseBills.findIndex(pb => pb.id === parseInt(id));
  if (index !== -1) {
    return mockPurchaseBills.splice(index, 1)[0];
  }
  return null;
};

const getAutoAnalyticalModels = async () => {
  return [
    {
      id: 1,
      name: 'Office Supplies Detection',
      conditions: { descriptionContains: 'supplies' },
      actions: { category: 'Office', subCategory: 'Supplies' }
    }
  ];
};

// GET /api/purchase-bills
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await getAllPurchaseBills(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch purchase bills',
      type: 'ServerError'
    });
  }
});

// GET /api/purchase-bills/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const purchaseBill = await getPurchaseBillById(req.params.id);
    if (!purchaseBill) {
      return res.status(404).json({
        error: 'Purchase bill not found',
        type: 'NotFoundError'
      });
    }
    res.json(purchaseBill);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch purchase bill',
      type: 'ServerError'
    });
  }
});

// POST /api/purchase-bills
router.post('/', requireAuth, createResourceAccessMiddleware('purchasebill', 'create'), async (req, res) => {
  try {
    const result = await purchaseBillService.createPurchaseBill(req.body, savePurchaseBill);
    
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
        result.purchaseBill,
        getAutoAnalyticalModels
      );
      if (analyticsResult.success && analyticsResult.updatedTransaction) {
        await updatePurchaseBillInDb(result.purchaseBill.id, analyticsResult.updatedTransaction);
        result.purchaseBill = { ...result.purchaseBill, ...analyticsResult.updatedTransaction };
      }
    } catch (analyticsError) {
      console.warn('Auto analytics failed:', analyticsError.message);
    }

    res.status(201).json(result.purchaseBill);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create purchase bill',
      type: 'ServerError'
    });
  }
});

// PUT /api/purchase-bills/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('purchasebill', 'update'), async (req, res) => {
  try {
    const validation = await purchaseBillService.validatePurchaseBillUpdate(
      req.params.id,
      req.body,
      getPurchaseBillById
    );
    
    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        error: validation.error,
        type: validation.type || 'ValidationError',
        details: validation.errors
      });
    }

    const updatedPurchaseBill = await updatePurchaseBillInDb(req.params.id, req.body);
    res.json(updatedPurchaseBill);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update purchase bill',
      type: 'ServerError'
    });
  }
});

// POST /api/purchase-bills/:id/post
router.post('/:id/post', requireAuth, createResourceAccessMiddleware('purchasebill', 'post'), async (req, res) => {
  try {
    const result = await purchaseBillService.postPurchaseBill(
      req.params.id,
      getPurchaseBillById,
      updatePurchaseBillStatus
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        type: result.type || 'ValidationError'
      });
    }

    res.json(result.purchaseBill);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to post purchase bill',
      type: 'ServerError'
    });
  }
});

// DELETE /api/purchase-bills/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('purchasebill', 'delete'), async (req, res) => {
  try {
    const purchaseBill = await getPurchaseBillById(req.params.id);
    if (!purchaseBill) {
      return res.status(404).json({
        error: 'Purchase bill not found',
        type: 'NotFoundError'
      });
    }

    if (purchaseBill.status === 'posted') {
      return res.status(400).json({
        error: 'Cannot delete posted purchase bill',
        type: 'ValidationError'
      });
    }

    await deletePurchaseBillFromDb(req.params.id);
    res.json({ message: 'Purchase bill deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete purchase bill',
      type: 'ServerError'
    });
  }
});

module.exports = router;