const validationService = require('./validationService');

class BudgetService {
  // Validates budget data and returns validation result
  async validateBudget(budgetData, existingBudgets = [], excludeBudgetId = null) {
    // Use validation service for basic validation
    const basicValidation = validationService.validateBudget(budgetData);
    
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        errors: basicValidation.errors.map(e => e.message), // Convert to string array for backward compatibility
        statusCode: 400
      };
    }

    // Check for budget overlap
    const overlapValidation = await validationService.validateBudgetOverlap(
      budgetData, 
      existingBudgets, 
      excludeBudgetId
    );

    if (!overlapValidation.isValid) {
      return {
        isValid: false,
        errors: [overlapValidation.message],
        statusCode: 409
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  // Creates budget with validation
  async createBudget(budgetData, existingBudgets = [], saveBudget) {
    const validation = await this.validateBudget(budgetData, existingBudgets);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const budget = await saveBudget({
        costCenterId: budgetData.costCenterId,
        startDate: new Date(budgetData.startDate),
        endDate: new Date(budgetData.endDate),
        plannedAmount: budgetData.plannedAmount,
        description: budgetData.description || ''
      });

      return {
        success: true,
        data: budget
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create budget']
      };
    }
  }

  // Updates budget with validation
  async updateBudget(budgetId, updateData, existingBudgets = [], updateBudgetInDb) {
    if (!budgetId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Budget ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    // Validate the update data
    const validation = await this.validateBudget(updateData, existingBudgets, budgetId);
    
    if (!validation.isValid) {
      const errorResponse = validationService.createValidationErrorResponse(validation.errors);
      return {
        success: false,
        statusCode: validation.statusCode,
        ...errorResponse
      };
    }

    try {
      const updatedBudget = await updateBudgetInDb(budgetId, {
        costCenterId: updateData.costCenterId,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        plannedAmount: updateData.plannedAmount,
        description: updateData.description
      });

      if (!updatedBudget) {
        const notFoundError = validationService.createNotFoundError('Budget');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      return {
        success: true,
        data: updatedBudget
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to update budget');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }

  // Validates budget deletion
  async deleteBudget(budgetId, deleteBudgetFromDb) {
    if (!budgetId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Budget ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    try {
      const deleted = await deleteBudgetFromDb(budgetId);
      
      if (!deleted) {
        const notFoundError = validationService.createNotFoundError('Budget');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      return {
        success: true,
        message: 'Budget deleted successfully'
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to delete budget');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }

  // Calculates if two date ranges overlap
  dateRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }
}

module.exports = new BudgetService();