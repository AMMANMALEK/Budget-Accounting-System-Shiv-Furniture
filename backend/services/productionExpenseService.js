class ProductionExpenseService {
  // Validates production expense data and returns validation result
  validateProductionExpense(productionExpenseData) {
    const errors = [];

    // Validate required fields
    if (!productionExpenseData.costCenterId) {
      errors.push('Cost center ID is required');
    }

    if (productionExpenseData.amount === undefined || productionExpenseData.amount === null) {
      errors.push('Production expense amount is required');
    }

    // Amount must be > 0
    if (productionExpenseData.amount !== undefined && productionExpenseData.amount <= 0) {
      errors.push('Production expense amount must be greater than 0');
    }

    if (!productionExpenseData.description || productionExpenseData.description.trim() === '') {
      errors.push('Production expense description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Creates production expense with validation - always sets status to 'draft'
  async createProductionExpense(productionExpenseData, saveProductionExpense) {
    const validation = this.validateProductionExpense(productionExpenseData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const productionExpense = await saveProductionExpense({
        costCenterId: productionExpenseData.costCenterId,
        amount: productionExpenseData.amount,
        description: productionExpenseData.description.trim(),
        status: 'draft', // New production expenses are always created with status = 'draft'
        expenseDate: productionExpenseData.expenseDate ? new Date(productionExpenseData.expenseDate) : new Date(),
        productId: productionExpenseData.productId || null
      });

      return {
        success: true,
        data: productionExpense
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create production expense']
      };
    }
  }

  // Validates production expense update - only draft expenses can be modified
  async validateProductionExpenseUpdate(productionExpenseId, updateData, getProductionExpenseById) {
    const errors = [];

    if (!productionExpenseId) {
      errors.push('Production expense ID is required');
    }

    // Get current production expense to check status
    if (getProductionExpenseById) {
      try {
        const currentProductionExpense = await getProductionExpenseById(productionExpenseId);
        if (!currentProductionExpense) {
          errors.push('Production expense not found');
        } else if (currentProductionExpense.status === 'posted') {
          errors.push('Posted production expenses cannot be modified');
        }
      } catch (error) {
        errors.push('Failed to retrieve production expense');
      }
    }

    // Validate amount if being updated
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      errors.push('Production expense amount must be greater than 0');
    }

    // Validate description if being updated
    if (updateData.description !== undefined && (!updateData.description || updateData.description.trim() === '')) {
      errors.push('Production expense description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Posts a production expense - changes status from 'draft' to 'posted'
  async postProductionExpense(productionExpenseId, getProductionExpenseById, updateProductionExpenseStatus) {
    if (!productionExpenseId) {
      return {
        success: false,
        errors: ['Production expense ID is required']
      };
    }

    try {
      // Get current production expense to validate posting rules
      const productionExpense = await getProductionExpenseById(productionExpenseId);
      
      if (!productionExpense) {
        return {
          success: false,
          errors: ['Production expense not found']
        };
      }

      // Only expenses in 'draft' can be posted
      if (productionExpense.status !== 'draft') {
        return {
          success: false,
          errors: ['Only draft production expenses can be posted']
        };
      }

      // Change status from 'draft' to 'posted'
      const updatedProductionExpense = await updateProductionExpenseStatus(productionExpenseId, 'posted');

      return {
        success: true,
        data: updatedProductionExpense
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to post production expense']
      };
    }
  }

  // Validates if production expense can be posted
  async canPostProductionExpense(productionExpenseId, getProductionExpenseById) {
    if (!productionExpenseId) {
      return {
        canPost: false,
        reason: 'Production expense ID is required'
      };
    }

    try {
      const productionExpense = await getProductionExpenseById(productionExpenseId);
      
      if (!productionExpense) {
        return {
          canPost: false,
          reason: 'Production expense not found'
        };
      }

      if (productionExpense.status === 'posted') {
        return {
          canPost: false,
          reason: 'Production expense is already posted'
        };
      }

      if (productionExpense.status !== 'draft') {
        return {
          canPost: false,
          reason: 'Only draft production expenses can be posted'
        };
      }

      return {
        canPost: true,
        reason: 'Production expense can be posted'
      };
    } catch (error) {
      return {
        canPost: false,
        reason: 'Failed to check production expense status'
      };
    }
  }

  // Gets production expense status information
  getProductionExpenseStatusInfo(status) {
    const statusInfo = {
      draft: {
        canModify: true,
        canPost: true,
        description: 'Production expense is in draft status and can be modified or posted'
      },
      posted: {
        canModify: false,
        canPost: false,
        description: 'Production expense is posted and cannot be modified or posted again'
      }
    };

    return statusInfo[status] || {
      canModify: false,
      canPost: false,
      description: 'Unknown production expense status'
    };
  }
}

module.exports = new ProductionExpenseService();