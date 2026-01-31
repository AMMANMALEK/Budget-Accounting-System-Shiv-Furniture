const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Mock data for portal users
const mockPortalData = {
  dashboard: {
    totalInvoices: 15,
    totalAmount: 45000,
    pendingPayments: 3,
    recentActivity: [
      { id: 1, type: 'invoice', description: 'Invoice #INV-001 created', date: '2024-01-15' },
      { id: 2, type: 'payment', description: 'Payment received for INV-002', date: '2024-01-14' }
    ]
  },
  invoices: [
    {
      id: 1,
      invoiceNumber: 'INV-001',
      amount: 5000,
      status: 'posted',
      dueDate: '2024-02-15',
      description: 'Software License',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      invoiceNumber: 'INV-002',
      amount: 3000,
      status: 'paid',
      dueDate: '2024-02-10',
      description: 'Consulting Services',
      createdAt: '2024-01-10'
    }
  ],
  payments: [
    {
      id: 1,
      invoiceId: 2,
      amount: 3000,
      paymentDate: '2024-01-20',
      method: 'bank_transfer',
      reference: 'TXN-12345'
    }
  ],
  orders: [
    {
      id: 1,
      orderNumber: 'ORD-001',
      amount: 5000,
      status: 'confirmed',
      orderDate: '2024-01-15',
      description: 'Software License Order'
    }
  ]
};

// GET /api/portal/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Portal users can only see their own data
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    res.json(mockPortalData.dashboard);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch portal dashboard',
      type: 'ServerError'
    });
  }
});

// GET /api/portal/invoices
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    const { page = 0, limit = 10, search = '' } = req.query;
    let filtered = mockPortalData.invoices;
    
    if (search) {
      filtered = mockPortalData.invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        invoice.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const start = parseInt(page) * parseInt(limit);
    const end = start + parseInt(limit);
    
    res.json({
      data: filtered.slice(start, end),
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch invoices',
      type: 'ServerError'
    });
  }
});

// GET /api/portal/invoices/:id
router.get('/invoices/:id', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    const invoice = mockPortalData.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch invoice',
      type: 'ServerError'
    });
  }
});

// GET /api/portal/payments
router.get('/payments', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    const { page = 0, limit = 10 } = req.query;
    const start = parseInt(page) * parseInt(limit);
    const end = start + parseInt(limit);
    
    res.json({
      data: mockPortalData.payments.slice(start, end),
      total: mockPortalData.payments.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(mockPortalData.payments.length / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payments',
      type: 'ServerError'
    });
  }
});

// GET /api/portal/orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    const { page = 0, limit = 10 } = req.query;
    const start = parseInt(page) * parseInt(limit);
    const end = start + parseInt(limit);
    
    res.json({
      data: mockPortalData.orders.slice(start, end),
      total: mockPortalData.orders.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(mockPortalData.orders.length / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch orders',
      type: 'ServerError'
    });
  }
});

// GET /api/portal/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    // Mock user profile data
    const profile = {
      id: req.userContext.userId,
      email: req.userContext.email,
      name: 'Portal User',
      company: 'Example Corp',
      phone: '+1-555-0123',
      address: '123 Business St, City, State 12345'
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch profile',
      type: 'ServerError'
    });
  }
});

// PUT /api/portal/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    if (req.userContext.role !== 'portal' && req.userContext.role !== 'admin') {
      return res.status(403).json({
        error: 'Portal access required',
        type: 'AccessDeniedError'
      });
    }

    // In a real implementation, you would update the user profile in the database
    const updatedProfile = {
      id: req.userContext.userId,
      email: req.userContext.email,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update profile',
      type: 'ServerError'
    });
  }
});

module.exports = router;