class PurchaseBillService {
  // Validates purchase bill data and returns validation result
  validatePurchaseBill(purchaseBillData) {
    const errors = [];

    // Validate required fields
    if (!purchaseBillData.costCenterId) {
      errors.push('Cost center ID is required');
    }

    if (purchaseBillData.amount === undefined || purchaseBillData.amount === null) {
      errors.push('Purchase bill amount is required');
    }

    // Amount must be > 0
    if (purchaseBillData.amount !== undefined && purchaseBillData.amount <= 0) {
      errors.push('Purchase bill amount must be greater than 0');
    }

    if (!purchaseBillData.description || purchaseBillData.description.trim() === '') {
      errors.push('Purchase bill description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Creates purchase bill with validation - always sets status to 'draft'
  async createPurchaseBill(purchaseBillData, savePurchaseBill) {
    const validation = this.validatePurchaseBill(purchaseBillData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const purchaseBill = await savePurchaseBill({
        costCenterId: purchaseBillData.costCenterId,
        amount: purchaseBillData.amount,
        description: purchaseBillData.description.trim(),
        status: 'draft', // New purchase bills are always created with status = 'draft'
        billDate: purchaseBillData.billDate ? new Date(purchaseBillData.billDate) : new Date(),
        supplierId: purchaseBillData.supplierId || null
      });

      return {
        success: true,
        data: purchaseBill
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create purchase bill']
      };
    }
  }

  // Validates purchase bill update - only draft bills can be modified
  async validatePurchaseBillUpdate(purchaseBillId, updateData, getPurchaseBillById) {
    const errors = [];

    if (!purchaseBillId) {
      errors.push('Purchase bill ID is required');
    }

    // Get current purchase bill to check status
    if (getPurchaseBillById) {
      try {
        const currentPurchaseBill = await getPurchaseBillById(purchaseBillId);
        if (!currentPurchaseBill) {
          errors.push('Purchase bill not found');
        } else if (currentPurchaseBill.status === 'posted') {
          errors.push('Posted purchase bills cannot be modified');
        }
      } catch (error) {
        errors.push('Failed to retrieve purchase bill');
      }
    }

    // Validate amount if being updated
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      errors.push('Purchase bill amount must be greater than 0');
    }

    // Validate description if being updated
    if (updateData.description !== undefined && (!updateData.description || updateData.description.trim() === '')) {
      errors.push('Purchase bill description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Posts a purchase bill - changes status from 'draft' to 'posted'
  async postPurchaseBill(purchaseBillId, getPurchaseBillById, updatePurchaseBillStatus) {
    if (!purchaseBillId) {
      return {
        success: false,
        errors: ['Purchase bill ID is required']
      };
    }

    try {
      // Get current purchase bill to validate posting rules
      const purchaseBill = await getPurchaseBillById(purchaseBillId);
      
      if (!purchaseBill) {
        return {
          success: false,
          errors: ['Purchase bill not found']
        };
      }

      // Only bills in 'draft' can be posted
      if (purchaseBill.status !== 'draft') {
        return {
          success: false,
          errors: ['Only draft purchase bills can be posted']
        };
      }

      // Change status from 'draft' to 'posted'
      const updatedPurchaseBill = await updatePurchaseBillStatus(purchaseBillId, 'posted');

      return {
        success: true,
        data: updatedPurchaseBill
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to post purchase bill']
      };
    }
  }

  // Validates if purchase bill can be posted
  async canPostPurchaseBill(purchaseBillId, getPurchaseBillById) {
    if (!purchaseBillId) {
      return {
        canPost: false,
        reason: 'Purchase bill ID is required'
      };
    }

    try {
      const purchaseBill = await getPurchaseBillById(purchaseBillId);
      
      if (!purchaseBill) {
        return {
          canPost: false,
          reason: 'Purchase bill not found'
        };
      }

      if (purchaseBill.status === 'posted') {
        return {
          canPost: false,
          reason: 'Purchase bill is already posted'
        };
      }

      if (purchaseBill.status !== 'draft') {
        return {
          canPost: false,
          reason: 'Only draft purchase bills can be posted'
        };
      }

      return {
        canPost: true,
        reason: 'Purchase bill can be posted'
      };
    } catch (error) {
      return {
        canPost: false,
        reason: 'Failed to check purchase bill status'
      };
    }
  }

  // Gets purchase bill status information
  getPurchaseBillStatusInfo(status) {
    const statusInfo = {
      draft: {
        canModify: true,
        canPost: true,
        description: 'Purchase bill is in draft status and can be modified or posted'
      },
      posted: {
        canModify: false,
        canPost: false,
        description: 'Purchase bill is posted and cannot be modified or posted again'
      }
    };

    return statusInfo[status] || {
      canModify: false,
      canPost: false,
      description: 'Unknown purchase bill status'
    };
  }
}

module.exports = new PurchaseBillService();