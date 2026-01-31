const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

// Mock database functions
let mockSalesOrders = [
  {
    id: 1,
    orderNumber: 'SO-001',
    customerId: 1,
    costCenterId: 1,
    totalAmount: 8000,
    status: 'pending',
    orderDate: '2024-01-12',
    expectedDeliveryDate: '2024-01-25',
    description: 'Software Implementation Project',
    items: [
      { productId: 1, quantity: 1, unitPrice: 8000, totalPrice: 8000 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllSalesOrders = async (page = 0, limit = 10, search = '') => {
  let filtered = mockSalesOrders;
  
  if (search) {
    filtered = mockSalesOrders.filter(order => 
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

const getSalesOrderById = async (id) => {
  return mockSalesOrders.find(so => so.id === parseInt(id));
};

const saveSalesOrder = async (salesOrderData) => {
  const newSalesOrder = {
    id: mockSalesOrders.length + 1,
    orderNumber: `SO-${String(mockSalesOrders.length + 1).padStart(3, '0')}`,
    ...salesOrderData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockSalesOrders.push(newSalesOrder);
  return newSalesOrder;
};

const updateSalesOrderInDb = async (id, updateData) => {
  const index = mockSalesOrders.findIndex(so => so.id === parseInt(id));
  if (index !== -1) {
    mockSalesOrders[index] = {
      ...mockSalesOrders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockSalesOrders[index];
  }
  return null;
};

const deleteSalesOrderFromDb = async (id) => {
  const index = mockSalesOrders.findIndex(so => so.id === parseInt(id));
  if (index !== -1) {
    return mockSalesOrders.splice(index, 1)[0];
  }
  return null;
};

// GET /api/sales-orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await getAllSalesOrders(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch sales orders',
      type: 'ServerError'
    });
  }
});

// GET /api/sales-orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const salesOrder = await getSalesOrderById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        error: 'Sales order not found',
        type: 'NotFoundError'
      });
    }
    res.json(salesOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch sales order',
      type: 'ServerError'
    });
  }
});

// POST /api/sales-orders
router.post('/', requireAuth, createResourceAccessMiddleware('salesorder', 'create'), async (req, res) => {
  try {
    // Basic validation
    const { customerId, costCenterId, items } = req.body;
    
    if (!customerId || !costCenterId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Customer ID, Cost Center ID, and items are required',
        type: 'ValidationError'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const salesOrderData = {
      ...req.body,
      totalAmount
    };

    const newSalesOrder = await saveSalesOrder(salesOrderData);
    res.status(201).json(newSalesOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create sales order',
      type: 'ServerError'
    });
  }
});

// PUT /api/sales-orders/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('salesorder', 'update'), async (req, res) => {
  try {
    const salesOrder = await getSalesOrderById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        error: 'Sales order not found',
        type: 'NotFoundError'
      });
    }

    // Don't allow updates to confirmed or completed orders
    if (salesOrder.status === 'confirmed' || salesOrder.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot update confirmed or completed sales orders',
        type: 'ValidationError'
      });
    }

    // Recalculate total if items are updated
    let updateData = { ...req.body };
    if (req.body.items) {
      updateData.totalAmount = req.body.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    const updatedSalesOrder = await updateSalesOrderInDb(req.params.id, updateData);
    res.json(updatedSalesOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update sales order',
      type: 'ServerError'
    });
  }
});

// POST /api/sales-orders/:id/confirm
router.post('/:id/confirm', requireAuth, createResourceAccessMiddleware('salesorder', 'update'), async (req, res) => {
  try {
    const salesOrder = await getSalesOrderById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        error: 'Sales order not found',
        type: 'NotFoundError'
      });
    }

    if (salesOrder.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending sales orders can be confirmed',
        type: 'ValidationError'
      });
    }

    const updatedSalesOrder = await updateSalesOrderInDb(req.params.id, { status: 'confirmed' });
    res.json(updatedSalesOrder);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to confirm sales order',
      type: 'ServerError'
    });
  }
});

// DELETE /api/sales-orders/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('salesorder', 'delete'), async (req, res) => {
  try {
    const salesOrder = await getSalesOrderById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        error: 'Sales order not found',
        type: 'NotFoundError'
      });
    }

    // Don't allow deletion of confirmed or completed orders
    if (salesOrder.status === 'confirmed' || salesOrder.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete confirmed or completed sales orders',
        type: 'ValidationError'
      });
    }

    await deleteSalesOrderFromDb(req.params.id);
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete sales order',
      type: 'ServerError'
    });
  }
});

module.exports = router;