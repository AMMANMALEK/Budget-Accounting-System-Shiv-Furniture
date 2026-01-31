# Backend Validation and Error Handling System

## Overview

This document describes the comprehensive validation and error handling system implemented for the budget and expense tracking backend. The system provides consistent validation rules, standardized error responses, and predictable HTTP status codes across all endpoints.

## Key Features

### ✅ **Standardized Error Response Format**
All errors follow a consistent format:
```json
{
  "error": "SHORT_ERROR_CODE",
  "message": "Human-readable explanation",
  "details": {
    "additionalErrors": [...],
    "conflictingRecords": [...],
    "operation": "...",
    "resourceType": "..."
  }
}
```

### ✅ **HTTP Status Code Mapping**
- **400 Bad Request**: Validation errors (invalid data format, missing required fields)
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied (insufficient permissions)
- **404 Not Found**: Resource not found
- **409 Conflict**: Business rule violations (budget overlaps, record immutability)
- **500 Internal Server Error**: Server-side errors

### ✅ **Comprehensive Validation Rules**

#### **Amount Validation**
- Must be positive numbers (> 0)
- Rejects zero, negative values, and non-numeric input
- Error codes: `INVALID_AMOUNT`, `INVALID_NUMBER`, `REQUIRED_FIELD_MISSING`

#### **Date Range Validation**
- Start date must be before end date
- Validates date format
- Error codes: `INVALID_DATE_RANGE`, `INVALID_DATE`, `REQUIRED_FIELD_MISSING`

#### **Budget Overlap Prevention**
- Prevents overlapping budget periods for the same cost center
- Excludes current budget when updating
- Error code: `BUDGET_OVERLAP`

#### **Required Field Validation**
- Checks for null, undefined, or empty string values
- Error code: `REQUIRED_FIELD_MISSING`

#### **String Length Validation**
- Configurable minimum and maximum lengths
- Error codes: `STRING_TOO_SHORT`, `STRING_TOO_LONG`, `INVALID_TYPE`

## Implementation

### Core Services

#### **ValidationService** (`services/validationService.js`)
Central validation service providing:
- Field validation methods
- Business rule validation
- Error response creation
- Standardized HTTP status code mapping

#### **Updated Business Services**
- **BudgetService**: Integrated validation with overlap detection
- **InvoiceService**: Amount and status validation
- **CostCenterService**: Name validation and duplicate prevention

### Validation Methods

```javascript
// Basic field validation
validationService.validateRequired(value, fieldName)
validationService.validatePositiveNumber(value, fieldName)
validationService.validateDateRange(startDate, endDate)
validationService.validateEmail(email)
validationService.validateStringLength(value, fieldName, minLength, maxLength)

// Business object validation
validationService.validateBudget(budgetData)
validationService.validateInvoice(invoiceData)
validationService.validateCostCenter(costCenterData)
validationService.validateProduct(productData)
validationService.validateContact(contactData)

// Business rule validation
validationService.validateBudgetOverlap(budgetData, existingBudgets, excludeId)
validationService.validatePostOperation(record, recordType)
validationService.validateBulkOperation(data, operation)

// Error response creation
validationService.createBadRequestError(errorCode, message, details)
validationService.createUnauthorizedError(message)
validationService.createForbiddenError(message)
validationService.createNotFoundError(resource)
validationService.createConflictError(errorCode, message, details)
validationService.createInternalServerError(message)
```

## Usage Examples

### Controller Implementation

```javascript
// Budget creation with validation
async createBudget(req, res) {
  try {
    const budgetData = req.body;
    const existingBudgets = await getBudgetsFromDb();
    
    const result = await budgetService.createBudget(budgetData, existingBudgets, saveBudgetToDb);

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
```

### Middleware Implementation

```javascript
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
```

## Error Response Examples

### Validation Error (HTTP 400)
```json
{
  "error": "REQUIRED_FIELD_MISSING",
  "message": "Cost Center ID is required",
  "details": {
    "additionalErrors": [
      {
        "error": "INVALID_AMOUNT",
        "message": "Planned Amount must be a positive number"
      },
      {
        "error": "INVALID_DATE_RANGE",
        "message": "Start date must be before end date"
      }
    ]
  }
}
```

### Business Rule Conflict (HTTP 409)
```json
{
  "error": "BUDGET_OVERLAP",
  "message": "Budget period overlaps with existing budget for the same cost center",
  "details": {
    "conflictingBudgets": [
      {
        "id": 1,
        "startDate": "2024-01-01",
        "endDate": "2024-06-30"
      }
    ]
  }
}
```

### Access Denied (HTTP 403)
```json
{
  "error": "FORBIDDEN",
  "message": "Portal users cannot modify business data",
  "details": {
    "operation": "create",
    "resourceType": "budget",
    "userRole": "portal"
  }
}
```

## Validation Rules Summary

### Budget Validation
- ✅ Cost Center ID required
- ✅ Planned Amount > 0
- ✅ Start Date < End Date
- ✅ No overlapping periods for same cost center
- ✅ Valid date formats

### Invoice Validation
- ✅ Cost Center ID required
- ✅ Amount > 0
- ✅ Description optional but validated if provided
- ✅ Only draft invoices can be modified
- ✅ Only draft invoices can be posted

### Cost Center Validation
- ✅ Name required (no empty/whitespace-only)
- ✅ Name length limits (1-100 characters)
- ✅ No duplicate names
- ✅ Case-insensitive duplicate checking

### Purchase Bill & Production Expense Validation
- ✅ Same rules as invoices
- ✅ Consistent behavior across all transaction types
- ✅ Status-based modification restrictions

## Benefits

### **Frontend-Friendly**
- Consistent error format makes frontend error handling predictable
- Detailed error messages help with user experience
- Multiple validation errors returned in single response

### **Backend Security**
- Validation cannot be bypassed by frontend manipulation
- Business rules enforced at the data layer
- Consistent behavior regardless of client implementation

### **Developer Experience**
- Standardized validation patterns
- Reusable validation methods
- Clear error codes for debugging
- Comprehensive test coverage

### **Maintainability**
- Centralized validation logic
- Easy to add new validation rules
- Consistent error handling patterns
- Well-documented validation requirements

## Testing

The validation system includes comprehensive tests:
- **44 tests** for ValidationService core functionality
- **25 tests** for integration scenarios
- **100% coverage** of validation methods
- **Real-world examples** with business data

Run tests with:
```bash
npm test validationService
npm test validationIntegration
```

## Future Enhancements

- **Custom validation rules** for specific business requirements
- **Async validation** for database-dependent checks
- **Validation caching** for performance optimization
- **Internationalization** support for error messages
- **Validation schemas** for complex nested objects