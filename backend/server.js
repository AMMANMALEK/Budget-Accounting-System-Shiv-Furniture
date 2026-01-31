require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import database initialization
const { initializeDatabase } = require('./database/init');

// Import routes
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budgets');
const invoiceRoutes = require('./routes/invoices');
const purchaseBillRoutes = require('./routes/purchaseBills');
const productionExpenseRoutes = require('./routes/productionExpenses');
const costCenterRoutes = require('./routes/costCenters');
const contactRoutes = require('./routes/contacts');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const portalRoutes = require('./routes/portal');
const autoAnalyticsRoutes = require('./routes/autoAnalytics');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const salesOrderRoutes = require('./routes/salesOrders');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-bills', purchaseBillRoutes);
app.use('/api/production-expenses', productionExpenseRoutes);
app.use('/api/cost-centers', costCenterRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/auto-analytics', autoAnalyticsRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/purchase-payments', paymentRoutes); // Alias for purchase payments

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    type: err.type || 'ServerError',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    type: 'NotFoundError'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Budget Expense Tracker Backend...');
    
    // Initialize database
    if (process.env.NODE_ENV !== 'test') {
      await initializeDatabase();
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;