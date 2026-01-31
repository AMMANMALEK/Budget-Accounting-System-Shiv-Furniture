const express = require('express');
const reportService = require('../services/reportService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Mock database functions - replace with actual database implementation
const getAllCostCenters = async () => {
  return [
    { id: 1, name: 'IT Department', description: 'Information Technology' },
    { id: 2, name: 'Marketing', description: 'Marketing Department' },
    { id: 3, name: 'Operations', description: 'Operations Department' }
  ];
};

const getAllBudgets = async () => {
  return [
    {
      id: 1,
      costCenterId: 1,
      plannedAmount: 50000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      description: 'Annual IT Budget'
    },
    {
      id: 2,
      costCenterId: 2,
      plannedAmount: 30000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      description: 'Marketing Budget'
    }
  ];
};

const getPostedRecordsForBudget = async (budgetId) => {
  const allRecords = [
    { id: 1, budgetId: 1, amount: 5000, type: 'invoice', status: 'posted', date: '2024-01-15' },
    { id: 2, budgetId: 1, amount: 3000, type: 'purchase_bill', status: 'posted', date: '2024-01-20' },
    { id: 3, budgetId: 2, amount: 2000, type: 'production_expense', status: 'posted', date: '2024-01-25' }
  ];
  
  return allRecords.filter(record => record.budgetId === budgetId);
};

const getPostedRecordsForCostCenter = async (costCenterId, dateRange = null) => {
  const allRecords = [
    { id: 1, costCenterId: 1, amount: 5000, type: 'invoice', status: 'posted', date: '2024-01-15' },
    { id: 2, costCenterId: 1, amount: 3000, type: 'purchase_bill', status: 'posted', date: '2024-01-20' },
    { id: 3, costCenterId: 2, amount: 2000, type: 'production_expense', status: 'posted', date: '2024-01-25' }
  ];
  
  let filtered = allRecords.filter(record => record.costCenterId === costCenterId);
  
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    filtered = filtered.filter(record => 
      record.date >= dateRange.startDate && record.date <= dateRange.endDate
    );
  }
  
  return filtered;
};

// GET /api/reports/budget-vs-actual
router.get('/budget-vs-actual', requireAuth, async (req, res) => {
  try {
    // Validate report access
    const accessValidation = reportService.validateReportAccess(req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        error: accessValidation.error,
        type: 'AccessDeniedError'
      });
    }

    const { 
      startDate, 
      endDate, 
      costCenterId, 
      format = 'json' 
    } = req.query;

    const filters = {
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      costCenterId: costCenterId ? parseInt(costCenterId) : null
    };

    const budgetReport = await reportService.generateBudgetReport(
      getAllCostCenters,
      getAllBudgets,
      getPostedRecordsForBudget,
      filters
    );

    if (format === 'csv') {
      const csvData = reportService.formatReportForExport(budgetReport, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="budget-vs-actual.csv"');
      return res.send(csvData);
    }

    res.json(budgetReport);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate budget vs actual report',
      type: 'ServerError'
    });
  }
});

// GET /api/reports/cost-center-performance
router.get('/cost-center-performance', requireAuth, async (req, res) => {
  try {
    // Validate report access
    const accessValidation = reportService.validateReportAccess(req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        error: accessValidation.error,
        type: 'AccessDeniedError'
      });
    }

    const { 
      startDate, 
      endDate, 
      costCenterId, 
      format = 'json' 
    } = req.query;

    const filters = {
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      costCenterId: costCenterId ? parseInt(costCenterId) : null
    };

    const expenseReport = await reportService.generateExpenseReport(
      getAllCostCenters,
      getPostedRecordsForCostCenter,
      filters
    );

    if (format === 'csv') {
      const csvData = reportService.formatReportForExport(expenseReport, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cost-center-performance.csv"');
      return res.send(csvData);
    }

    res.json(expenseReport);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate cost center performance report',
      type: 'ServerError'
    });
  }
});

// GET /api/reports/variance-analysis
router.get('/variance-analysis', requireAuth, async (req, res) => {
  try {
    // Validate report access
    const accessValidation = reportService.validateReportAccess(req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        error: accessValidation.error,
        type: 'AccessDeniedError'
      });
    }

    const { 
      startDate, 
      endDate, 
      costCenterId, 
      format = 'json' 
    } = req.query;

    const filters = {
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      costCenterId: costCenterId ? parseInt(costCenterId) : null
    };

    const varianceReport = await reportService.generateVarianceReport(
      getAllCostCenters,
      getAllBudgets,
      getPostedRecordsForBudget,
      filters
    );

    if (format === 'csv') {
      const csvData = reportService.formatReportForExport(varianceReport, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="variance-analysis.csv"');
      return res.send(csvData);
    }

    res.json(varianceReport);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate variance analysis report',
      type: 'ServerError'
    });
  }
});

// GET /api/reports/expense-breakdown
router.get('/expense-breakdown', requireAuth, async (req, res) => {
  try {
    // Validate report access
    const accessValidation = reportService.validateReportAccess(req.userContext);
    if (!accessValidation.hasAccess) {
      return res.status(403).json({
        error: accessValidation.error,
        type: 'AccessDeniedError'
      });
    }

    const { 
      startDate, 
      endDate, 
      costCenterId, 
      groupBy = 'type',
      format = 'json' 
    } = req.query;

    const filters = {
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      costCenterId: costCenterId ? parseInt(costCenterId) : null,
      groupBy
    };

    const expenseReport = await reportService.generateExpenseReport(
      getAllCostCenters,
      getPostedRecordsForCostCenter,
      filters
    );

    // Group records by specified criteria
    const groupedData = reportService.groupRecordsByType(expenseReport.records || []);
    
    const result = {
      ...expenseReport,
      breakdown: groupedData
    };

    if (format === 'csv') {
      const csvData = reportService.formatReportForExport(result, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expense-breakdown.csv"');
      return res.send(csvData);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate expense breakdown report',
      type: 'ServerError'
    });
  }
});

module.exports = router;