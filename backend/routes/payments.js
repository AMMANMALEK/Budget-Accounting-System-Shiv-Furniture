const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');

const router = express.Router();

// Mock database functions
let mockPayments = [
  {
    id: 1,
    type: 'invoice_payment', // invoice_payment, bill_payment
    referenceId: 1, // invoiceId or purchaseBillId
    amount: 3000,
    paymentDate: '2024-01-20',
    method: 'bank_transfer', // bank_transfer, credit_card, cash, check
    reference: 'TXN-12345',
    description: 'Payment for Invoice INV-002',
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    type: 'bill_payment',
    referenceId: 1,
    amount: 2000,
    paymentDate: '2024-01-22',
    method: 'credit_card',
    reference: 'CC-67890',
    description: 'Payment for Purchase Bill PB-001',
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllPayments = async (page = 0, limit = 10, search = '', type = null) => {
  let filtered = mockPayments;
  
  if (search) {
    filtered = mockPayments.filter(payment => 
      payment.description.toLowerCase().includes(search.toLowerCase()) ||
      payment.reference.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (type) {
    filtered = filtered.filter(payment => payment.type === type);
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

const getPaymentById = async (id) => {
  return mockPayments.find(p => p.id === parseInt(id));
};

const savePayment = async (paymentData) => {
  const newPayment = {
    id: mockPayments.length + 1,
    ...paymentData,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPayments.push(newPayment);
  return newPayment;
};

const updatePaymentInDb = async (id, updateData) => {
  const index = mockPayments.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    mockPayments[index] = {
      ...mockPayments[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return mockPayments[index];
  }
  return null;
};

const deletePaymentFromDb = async (id) => {
  const index = mockPayments.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    return mockPayments.splice(index, 1)[0];
  }
  return null;
};

// GET /api/payments
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '', type } = req.query;
    const result = await getAllPayments(parseInt(page), parseInt(limit), search, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payments',
      type: 'ServerError'
    });
  }
});

// GET /api/payments/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        type: 'NotFoundError'
      });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payment',
      type: 'ServerError'
    });
  }
});

// POST /api/payments
router.post('/', requireAuth, createResourceAccessMiddleware('payment', 'create'), async (req, res) => {
  try {
    // Basic validation
    const { type, referenceId, amount, paymentDate, method } = req.body;
    
    if (!type || !referenceId || !amount || !paymentDate || !method) {
      return res.status(400).json({
        error: 'Type, reference ID, amount, payment date, and method are required',
        type: 'ValidationError'
      });
    }

    if (!['invoice_payment', 'bill_payment'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be either invoice_payment or bill_payment',
        type: 'ValidationError'
      });
    }

    if (!['bank_transfer', 'credit_card', 'cash', 'check'].includes(method)) {
      return res.status(400).json({
        error: 'Invalid payment method',
        type: 'ValidationError'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be positive',
        type: 'ValidationError'
      });
    }

    const newPayment = await savePayment(req.body);
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create payment',
      type: 'ServerError'
    });
  }
});

// PUT /api/payments/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('payment', 'update'), async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        type: 'NotFoundError'
      });
    }

    // Don't allow updates to completed payments in a real system
    // This is simplified for demo purposes
    const updatedPayment = await updatePaymentInDb(req.params.id, req.body);
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update payment',
      type: 'ServerError'
    });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('payment', 'delete'), async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        type: 'NotFoundError'
      });
    }

    // In a real system, you might not allow deletion of completed payments
    // This is simplified for demo purposes
    await deletePaymentFromDb(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete payment',
      type: 'ServerError'
    });
  }
});

// GET /api/payments/by-invoice/:invoiceId
router.get('/by-invoice/:invoiceId', requireAuth, async (req, res) => {
  try {
    const payments = mockPayments.filter(p => 
      p.type === 'invoice_payment' && p.referenceId === parseInt(req.params.invoiceId)
    );
    res.json(payments);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payments for invoice',
      type: 'ServerError'
    });
  }
});

// GET /api/payments/by-bill/:billId
router.get('/by-bill/:billId', requireAuth, async (req, res) => {
  try {
    const payments = mockPayments.filter(p => 
      p.type === 'bill_payment' && p.referenceId === parseInt(req.params.billId)
    );
    res.json(payments);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payments for bill',
      type: 'ServerError'
    });
  }
});

module.exports = router;