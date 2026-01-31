const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

const normalizeStatusFromUi = (status) => {
  if (!status) return 'pending';
  const s = status.toString().toLowerCase();
  if (s === 'draft') return 'pending';
  if (s === 'confirmed') return 'pending';
  if (s === 'shipped') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return s;
};

const mapItemsFromUi = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const quantity = Number(it.quantity) || 0;
    const unitPrice = Number(it.unitPrice ?? it.price) || 0;
    return {
      productId: it.productId,
      productName: it.productName,
      quantity,
      unitPrice,
      totalPrice: Number(it.totalPrice ?? it.total) || quantity * unitPrice
    };
  });
};

const mapSalesOrderToUi = (so) => {
  if (!so) return so;
  return {
    id: so.id,
    soNumber: so.soNumber || so.orderNumber,
    customerId: so.customerId,
    customerName: so.customerName,
    date: so.date || so.orderDate,
    deliveryDate: so.deliveryDate || so.expectedDeliveryDate,
    status: so.statusUi || so.status || 'Draft',
    subtotal: so.subtotal,
    tax: so.tax,
    totalAmount: so.totalAmount,
    items: (so.items || []).map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.totalPrice
    }))
  };
};

const mapUiToSalesOrder = (payload = {}) => {
  const soNumber = payload.soNumber || payload.orderNumber;
  const items = mapItemsFromUi(payload.items || []);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const tax = Number(payload.tax) || 0;
  const totalAmount = Number(payload.totalAmount) || subtotal + tax;

  return {
    orderNumber: soNumber,
    soNumber,
    customerId: payload.customerId,
    customerName: payload.customerName,
    orderDate: payload.date || payload.orderDate,
    date: payload.date || payload.orderDate,
    expectedDeliveryDate: payload.deliveryDate || payload.expectedDeliveryDate,
    deliveryDate: payload.deliveryDate || payload.expectedDeliveryDate,
    statusUi: payload.status,
    status: normalizeStatusFromUi(payload.status),
    items,
    subtotal,
    tax,
    totalAmount,
    description: payload.description || ''
  };
};

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
    res.json({
      ...result,
      data: (result.data || []).map(mapSalesOrderToUi)
    });
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
    res.json(mapSalesOrderToUi(salesOrder));
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
    const payload = mapUiToSalesOrder(req.body);
    // Basic validation
    const { customerId, items } = payload;
    
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Customer ID and items are required',
        type: 'ValidationError'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const salesOrderData = {
      ...payload,
      totalAmount
    };

    const newSalesOrder = await saveSalesOrder(salesOrderData);
    res.status(201).json(mapSalesOrderToUi(newSalesOrder));
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

    const payload = mapUiToSalesOrder(req.body);
    let updateData = { ...payload };
    if (payload.items) {
      updateData.totalAmount = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    const updatedSalesOrder = await updateSalesOrderInDb(req.params.id, updateData);
    res.json(mapSalesOrderToUi(updatedSalesOrder));
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
    res.json(mapSalesOrderToUi(updatedSalesOrder));
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