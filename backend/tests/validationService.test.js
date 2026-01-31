const validationService = require('../services/validationService');

describe('ValidationService', () => {
  describe('validateRequired', () => {
    test('should pass for valid values', () => {
      expect(validationService.validateRequired('test', 'Field').isValid).toBe(true);
      expect(validationService.validateRequired(123, 'Field').isValid).toBe(true);
      expect(validationService.validateRequired(0, 'Field').isValid).toBe(true);
      expect(validationService.validateRequired(false, 'Field').isValid).toBe(true);
    });

    test('should fail for null, undefined, or empty string', () => {
      const nullResult = validationService.validateRequired(null, 'Field');
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.error).toBe('REQUIRED_FIELD_MISSING');
      expect(nullResult.message).toBe('Field is required');

      const undefinedResult = validationService.validateRequired(undefined, 'Field');
      expect(undefinedResult.isValid).toBe(false);

      const emptyResult = validationService.validateRequired('', 'Field');
      expect(emptyResult.isValid).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    test('should pass for positive numbers', () => {
      expect(validationService.validatePositiveNumber(1, 'Amount').isValid).toBe(true);
      expect(validationService.validatePositiveNumber(100.5, 'Amount').isValid).toBe(true);
      expect(validationService.validatePositiveNumber('50', 'Amount').isValid).toBe(true);
    });

    test('should fail for zero, negative numbers, or non-numbers', () => {
      const zeroResult = validationService.validatePositiveNumber(0, 'Amount');
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.error).toBe('INVALID_AMOUNT');

      const negativeResult = validationService.validatePositiveNumber(-10, 'Amount');
      expect(negativeResult.isValid).toBe(false);
      expect(negativeResult.error).toBe('INVALID_AMOUNT');

      const stringResult = validationService.validatePositiveNumber('abc', 'Amount');
      expect(stringResult.isValid).toBe(false);
      expect(stringResult.error).toBe('INVALID_NUMBER');

      const nullResult = validationService.validatePositiveNumber(null, 'Amount');
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.error).toBe('REQUIRED_FIELD_MISSING');
    });
  });

  describe('validateDateRange', () => {
    test('should pass for valid date ranges', () => {
      const result = validationService.validateDateRange('2024-01-01', '2024-12-31');
      expect(result.isValid).toBe(true);
    });

    test('should fail when start date is after end date', () => {
      const result = validationService.validateDateRange('2024-12-31', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_DATE_RANGE');
      expect(result.message).toBe('Start date must be before end date');
    });

    test('should fail when start date equals end date', () => {
      const result = validationService.validateDateRange('2024-01-01', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_DATE_RANGE');
    });

    test('should fail for invalid date formats', () => {
      const result = validationService.validateDateRange('invalid-date', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_DATE');
    });

    test('should fail for missing dates', () => {
      const result = validationService.validateDateRange(null, '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('REQUIRED_FIELD_MISSING');
    });
  });

  describe('validateEmail', () => {
    test('should pass for valid email addresses', () => {
      expect(validationService.validateEmail('test@example.com').isValid).toBe(true);
      expect(validationService.validateEmail('user.name@domain.co.uk').isValid).toBe(true);
    });

    test('should fail for invalid email formats', () => {
      const result = validationService.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');

      const result2 = validationService.validateEmail('test@');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('INVALID_EMAIL');
    });

    test('should fail for empty email', () => {
      const result = validationService.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('REQUIRED_FIELD_MISSING');
    });
  });

  describe('validateStringLength', () => {
    test('should pass for valid string lengths', () => {
      expect(validationService.validateStringLength('test', 'Name', 1, 10).isValid).toBe(true);
      expect(validationService.validateStringLength('a', 'Name', 1, 10).isValid).toBe(true);
    });

    test('should fail for strings that are too short', () => {
      const result = validationService.validateStringLength('', 'Name', 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('REQUIRED_FIELD_MISSING');
    });

    test('should fail for strings that are too long', () => {
      const result = validationService.validateStringLength('this is a very long string', 'Name', 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('STRING_TOO_LONG');
    });

    test('should fail for non-string values', () => {
      const result = validationService.validateStringLength(123, 'Name', 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_TYPE');
    });
  });

  describe('validateCostCenter', () => {
    test('should pass for valid cost center data', () => {
      const data = { name: 'Marketing' };
      const result = validationService.validateCostCenter(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail for missing name', () => {
      const data = {};
      const result = validationService.validateCostCenter(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('REQUIRED_FIELD_MISSING');
    });

    test('should fail for name that is too long', () => {
      const data = { name: 'a'.repeat(101) };
      const result = validationService.validateCostCenter(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].error).toBe('STRING_TOO_LONG');
    });
  });

  describe('validateBudget', () => {
    test('should pass for valid budget data', () => {
      const data = {
        costCenterId: 'cc1',
        plannedAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      const result = validationService.validateBudget(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail for invalid budget data', () => {
      const data = {
        costCenterId: null,
        plannedAmount: -100,
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      };
      const result = validationService.validateBudget(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      
      const errorCodes = result.errors.map(e => e.error);
      expect(errorCodes).toContain('REQUIRED_FIELD_MISSING');
      expect(errorCodes).toContain('INVALID_AMOUNT');
      expect(errorCodes).toContain('INVALID_DATE_RANGE');
    });
  });

  describe('validateInvoice', () => {
    test('should pass for valid invoice data', () => {
      const data = {
        amount: 500,
        costCenterId: 'cc1',
        description: 'Test invoice'
      };
      const result = validationService.validateInvoice(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail for invalid invoice data', () => {
      const data = {
        amount: 0,
        costCenterId: null,
        description: 'a'.repeat(501)
      };
      const result = validationService.validateInvoice(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('validatePurchaseBill', () => {
    test('should pass for valid purchase bill data', () => {
      const data = {
        amount: 300,
        costCenterId: 'cc1',
        supplier: 'Test Supplier'
      };
      const result = validationService.validatePurchaseBill(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail for invalid purchase bill data', () => {
      const data = {
        amount: -50,
        costCenterId: '',
        supplier: 'a'.repeat(201)
      };
      const result = validationService.validatePurchaseBill(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateProductionExpense', () => {
    test('should pass for valid production expense data', () => {
      const data = {
        amount: 750,
        costCenterId: 'cc1',
        expenseType: 'Materials'
      };
      const result = validationService.validateProductionExpense(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail for invalid production expense data', () => {
      const data = {
        amount: 'invalid',
        costCenterId: null
      };
      const result = validationService.validateProductionExpense(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateProduct', () => {
    test('should pass for valid product data', () => {
      const data = {
        name: 'Test Product',
        category: 'Electronics'
      };
      const result = validationService.validateProduct(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail for missing product name', () => {
      const data = { category: 'Electronics' };
      const result = validationService.validateProduct(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].error).toBe('REQUIRED_FIELD_MISSING');
    });
  });

  describe('validateContact', () => {
    test('should pass for valid contact data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      };
      const result = validationService.validateContact(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail for invalid contact data', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        phone: 'a'.repeat(21)
      };
      const result = validationService.validateContact(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBudgetOverlap', () => {
    const existingBudgets = [
      {
        id: 1,
        costCenterId: 'cc1',
        startDate: '2024-01-01',
        endDate: '2024-06-30'
      },
      {
        id: 2,
        costCenterId: 'cc1',
        startDate: '2024-07-01',
        endDate: '2024-12-31'
      },
      {
        id: 3,
        costCenterId: 'cc2',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    ];

    test('should pass for non-overlapping budget', async () => {
      const budgetData = {
        costCenterId: 'cc3',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      const result = await validationService.validateBudgetOverlap(budgetData, existingBudgets);
      expect(result.isValid).toBe(true);
    });

    test('should fail for overlapping budget', async () => {
      const budgetData = {
        costCenterId: 'cc1',
        startDate: '2024-03-01',
        endDate: '2024-09-30'
      };
      const result = await validationService.validateBudgetOverlap(budgetData, existingBudgets);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('BUDGET_OVERLAP');
      expect(result.conflictingBudgets).toHaveLength(2);
    });

    test('should exclude budget being updated', async () => {
      const budgetData = {
        costCenterId: 'cc1',
        startDate: '2024-01-01',
        endDate: '2024-06-30'
      };
      const result = await validationService.validateBudgetOverlap(budgetData, existingBudgets, 1);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePostOperation', () => {
    test('should pass for draft record', () => {
      const record = { status: 'draft' };
      const result = validationService.validatePostOperation(record, 'Invoice');
      expect(result.isValid).toBe(true);
    });

    test('should fail for posted record', () => {
      const record = { status: 'posted' };
      const result = validationService.validatePostOperation(record, 'Invoice');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_STATUS');
    });

    test('should fail for null record', () => {
      const result = validationService.validatePostOperation(null, 'Invoice');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('RECORD_NOT_FOUND');
    });
  });

  describe('validateBulkOperation', () => {
    test('should pass for valid bulk data', () => {
      const data = { ids: [1, 2, 3] };
      const result = validationService.validateBulkOperation(data, 'delete');
      expect(result.isValid).toBe(true);
    });

    test('should fail for missing ids', () => {
      const data = {};
      const result = validationService.validateBulkOperation(data, 'delete');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].error).toBe('INVALID_BULK_DATA');
    });

    test('should fail for too many ids', () => {
      const data = { ids: Array.from({ length: 101 }, (_, i) => i) };
      const result = validationService.validateBulkOperation(data, 'delete');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].error).toBe('BULK_LIMIT_EXCEEDED');
    });
  });

  describe('Error response creation', () => {
    test('should create validation error response', () => {
      const errors = [
        { error: 'REQUIRED_FIELD_MISSING', message: 'Name is required' },
        { error: 'INVALID_AMOUNT', message: 'Amount must be positive' }
      ];
      const response = validationService.createValidationErrorResponse(errors);
      
      expect(response.error).toBe('REQUIRED_FIELD_MISSING');
      expect(response.message).toBe('Name is required');
      expect(response.details.additionalErrors).toHaveLength(1);
    });

    test('should create standardized error responses', () => {
      const badRequest = validationService.createBadRequestError('INVALID_DATA', 'Invalid input');
      expect(badRequest.statusCode).toBe(400);
      expect(badRequest.response.error).toBe('INVALID_DATA');

      const unauthorized = validationService.createUnauthorizedError();
      expect(unauthorized.statusCode).toBe(401);
      expect(unauthorized.response.error).toBe('UNAUTHORIZED');

      const forbidden = validationService.createForbiddenError();
      expect(forbidden.statusCode).toBe(403);
      expect(forbidden.response.error).toBe('FORBIDDEN');

      const notFound = validationService.createNotFoundError('User');
      expect(notFound.statusCode).toBe(404);
      expect(notFound.response.error).toBe('NOT_FOUND');

      const conflict = validationService.createConflictError('DUPLICATE_ENTRY', 'Record already exists');
      expect(conflict.statusCode).toBe(409);
      expect(conflict.response.error).toBe('DUPLICATE_ENTRY');

      const serverError = validationService.createInternalServerError();
      expect(serverError.statusCode).toBe(500);
      expect(serverError.response.error).toBe('INTERNAL_ERROR');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete budget validation workflow', () => {
      const invalidBudget = {
        costCenterId: null,
        plannedAmount: -100,
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      };

      const validation = validationService.validateBudget(invalidBudget);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);

      const errorResponse = validationService.createValidationErrorResponse(validation.errors);
      expect(errorResponse.error).toBe('REQUIRED_FIELD_MISSING');
      expect(errorResponse.details.additionalErrors).toHaveLength(2);
    });

    test('should handle complete invoice validation workflow', () => {
      const validInvoice = {
        amount: 500,
        costCenterId: 'cc1',
        description: 'Valid invoice'
      };

      const validation = validationService.validateInvoice(validInvoice);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});