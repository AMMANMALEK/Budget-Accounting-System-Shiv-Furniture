/**
 * Validation Examples and Usage Patterns
 * 
 * This file demonstrates how to properly use the validation system throughout
 * the application. It provides example controller implementations, middleware
 * patterns, error handling strategies, and complete request/response flows.
 * 
 * Key Examples:
 * - Controller implementations with proper validation
 * - Middleware patterns for request validation
 * - Error handling and response formatting
 * - Route setup with validation middleware
 * - Complete request/response flow simulation
 * 
 * Controller Examples:
 * - BudgetController: Budget creation, updates, and validation
 * - InvoiceController: Invoice management and posting workflow
 * - CostCenterController: Cost center operations with uniqueness validation
 * 
 * Middleware Patterns:
 * - validateRequest: Generic validation middleware factory
 * - Error handling utilities for different HTTP status codes
 * - Standardized response formatting
 * 
 * This file serves as a reference implementation and documentation for
 * developers working with the validation system throughout the application.
 */
// Example usage of the validation system in controllers/routes
const validationService = require('../services/validationService');
const budgetService = require('../services/budgetService');
const invoiceService = require('../services/invoiceService');
const costCenterService = require('../services/costCenterService');

// Example: Budget Controller with Validation
class BudgetController {
  // POST /api/budgets
  async createBudget(req, res) {
    try {
      const budgetData = req.body;
      const existingBudgets = []; // Would come from database
      
      const result = await budgetService.createBudget(budgetData, existingBudgets, async (data) => {
        // Mock save function - would save to database
        return { id: 1, ...data };
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          error: result.error,
          message: result.message,
          details: result.details
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      const serverError = validationService.createInternalServerError();
      return res.status(serverError.statusCode).json(serverError.response);
    }
  }

  // PUT /api/budgets/:id
  async updateBudget(req, res) {
    try {
      const budgetId = req.params.id;
      const updateData = req.body;
      const existingBudgets = []; // Would come from database
      
      const result = await budgetService.updateBudget(budgetId, updateData, existingBudgets, async (id, data) => {
        // Mock update function - would update in database
        return { id, ...data };
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          error: result.error,
          message: result.message,
          details: result.details
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      const serverError = validationService.createInternalServerError();
      return res.status(serverError.statusCode).json(serverError.response);
    }
  }
}

// Example: Invoice Controller with Validation
class InvoiceController {
  // POST /api/invoices
  async createInvoice(req, res) {
    try {
      const invoiceData = req.body;
      
      const result = await invoiceService.createInvoice(invoiceData, async (data) => {
        // Mock save function - would save to database
        return { id: 1, ...data };
      });

      if (!result.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid invoice data',
          details: { validationErrors: result.errors }
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create invoice'
      });
    }
  }

  // POST /api/invoices/:id/post
  async postInvoice(req, res) {
    try {
      const invoiceId = req.params.id;
      
      const result = await invoiceService.postInvoice(
        invoiceId,
        async (id) => {
          // Mock get function - would fetch from database
          return { id, status: 'draft', amount: 100 };
        },
        async (id, status) => {
          // Mock update function - would update in database
          return { id, status, amount: 100 };
        }
      );

      if (!result.success) {
        return res.status(400).json({
          error: 'POST_ERROR',
          message: 'Cannot post invoice',
          details: { validationErrors: result.errors }
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to post invoice'
      });
    }
  }
}

// Example: Cost Center Controller with Validation
class CostCenterController {
  // POST /api/cost-centers
  async createCostCenter(req, res) {
    try {
      const costCenterData = req.body;
      const existingCostCenters = []; // Would come from database
      
      const result = await costCenterService.createCostCenter(costCenterData, existingCostCenters, async (data) => {
        // Mock save function - would save to database
        return { id: 1, ...data };
      });

      if (!result.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid cost center data',
          details: { validationErrors: result.errors }
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create cost center'
      });
    }
  }
}

// Example: Middleware for validation
const validateRequest = (validationFunction) => {
  return async (req, res, next) => {
    try {
      const validation = await validationFunction(req.body);
      
      if (!validation.isValid) {
        const errorResponse = validationService.createValidationErrorResponse(validation.errors);
        return res.status(400).json(errorResponse);
      }
      
      next();
    } catch (error) {
      const serverError = validationService.createInternalServerError();
      return res.status(serverError.statusCode).json(serverError.response);
    }
  };
};

// Example: Route definitions with validation middleware
const setupRoutes = (app) => {
  const budgetController = new BudgetController();
  const invoiceController = new InvoiceController();
  const costCenterController = new CostCenterController();

  // Budget routes
  app.post('/api/budgets', 
    validateRequest(validationService.validateBudget.bind(validationService)),
    budgetController.createBudget
  );

  // Invoice routes
  app.post('/api/invoices', 
    validateRequest(validationService.validateInvoice.bind(validationService)),
    invoiceController.createInvoice
  );

  // Cost center routes
  app.post('/api/cost-centers', 
    validateRequest(validationService.validateCostCenter.bind(validationService)),
    costCenterController.createCostCenter
  );
};

// Example: Error handling patterns
const handleValidationError = (res, validation) => {
  if (!validation.isValid) {
    const errorResponse = validationService.createValidationErrorResponse(validation.errors);
    return res.status(validation.statusCode || 400).json(errorResponse);
  }
};

const handleBusinessRuleError = (res, errorCode, message, details = null) => {
  const conflictError = validationService.createConflictError(errorCode, message, details);
  return res.status(conflictError.statusCode).json(conflictError.response);
};

const handleNotFoundError = (res, resource) => {
  const notFoundError = validationService.createNotFoundError(resource);
  return res.status(notFoundError.statusCode).json(notFoundError.response);
};

// Example: Complete request/response flow
const exampleRequestFlow = async () => {
  // Simulate a budget creation request
  const budgetRequest = {
    body: {
      costCenterId: 'cc1',
      plannedAmount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      description: 'Marketing budget for 2024'
    }
  };

  // Simulate response object
  const response = {
    status: (code) => ({
      json: (data) => ({ statusCode: code, body: data })
    }),
    json: (data) => ({ statusCode: 200, body: data })
  };

  // Validate the request
  const validation = validationService.validateBudget(budgetRequest.body);
  
  if (!validation.isValid) {
    const errorResponse = validationService.createValidationErrorResponse(validation.errors);
    return response.status(400).json(errorResponse);
  }

  // Check for business rule conflicts (budget overlap)
  const existingBudgets = [
    {
      id: 1,
      costCenterId: 'cc2', // Different cost center, no conflict
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  ];

  const overlapValidation = await validationService.validateBudgetOverlap(
    budgetRequest.body,
    existingBudgets
  );

  if (!overlapValidation.isValid) {
    const conflictError = validationService.createConflictError(
      overlapValidation.error,
      overlapValidation.message,
      { conflictingBudgets: overlapValidation.conflictingBudgets }
    );
    return response.status(conflictError.statusCode).json(conflictError.response);
  }

  // Success response
  return response.status(201).json({
    success: true,
    data: {
      id: 1,
      ...budgetRequest.body,
      createdAt: new Date().toISOString()
    }
  });
};

module.exports = {
  BudgetController,
  InvoiceController,
  CostCenterController,
  validateRequest,
  setupRoutes,
  handleValidationError,
  handleBusinessRuleError,
  handleNotFoundError,
  exampleRequestFlow
};