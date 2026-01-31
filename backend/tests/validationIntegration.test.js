const validationService = require('../services/validationService');
const budgetService = require('../services/budgetService');
const invoiceService = require('../services/invoiceService');
const costCenterService = require('../services/costCenterService');

describe('Validation Integration Tests', () => {
  describe('Standardized Error Responses', () => {
    test('should create consistent HTTP 400 error responses', () => {
      const error = validationService.createBadRequestError('INVALID_AMOUNT', 'Amount must be positive');
      
      expect(error.statusCode).toBe(400);
      expect(error.response.error).toBe('INVALID_AMOUNT');
      expect(error.response.message).toBe('Amount must be positive');
    });

    test('should create consistent HTTP 401 error responses', () => {
      const error = validationService.createUnauthorizedError();
      
      expect(error.statusCode).toBe(401);
      expect(error.response.error).toBe('UNAUTHORIZED');
      expect(error.response.message).toBe('Authentication required');
    });

    test('should create consistent HTTP 403 error responses', () => {
      const error = validationService.createForbiddenError();
      
      expect(error.statusCode).toBe(403);
      expect(error.response.error).toBe('FORBIDDEN');
      expect(error.response.message).toBe('Access denied');
    });

    test('should create consistent HTTP 409 error responses', () => {
      const error = validationService.createConflictError('BUDGET_OVERLAP', 'Budget periods cannot overlap');
      
      expect(error.statusCode).toBe(409);
      expect(error.response.error).toBe('BUDGET_OVERLAP');
      expect(error.response.message).toBe('Budget periods cannot overlap');
    });
  });

  describe('Validation Rules', () => {
    test('should validate positive amounts correctly', () => {
      expect(validationService.validatePositiveNumber(100, 'Amount').isValid).toBe(true);
      expect(validationService.validatePositiveNumber(0, 'Amount').isValid).toBe(false);
      expect(validationService.validatePositiveNumber(-50, 'Amount').isValid).toBe(false);
      expect(validationService.validatePositiveNumber('abc', 'Amount').isValid).toBe(false);
    });

    test('should validate date ranges correctly', () => {
      expect(validationService.validateDateRange('2024-01-01', '2024-12-31').isValid).toBe(true);
      expect(validationService.validateDateRange('2024-12-31', '2024-01-01').isValid).toBe(false);
      expect(validationService.validateDateRange('2024-01-01', '2024-01-01').isValid).toBe(false);
    });

    test('should validate required fields correctly', () => {
      expect(validationService.validateRequired('test', 'Field').isValid).toBe(true);
      expect(validationService.validateRequired('', 'Field').isValid).toBe(false);
      expect(validationService.validateRequired(null, 'Field').isValid).toBe(false);
      expect(validationService.validateRequired(undefined, 'Field').isValid).toBe(false);
    });
  });

  describe('Budget Validation Integration', () => {
    test('should validate complete budget data', () => {
      const validBudget = {
        costCenterId: 'cc1',
        plannedAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const validation = validationService.validateBudget(validBudget);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid budget data with multiple errors', () => {
      const invalidBudget = {
        costCenterId: null,
        plannedAmount: -100,
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      };

      const validation = validationService.validateBudget(invalidBudget);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
      
      const errorCodes = validation.errors.map(e => e.error);
      expect(errorCodes).toContain('REQUIRED_FIELD_MISSING');
      expect(errorCodes).toContain('INVALID_AMOUNT');
      expect(errorCodes).toContain('INVALID_DATE_RANGE');
    });

    test('should detect budget overlaps', async () => {
      const existingBudgets = [
        {
          id: 1,
          costCenterId: 'cc1',
          startDate: '2024-01-01',
          endDate: '2024-06-30'
        }
      ];

      const overlappingBudget = {
        costCenterId: 'cc1',
        startDate: '2024-03-01',
        endDate: '2024-09-30'
      };

      const validation = await validationService.validateBudgetOverlap(overlappingBudget, existingBudgets);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('BUDGET_OVERLAP');
      expect(validation.conflictingBudgets).toHaveLength(1);
    });
  });

  describe('Invoice Validation Integration', () => {
    test('should validate complete invoice data', () => {
      const validInvoice = {
        costCenterId: 'cc1',
        amount: 500,
        description: 'Test invoice'
      };

      const validation = validationService.validateInvoice(validInvoice);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid invoice data', () => {
      const invalidInvoice = {
        costCenterId: null,
        amount: 0,
        description: 'a'.repeat(501)
      };

      const validation = validationService.validateInvoice(invalidInvoice);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Center Validation Integration', () => {
    test('should validate cost center data', () => {
      const validCostCenter = { name: 'Marketing' };
      const validation = validationService.validateCostCenter(validCostCenter);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject empty cost center name', () => {
      const invalidCostCenter = { name: '' };
      const validation = validationService.validateCostCenter(invalidCostCenter);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].error).toBe('REQUIRED_FIELD_MISSING');
    });
  });

  describe('Post Operation Validation', () => {
    test('should allow posting draft records', () => {
      const draftRecord = { status: 'draft' };
      const validation = validationService.validatePostOperation(draftRecord, 'Invoice');
      
      expect(validation.isValid).toBe(true);
    });

    test('should prevent posting already posted records', () => {
      const postedRecord = { status: 'posted' };
      const validation = validationService.validatePostOperation(postedRecord, 'Invoice');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('INVALID_STATUS');
      expect(validation.message).toBe('Only draft invoices can be posted');
    });
  });

  describe('Bulk Operation Validation', () => {
    test('should validate bulk operations', () => {
      const validBulkData = { ids: [1, 2, 3] };
      const validation = validationService.validateBulkOperation(validBulkData, 'delete');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject bulk operations with too many records', () => {
      const invalidBulkData = { ids: Array.from({ length: 101 }, (_, i) => i) };
      const validation = validationService.validateBulkOperation(invalidBulkData, 'delete');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].error).toBe('BULK_LIMIT_EXCEEDED');
    });
  });

  describe('Error Response Creation', () => {
    test('should create validation error responses with multiple errors', () => {
      const errors = [
        { error: 'REQUIRED_FIELD_MISSING', message: 'Name is required' },
        { error: 'INVALID_AMOUNT', message: 'Amount must be positive' },
        { error: 'INVALID_DATE_RANGE', message: 'Start date must be before end date' }
      ];

      const response = validationService.createValidationErrorResponse(errors);
      
      expect(response.error).toBe('REQUIRED_FIELD_MISSING');
      expect(response.message).toBe('Name is required');
      expect(response.details.additionalErrors).toHaveLength(2);
      expect(response.details.additionalErrors[0].error).toBe('INVALID_AMOUNT');
      expect(response.details.additionalErrors[1].error).toBe('INVALID_DATE_RANGE');
    });

    test('should create validation error responses with single error', () => {
      const error = { error: 'INVALID_AMOUNT', message: 'Amount must be positive' };
      const response = validationService.createValidationErrorResponse(error);
      
      expect(response.error).toBe('INVALID_AMOUNT');
      expect(response.message).toBe('Amount must be positive');
      expect(response.details).toBeUndefined();
    });
  });

  describe('Service Integration Examples', () => {
    test('should demonstrate budget service validation workflow', async () => {
      const invalidBudgetData = {
        costCenterId: null,
        plannedAmount: -100,
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      };

      const result = await budgetService.validateBudget(invalidBudgetData, []);
      
      expect(result.isValid).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.errors).toContain('Cost Center ID is required');
      expect(result.errors).toContain('Planned Amount must be a positive number');
      expect(result.errors).toContain('Start date must be before end date');
    });

    test('should demonstrate invoice service validation workflow', () => {
      const invalidInvoiceData = {
        costCenterId: null,
        amount: 0
      };

      const result = invoiceService.validateInvoice(invalidInvoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.errors).toContain('Cost Center ID is required');
      expect(result.errors).toContain('Amount must be a positive number');
    });

    test('should demonstrate cost center service validation workflow', async () => {
      const invalidCostCenterData = { name: '' };
      const existingCostCenters = [];

      const result = await costCenterService.validateCostCenter(invalidCostCenterData, existingCostCenters);
      
      expect(result.isValid).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.errors).toContain('Name is required');
    });
  });

  describe('Consistent Error Format Validation', () => {
    test('should ensure all validation errors follow the same format', () => {
      const testCases = [
        validationService.validateRequired(null, 'Field'),
        validationService.validatePositiveNumber(-1, 'Amount'),
        validationService.validateDateRange('2024-12-31', '2024-01-01'),
        validationService.validateEmail('invalid-email'),
        validationService.validateStringLength('', 'Name', 1, 10)
      ];

      testCases.forEach(result => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('message');
        expect(typeof result.error).toBe('string');
        expect(typeof result.message).toBe('string');
      });
    });

    test('should ensure all HTTP error responses follow the same format', () => {
      const errorResponses = [
        validationService.createBadRequestError('TEST_ERROR', 'Test message'),
        validationService.createUnauthorizedError(),
        validationService.createForbiddenError(),
        validationService.createNotFoundError('Resource'),
        validationService.createConflictError('CONFLICT', 'Conflict message'),
        validationService.createInternalServerError()
      ];

      errorResponses.forEach(errorResponse => {
        expect(errorResponse).toHaveProperty('statusCode');
        expect(errorResponse).toHaveProperty('response');
        expect(errorResponse.response).toHaveProperty('error');
        expect(errorResponse.response).toHaveProperty('message');
        expect(typeof errorResponse.statusCode).toBe('number');
        expect(typeof errorResponse.response.error).toBe('string');
        expect(typeof errorResponse.response.message).toBe('string');
      });
    });
  });
});