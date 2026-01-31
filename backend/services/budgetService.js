/**
 * Budget Service
 * 
 * This service handles all business logic related to budget management including
 * creation, validation, updating, and deletion of budget records. It enforces
 * business rules such as preventing overlapping budget periods for the same
 * analytic account and ensuring data integrity.
 * 
 * Key Features:
 * - Budget creation with comprehensive validation
 * - Budget overlap detection and prevention
 * - Budget updates with conflict checking
 * - Safe budget deletion with validation
 * - Integration with validation service for consistent error handling
 * - Date range overlap calculation utilities
 * 
 * Business Rules:
 * - Budget periods cannot overlap for the same analytic account
 * - All budget amounts must be positive numbers
 * - Start date must be before end date
 * - Analytic account ID is required for all budgets
 * 
 * This service works with database access functions provided by the caller
 * to maintain separation of concerns between business logic and data access.
 */
const validationService = require('./validationService');

class BudgetService {
  // Validates budget data and returns validation result
  async validateBudget(budgetData, existingBudgets = [], excludeBudgetId = null) {
    // Parse lines first to help with validation
    let lines = [];
    const hasLinesProperty = budgetData.analyticLines !== undefined && budgetData.analyticLines !== null;
    
    if (hasLinesProperty) {
      if (typeof budgetData.analyticLines === 'string') {
        try { lines = JSON.parse(budgetData.analyticLines); } catch(e) { lines = []; }
      } else if (Array.isArray(budgetData.analyticLines)) {
        lines = budgetData.analyticLines;
      }
    }

    // Basic validation
    // Analytic account ID is optional ONLY if valid analyticLines are provided
    if (!budgetData.name || (!budgetData.analytic_account_id && lines.length === 0)) {
      return {
        isValid: false,
        errors: ['Name is required. Analytic account or Analytic Lines are required.'],
        statusCode: 400
      };
    }

    // Calculate total amount to ensure it's positive
    let totalAmount = Number(budgetData.planned_amount) || 0;
    
    if (lines.length > 0) {
      const sum = lines.reduce((acc, line) => acc + (Number(line.budgetedAmount) || 0), 0);
      if (sum > 0) totalAmount = sum;
    }

    if (totalAmount <= 0) {
      return {
        isValid: false,
        errors: ['Total planned amount must be positive'],
        statusCode: 400
      };
    }

    if (budgetData.date_from && budgetData.date_to && budgetData.date_from >= budgetData.date_to) {
      return {
        isValid: false,
        errors: ['Start date must be before end date'],
        statusCode: 400
      };
    }

    // Check for budget overlap
    if (existingBudgets && existingBudgets.length > 0) {
      const hasOverlap = existingBudgets.some(budget => {
        if (excludeBudgetId && budget.id === excludeBudgetId) {
          return false;
        }
        return this.dateRangesOverlap(
          budgetData.date_from, budgetData.date_to,
          budget.date_from, budget.date_to
        );
      });

      if (hasOverlap) {
        return {
          isValid: false,
          errors: ['Budget period overlaps with existing budget for this analytic account'],
          statusCode: 409
        };
      }
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
        errors: validation.errors,
        statusCode: validation.statusCode
      };
    }

    try {
      const budget = await saveBudget({
        name: budgetData.name,
        analytic_account_id: budgetData.analytic_account_id,
        date_from: budgetData.date_from,
        date_to: budgetData.date_to,
        planned_amount: budgetData.planned_amount,
        analyticLines: budgetData.analyticLines // Pass analyticLines to DAL
      });

      return {
        success: true,
        budget
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create budget'],
        statusCode: 500
      };
    }
  }

  // Updates budget with validation
  async updateBudget(budgetId, updateData, existingBudgets = [], updateBudgetInDb) {
    if (!budgetId) {
      return {
        success: false,
        error: 'Budget ID is required',
        statusCode: 400
      };
    }

    // Validate the update data
    const validation = await this.validateBudget(updateData, existingBudgets, budgetId);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        statusCode: validation.statusCode
      };
    }

    try {
      const updatedBudget = await updateBudgetInDb(budgetId, {
        name: updateData.name,
        analytic_account_id: updateData.analytic_account_id,
        date_from: updateData.date_from,
        date_to: updateData.date_to,
        planned_amount: updateData.planned_amount
      });

      if (!updatedBudget) {
        return {
          success: false,
          error: 'Budget not found',
          type: 'NotFoundError',
          statusCode: 404
        };
      }

      return {
        success: true,
        budget: updatedBudget
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update budget',
        type: 'ServerError',
        statusCode: 500
      };
    }
  }

  // Validates budget deletion
  async deleteBudget(budgetId, deleteBudgetFromDb) {
    if (!budgetId) {
      return {
        success: false,
        error: 'Budget ID is required',
        statusCode: 400
      };
    }

    try {
      const deleted = await deleteBudgetFromDb(budgetId);
      
      if (!deleted) {
        return {
          success: false,
          error: 'Budget not found',
          type: 'NotFoundError',
          statusCode: 404
        };
      }

      return {
        success: true,
        message: 'Budget deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete budget',
        type: 'ServerError',
        statusCode: 500
      };
    }
  }

  // Calculates if two date ranges overlap
  dateRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }
}

module.exports = new BudgetService();