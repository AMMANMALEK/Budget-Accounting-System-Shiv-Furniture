const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

// Mock database functions
let mockPurchaseOrders = [
  {
    id: 1,
    orderNumber: 'PO-001',
    supplierId: 1,
    costCenterId: 1,
    totalAmount: 5000,
    status: 'pending',
    orderDate: '2024-01-10',
    expectedDeliveryDate: '2024-01-20',
    description: 'Office Equipment Order',
    items: [
      { productId: 1, quantity: 2, unitPrice: 2500, totalPrice: 5000 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllPurchaseOrders = async (page = 0, limit = 10, search = '') => {
  let filtered = mockPurchaseOrders;
  
  if (search) {
    filtered = mockPurchaseOrders.filter(order => 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.description.toLowerCase().includes(search.toLowerCase())
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

const getPurchaseOrderById = async (id) => {
  return mockPurchaseOrders.find(po => po.id === parseInt(id));
};

const savePurchaseOrder = async (purchaseOrderData) => {
  const newPurchaseOrder = {
    id: mockPurchaseOrders.length + 1,
    orderNumber: `PO-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
    ...purchaseOrderData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPurchaseOrders.push(newPurchaseOrder);
  return newPurchaseOrder;
};

const updatePurchaseOrderInDb = async (id, updateData) => {
  const index = mockPurchaseOrders.findIndex(po => po.id === parseInt(id));
  if (index !== -1) {
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockPurchaseOrders[index];
  }
  return null;
};

const deletePurchaseOrderFromDb = async (id) => {
  const index = mockPurchaseOrders.findIndex(po => po.id === parseInt(id));
  if (index !== -1) {
    return mockPurchaseOrders.splice(index, 1)[0];
  }
  return null;
};

// GET /api/purchase-orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await getAllPurchaseOrders(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch purchase orders',
      type: 'ServerError'
    });
  }
});

// GET /api/purchase-orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const purchaseOrder = await getPurchaseOrderById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        error: 'Purchase order not found',
        type: 'NotFoundError'
      });
    }
    res.json(purchaseOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch purchase order',
      type: 'ServerError'
    });
  }
});

// POST /api/purchase-orders
router.post('/', requireAuth, createResourceAccessMiddleware('purchaseorder', 'create'), async (req, res) => {
  try {
    // Basic validation
    const { supplierId, costCenterId, items } = req.body;
    
    if (!supplierId || !costCenterId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Supplier ID, Cost Center ID, and items are required',
        type: 'ValidationError'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const purchaseOrderData = {
      ...req.body,
      totalAmount
    };

    const newPurchaseOrder = await savePurchaseOrder(purchaseOrderData);
    res.status(201).json(newPurchaseOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create purchase order',
      type: 'ServerError'
    });
  }
});

// PUT /api/purchase-orders/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('purchaseorder', 'update'), async (req, res) => {
  try {
    const purchaseOrder = await getPurchaseOrderById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        error: 'Purchase order not found',
        type: 'NotFoundError'
      });
    }

    // Don't allow updates to confirmed or completed orders
    if (purchaseOrder.status === 'confirmed' || purchaseOrder.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot update confirmed or completed purchase orders',
        type: 'ValidationError'
      });
    }

    // Recalculate total if items are updated
    let updateData = { ...req.body };
    if (req.body.items) {
      updateData.totalAmount = req.body.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    const updatedPurchaseOrder = await updatePurchaseOrderInDb(req.params.id, updateData);
    res.json(updatedPurchaseOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update purchase order',
      type: 'ServerError'
    });
  }
});

// POST /api/purchase-orders/:id/confirm
router.post('/:id/confirm', requireAuth, createResourceAccessMiddleware('purchaseorder', 'update'), async (req, res) => {
  try {
    const purchaseOrder = await getPurchaseOrderById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        error: 'Purchase order not found',
        type: 'NotFoundError'
      });
    }

    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending purchase orders can be confirmed',
        type: 'ValidationError'
      });
    }

    const updatedPurchaseOrder = await updatePurchaseOrderInDb(req.params.id, { status: 'confirmed' });
    res.json(updatedPurchaseOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to confirm purchase order',
      type: 'ServerError'
    });
  }
});

// DELETE /api/purchase-orders/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('purchaseorder', 'delete'), async (req, res) => {
  try {
    const purchaseOrder = await getPurchaseOrderById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        error: 'Purchase order not found',
        type: 'NotFoundError'
      });
    }

    // Don't allow deletion of confirmed or completed orders
    if (purchaseOrder.status === 'confirmed' || purchaseOrder.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete confirmed or completed purchase orders',
        type: 'ValidationError'
      });
    }

    await deletePurchaseOrderFromDb(req.params.id);
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete purchase order',
      type: 'ServerError'
    });
  }
});

module.exports = router;