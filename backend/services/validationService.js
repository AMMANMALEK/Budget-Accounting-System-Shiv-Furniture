class ValidationService {
  // Validates that a value is not null, undefined, or empty string
  validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        error: 'REQUIRED_FIELD_MISSING',
        message: `${fieldName} is required`
      };
    }
    return { isValid: true };
  }

  // Validates that a value is a positive number
  validatePositiveNumber(value, fieldName) {
    if (value === null || value === undefined) {
      return {
        isValid: false,
        error: 'REQUIRED_FIELD_MISSING',
        message: `${fieldName} is required`
      };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        error: 'INVALID_NUMBER',
        message: `${fieldName} must be a valid number`
      };
    }

    if (numValue <= 0) {
      return {
        isValid: false,
        error: 'INVALID_AMOUNT',
        message: `${fieldName} must be a positive number`
      };
    }

    return { isValid: true };
  }

  // Validates that startDate is before endDate
  validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return {
        isValid: false,
        error: 'REQUIRED_FIELD_MISSING',
        message: 'Both start date and end date are required'
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        isValid: false,
        error: 'INVALID_DATE',
        message: 'Invalid date format'
      };
    }

    if (start >= end) {
      return {
        isValid: false,
        error: 'INVALID_DATE_RANGE',
        message: 'Start date must be before end date'
      };
    }

    return { isValid: true };
  }

  // Validates email format
  validateEmail(email) {
    if (!email) {
      return {
        isValid: false,
        error: 'REQUIRED_FIELD_MISSING',
        message: 'Email is required'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'INVALID_EMAIL',
        message: 'Invalid email format'
      };
    }

    return { isValid: true };
  }

  // Validates string length
  validateStringLength(value, fieldName, minLength = 1, maxLength = 255) {
    if (!value) {
      return {
        isValid: false,
        error: 'REQUIRED_FIELD_MISSING',
        message: `${fieldName} is required`
      };
    }

    if (typeof value !== 'string') {
      return {
        isValid: false,
        error: 'INVALID_TYPE',
        message: `${fieldName} must be a string`
      };
    }

    if (value.length < minLength) {
      return {
        isValid: false,
        error: 'STRING_TOO_SHORT',
        message: `${fieldName} must be at least ${minLength} characters long`
      };
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        error: 'STRING_TOO_LONG',
        message: `${fieldName} must be no more than ${maxLength} characters long`
      };
    }

    return { isValid: true };
  }

  // Validates cost center data
  validateCostCenter(data) {
    const errors = [];

    // Validate name - check for empty or whitespace-only strings
    if (!data.name || (typeof data.name === 'string' && data.name.trim() === '')) {
      errors.push({
        error: 'REQUIRED_FIELD_MISSING',
        message: 'Name is required'
      });
    } else {
      const nameValidation = this.validateStringLength(data.name, 'Name', 1, 100);
      if (!nameValidation.isValid) {
        errors.push(nameValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates budget data
  validateBudget(data) {
    const errors = [];

    // Validate cost center ID
    const costCenterValidation = this.validateRequired(data.costCenterId, 'Cost Center ID');
    if (!costCenterValidation.isValid) {
      errors.push(costCenterValidation);
    }

    // Validate planned amount
    const amountValidation = this.validatePositiveNumber(data.plannedAmount, 'Planned Amount');
    if (!amountValidation.isValid) {
      errors.push(amountValidation);
    }

    // Validate date range
    const dateValidation = this.validateDateRange(data.startDate, data.endDate);
    if (!dateValidation.isValid) {
      errors.push(dateValidation);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates invoice data
  validateInvoice(data) {
    const errors = [];

    // Validate amount
    const amountValidation = this.validatePositiveNumber(data.amount, 'Amount');
    if (!amountValidation.isValid) {
      errors.push(amountValidation);
    }

    // Validate cost center ID
    const costCenterValidation = this.validateRequired(data.costCenterId, 'Cost Center ID');
    if (!costCenterValidation.isValid) {
      errors.push(costCenterValidation);
    }

    // Validate description - make it optional for backward compatibility
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description === 'string' && data.description.trim() === '') {
        errors.push({
          error: 'REQUIRED_FIELD_MISSING',
          message: 'Description is required'
        });
      } else if (data.description && data.description.length > 500) {
        errors.push({
          error: 'STRING_TOO_LONG',
          message: 'Description must be no more than 500 characters long'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates purchase bill data
  validatePurchaseBill(data) {
    const errors = [];

    // Validate amount
    const amountValidation = this.validatePositiveNumber(data.amount, 'Amount');
    if (!amountValidation.isValid) {
      errors.push(amountValidation);
    }

    // Validate cost center ID
    const costCenterValidation = this.validateRequired(data.costCenterId, 'Cost Center ID');
    if (!costCenterValidation.isValid) {
      errors.push(costCenterValidation);
    }

    // Validate supplier
    if (data.supplier) {
      const supplierValidation = this.validateStringLength(data.supplier, 'Supplier', 1, 200);
      if (!supplierValidation.isValid) {
        errors.push(supplierValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates production expense data
  validateProductionExpense(data) {
    const errors = [];

    // Validate amount
    const amountValidation = this.validatePositiveNumber(data.amount, 'Amount');
    if (!amountValidation.isValid) {
      errors.push(amountValidation);
    }

    // Validate cost center ID
    const costCenterValidation = this.validateRequired(data.costCenterId, 'Cost Center ID');
    if (!costCenterValidation.isValid) {
      errors.push(costCenterValidation);
    }

    // Validate expense type
    if (data.expenseType) {
      const typeValidation = this.validateStringLength(data.expenseType, 'Expense Type', 1, 100);
      if (!typeValidation.isValid) {
        errors.push(typeValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates product data
  validateProduct(data) {
    const errors = [];

    // Validate name
    const nameValidation = this.validateStringLength(data.name, 'Name', 1, 200);
    if (!nameValidation.isValid) {
      errors.push(nameValidation);
    }

    // Validate category (optional)
    if (data.category) {
      const categoryValidation = this.validateStringLength(data.category, 'Category', 1, 100);
      if (!categoryValidation.isValid) {
        errors.push(categoryValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validates contact data
  validateContact(data) {
    const errors = [];

    // Validate name
    const nameValidation = this.validateStringLength(data.name, 'Name', 1, 200);
    if (!nameValidation.isValid) {
      errors.push(nameValidation);
    }

    // Validate email (optional)
    if (data.email) {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.isValid) {
        errors.push(emailValidation);
      }
    }

    // Validate phone (optional)
    if (data.phone) {
      const phoneValidation = this.validateStringLength(data.phone, 'Phone', 1, 20);
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Checks for budget overlap conflicts
  async validateBudgetOverlap(budgetData, existingBudgets, excludeBudgetId = null) {
    const { costCenterId, startDate, endDate } = budgetData;
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    // Find overlapping budgets for the same cost center
    const overlappingBudgets = existingBudgets.filter(budget => {
      // Skip the budget being updated
      if (excludeBudgetId && budget.id === excludeBudgetId) {
        return false;
      }

      // Only check budgets for the same cost center
      if (budget.costCenterId !== costCenterId) {
        return false;
      }

      const existingStart = new Date(budget.startDate);
      const existingEnd = new Date(budget.endDate);

      // Check for overlap: new budget starts before existing ends AND new budget ends after existing starts
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (overlappingBudgets.length > 0) {
      return {
        isValid: false,
        error: 'BUDGET_OVERLAP',
        message: 'Budget period overlaps with existing budget for the same cost center',
        conflictingBudgets: overlappingBudgets.map(b => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate
        }))
      };
    }

    return { isValid: true };
  }

  // Validates that a record can be posted (must be in draft status)
  validatePostOperation(record, recordType) {
    if (!record) {
      return {
        isValid: false,
        error: 'RECORD_NOT_FOUND',
        message: `${recordType} not found`
      };
    }

    if (record.status !== 'draft') {
      return {
        isValid: false,
        error: 'INVALID_STATUS',
        message: `Only draft ${recordType.toLowerCase()}s can be posted`
      };
    }

    return { isValid: true };
  }

  // Validates bulk operation data
  validateBulkOperation(data, operation) {
    const errors = [];

    if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
      errors.push({
        error: 'INVALID_BULK_DATA',
        message: 'IDs array is required and must not be empty'
      });
    }

    if (data.ids && data.ids.length > 100) {
      errors.push({
        error: 'BULK_LIMIT_EXCEEDED',
        message: 'Cannot process more than 100 records at once'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Creates a standardized validation error response
  createValidationErrorResponse(errors) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    const firstError = errors[0];
    
    return {
      error: firstError.error,
      message: firstError.message,
      details: errors.length > 1 ? {
        additionalErrors: errors.slice(1).map(e => ({
          error: e.error,
          message: e.message
        }))
      } : undefined
    };
  }

  // Creates standardized error responses for different HTTP status codes
  createErrorResponse(statusCode, errorCode, message, details = null) {
    const response = {
      error: errorCode,
      message: message
    };

    if (details) {
      response.details = details;
    }

    return {
      statusCode,
      response
    };
  }

  // Common error responses
  createBadRequestError(errorCode, message, details = null) {
    return this.createErrorResponse(400, errorCode, message, details);
  }

  createUnauthorizedError(message = 'Authentication required') {
    return this.createErrorResponse(401, 'UNAUTHORIZED', message);
  }

  createForbiddenError(message = 'Access denied') {
    return this.createErrorResponse(403, 'FORBIDDEN', message);
  }

  createNotFoundError(resource = 'Resource') {
    return this.createErrorResponse(404, 'NOT_FOUND', `${resource} not found`);
  }

  createConflictError(errorCode, message, details = null) {
    return this.createErrorResponse(409, errorCode, message, details);
  }

  createInternalServerError(message = 'Internal server error') {
    return this.createErrorResponse(500, 'INTERNAL_ERROR', message);
  }
}

module.exports = new ValidationService();