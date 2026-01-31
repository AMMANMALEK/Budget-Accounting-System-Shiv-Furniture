const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

const normalizeStatusFromUi = (status) => {
  if (!status) return 'pending';
  const s = status.toString().toLowerCase();
  if (s === 'draft') return 'pending';
  if (s === 'issued') return 'pending';
  if (s === 'received') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return s;
};

const normalizeStatusForUi = (status) => {
  if (!status) return 'Draft';
  const s = status.toString().toLowerCase();
  if (s === 'pending') return 'Draft';
  if (s === 'confirmed') return 'Issued';
  if (s === 'completed') return 'Received';
  if (s === 'cancelled') return 'Cancelled';
  return status;
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

const mapPurchaseOrderToUi = (po) => {
  if (!po) return po;
  return {
    id: po.id,
    poNumber: po.poNumber || po.orderNumber,
    vendorId: po.vendorId || po.supplierId,
    vendorName: po.vendorName,
    costCenterId: po.costCenterId,
    costCenterName: po.costCenterName,
    budgetId: po.budgetId,
    budgetName: po.budgetName,
    date: po.date || po.orderDate,
    deliveryDate: po.deliveryDate || po.expectedDeliveryDate,
    status: po.statusUi || normalizeStatusForUi(po.status),
    totalAmount: po.totalAmount,
    items: (po.items || []).map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice ?? it.unitPrice,
      total: it.totalPrice ?? it.total
    }))
  };
};

const mapUiToPurchaseOrder = (payload = {}) => {
  const poNumber = payload.poNumber || payload.orderNumber;
  const vendorId = payload.vendorId || payload.supplierId;
  const costCenterId = payload.costCenterId;
  const items = mapItemsFromUi(payload.items || []);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  return {
    orderNumber: poNumber,
    poNumber,
    supplierId: vendorId,
    vendorId,
    vendorName: payload.vendorName,
    costCenterId,
    costCenterName: payload.costCenterName,
    budgetId: payload.budgetId,
    budgetName: payload.budgetName,
    orderDate: payload.date || payload.orderDate,
    date: payload.date || payload.orderDate,
    expectedDeliveryDate: payload.deliveryDate || payload.expectedDeliveryDate,
    deliveryDate: payload.deliveryDate || payload.expectedDeliveryDate,
    statusUi: payload.status,
    status: normalizeStatusFromUi(payload.status || payload.statusUi || payload.status_backend),
    description: payload.description || '',
    items,
    totalAmount
  };
};

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
    res.json({
      ...result,
      data: (result.data || []).map(mapPurchaseOrderToUi)
    });
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
    res.json(mapPurchaseOrderToUi(purchaseOrder));
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
    const payload = mapUiToPurchaseOrder(req.body);
    const { supplierId, costCenterId, items } = payload;
    
    if (!supplierId || !costCenterId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Supplier ID, Cost Center ID, and items are required',
        type: 'ValidationError'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const purchaseOrderData = {
      ...payload,
      totalAmount
    };

    const newPurchaseOrder = await savePurchaseOrder(purchaseOrderData);
    res.status(201).json(mapPurchaseOrderToUi(newPurchaseOrder));
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
    const payload = mapUiToPurchaseOrder(req.body);
    let updateData = { ...payload };
    if (payload.items) {
      updateData.totalAmount = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    const updatedPurchaseOrder = await updatePurchaseOrderInDb(req.params.id, updateData);
    res.json(mapPurchaseOrderToUi(updatedPurchaseOrder));
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
    res.json(mapPurchaseOrderToUi(updatedPurchaseOrder));
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