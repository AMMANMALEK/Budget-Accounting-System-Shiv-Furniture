const recordImmutabilityService = require('../services/recordImmutabilityService');

describe('RecordImmutabilityService', () => {
  // Mock data
  const mockDraftRecord = { id: 1, status: 'draft', amount: 100 };
  const mockPostedRecord = { id: 2, status: 'posted', amount: 200 };
  const mockInvalidStatusRecord = { id: 3, status: 'unknown', amount: 300 };

  // Mock functions
  const mockGetRecordById = jest.fn();
  const mockGetInvoiceById = jest.fn();
  const mockGetPurchaseBillById = jest.fn();
  const mockGetProductionExpenseById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRecordUpdate', () => {
    test('should allow update for draft record', () => {
      const result = recordImmutabilityService.validateRecordUpdate(mockDraftRecord, 'Invoice');
      
      expect(result).toEqual({
        canUpdate: true,
        statusCode: 200,
        message: 'Invoice can be updated'
      });
    });

    test('should block update for posted record', () => {
      const result = recordImmutabilityService.validateRecordUpdate(mockPostedRecord, 'Invoice');
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });

    test('should handle null record', () => {
      const result = recordImmutabilityService.validateRecordUpdate(null, 'Invoice');
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 404,
        error: 'Invoice not found'
      });
    });

    test('should use default record type when not specified', () => {
      const result = recordImmutabilityService.validateRecordUpdate(null);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 404,
        error: 'record not found'
      });
    });
  });

  describe('validateRecordDeletion', () => {
    test('should allow deletion for draft record', () => {
      const result = recordImmutabilityService.validateRecordDeletion(mockDraftRecord, 'Purchase bill');
      
      expect(result).toEqual({
        canDelete: true,
        statusCode: 200,
        message: 'Purchase bill can be deleted'
      });
    });

    test('should block deletion for posted record', () => {
      const result = recordImmutabilityService.validateRecordDeletion(mockPostedRecord, 'Purchase bill');
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });

    test('should handle null record', () => {
      const result = recordImmutabilityService.validateRecordDeletion(null, 'Purchase bill');
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 404,
        error: 'Purchase bill not found'
      });
    });
  });

  describe('validateInvoiceUpdate', () => {
    test('should allow update for draft invoice', async () => {
      mockGetInvoiceById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateInvoiceUpdate(1, mockGetInvoiceById);
      
      expect(mockGetInvoiceById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        canUpdate: true,
        statusCode: 200,
        message: 'Invoice can be updated'
      });
    });

    test('should block update for posted invoice', async () => {
      mockGetInvoiceById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validateInvoiceUpdate(2, mockGetInvoiceById);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });

    test('should handle database error', async () => {
      mockGetInvoiceById.mockRejectedValue(new Error('Database error'));
      
      const result = await recordImmutabilityService.validateInvoiceUpdate(1, mockGetInvoiceById);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 500,
        error: 'Failed to retrieve invoice for validation'
      });
    });
  });

  describe('validateInvoiceDeletion', () => {
    test('should allow deletion for draft invoice', async () => {
      mockGetInvoiceById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateInvoiceDeletion(1, mockGetInvoiceById);
      
      expect(result).toEqual({
        canDelete: true,
        statusCode: 200,
        message: 'Invoice can be deleted'
      });
    });

    test('should block deletion for posted invoice', async () => {
      mockGetInvoiceById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validateInvoiceDeletion(2, mockGetInvoiceById);
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });

    test('should handle database error', async () => {
      mockGetInvoiceById.mockRejectedValue(new Error('Database error'));
      
      const result = await recordImmutabilityService.validateInvoiceDeletion(1, mockGetInvoiceById);
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 500,
        error: 'Failed to retrieve invoice for validation'
      });
    });
  });

  describe('validatePurchaseBillUpdate', () => {
    test('should allow update for draft purchase bill', async () => {
      mockGetPurchaseBillById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validatePurchaseBillUpdate(1, mockGetPurchaseBillById);
      
      expect(result).toEqual({
        canUpdate: true,
        statusCode: 200,
        message: 'Purchase bill can be updated'
      });
    });

    test('should block update for posted purchase bill', async () => {
      mockGetPurchaseBillById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validatePurchaseBillUpdate(2, mockGetPurchaseBillById);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });

    test('should handle database error', async () => {
      mockGetPurchaseBillById.mockRejectedValue(new Error('Database error'));
      
      const result = await recordImmutabilityService.validatePurchaseBillUpdate(1, mockGetPurchaseBillById);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 500,
        error: 'Failed to retrieve purchase bill for validation'
      });
    });
  });

  describe('validatePurchaseBillDeletion', () => {
    test('should allow deletion for draft purchase bill', async () => {
      mockGetPurchaseBillById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validatePurchaseBillDeletion(1, mockGetPurchaseBillById);
      
      expect(result).toEqual({
        canDelete: true,
        statusCode: 200,
        message: 'Purchase bill can be deleted'
      });
    });

    test('should block deletion for posted purchase bill', async () => {
      mockGetPurchaseBillById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validatePurchaseBillDeletion(2, mockGetPurchaseBillById);
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });
  });

  describe('validateProductionExpenseUpdate', () => {
    test('should allow update for draft production expense', async () => {
      mockGetProductionExpenseById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateProductionExpenseUpdate(1, mockGetProductionExpenseById);
      
      expect(result).toEqual({
        canUpdate: true,
        statusCode: 200,
        message: 'Production expense can be updated'
      });
    });

    test('should block update for posted production expense', async () => {
      mockGetProductionExpenseById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validateProductionExpenseUpdate(2, mockGetProductionExpenseById);
      
      expect(result).toEqual({
        canUpdate: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });
  });

  describe('validateProductionExpenseDeletion', () => {
    test('should allow deletion for draft production expense', async () => {
      mockGetProductionExpenseById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateProductionExpenseDeletion(1, mockGetProductionExpenseById);
      
      expect(result).toEqual({
        canDelete: true,
        statusCode: 200,
        message: 'Production expense can be deleted'
      });
    });

    test('should block deletion for posted production expense', async () => {
      mockGetProductionExpenseById.mockResolvedValue(mockPostedRecord);
      
      const result = await recordImmutabilityService.validateProductionExpenseDeletion(2, mockGetProductionExpenseById);
      
      expect(result).toEqual({
        canDelete: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      });
    });
  });

  describe('validateRecordOperation', () => {
    test('should validate update operation', async () => {
      mockGetRecordById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateRecordOperation(1, mockGetRecordById, 'update', 'Invoice');
      
      expect(result).toEqual({
        canUpdate: true,
        statusCode: 200,
        message: 'Invoice can be updated'
      });
    });

    test('should validate delete operation', async () => {
      mockGetRecordById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateRecordOperation(1, mockGetRecordById, 'delete', 'Invoice');
      
      expect(result).toEqual({
        canDelete: true,
        statusCode: 200,
        message: 'Invoice can be deleted'
      });
    });

    test('should handle database error in generic validation', async () => {
      mockGetRecordById.mockRejectedValue(new Error('Database error'));
      
      const result = await recordImmutabilityService.validateRecordOperation(1, mockGetRecordById, 'update', 'Invoice');
      
      expect(result).toEqual({
        canUpdate: false,
        canDelete: false,
        statusCode: 500,
        error: 'Failed to retrieve invoice for validation'
      });
    });
  });

  describe('isRecordPosted', () => {
    test('should return true for posted record', () => {
      expect(recordImmutabilityService.isRecordPosted(mockPostedRecord)).toBe(true);
    });

    test('should return false for draft record', () => {
      expect(recordImmutabilityService.isRecordPosted(mockDraftRecord)).toBe(false);
    });

    test('should return falsy for null record', () => {
      expect(recordImmutabilityService.isRecordPosted(null)).toBeFalsy();
    });

    test('should return false for record with unknown status', () => {
      expect(recordImmutabilityService.isRecordPosted(mockInvalidStatusRecord)).toBe(false);
    });
  });

  describe('isRecordDraft', () => {
    test('should return true for draft record', () => {
      expect(recordImmutabilityService.isRecordDraft(mockDraftRecord)).toBe(true);
    });

    test('should return false for posted record', () => {
      expect(recordImmutabilityService.isRecordDraft(mockPostedRecord)).toBe(false);
    });

    test('should return falsy for null record', () => {
      expect(recordImmutabilityService.isRecordDraft(null)).toBeFalsy();
    });
  });

  describe('getAllowedOperations', () => {
    test('should return all operations allowed for draft record', () => {
      const result = recordImmutabilityService.getAllowedOperations(mockDraftRecord);
      
      expect(result).toEqual({
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canPost: true
      });
    });

    test('should return only read allowed for posted record', () => {
      const result = recordImmutabilityService.getAllowedOperations(mockPostedRecord);
      
      expect(result).toEqual({
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canPost: false
      });
    });

    test('should return only read allowed for unknown status record', () => {
      const result = recordImmutabilityService.getAllowedOperations(mockInvalidStatusRecord);
      
      expect(result).toEqual({
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canPost: false
      });
    });

    test('should return no operations allowed for null record', () => {
      const result = recordImmutabilityService.getAllowedOperations(null);
      
      expect(result).toEqual({
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canPost: false
      });
    });
  });

  describe('createImmutabilityError', () => {
    test('should create standardized error response', () => {
      const result = recordImmutabilityService.createImmutabilityError('Invoice', 'update');
      
      expect(result).toEqual({
        success: false,
        statusCode: 403,
        error: 'Posted records cannot be modified',
        details: {
          recordType: 'Invoice',
          operation: 'update',
          reason: 'Record is in posted status and cannot be modified to maintain accounting integrity'
        }
      });
    });

    test('should use default values when parameters not provided', () => {
      const result = recordImmutabilityService.createImmutabilityError();
      
      expect(result).toEqual({
        success: false,
        statusCode: 403,
        error: 'Posted records cannot be modified',
        details: {
          recordType: 'record',
          operation: 'modify',
          reason: 'Record is in posted status and cannot be modified to maintain accounting integrity'
        }
      });
    });
  });

  describe('createOperationAllowedResponse', () => {
    test('should create standardized success response', () => {
      const result = recordImmutabilityService.createOperationAllowedResponse('Invoice', 'update');
      
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Invoice update operation is allowed',
        details: {
          recordType: 'Invoice',
          operation: 'update',
          reason: 'Record is in draft status and can be modified'
        }
      });
    });

    test('should use default values when parameters not provided', () => {
      const result = recordImmutabilityService.createOperationAllowedResponse();
      
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'record modify operation is allowed',
        details: {
          recordType: 'record',
          operation: 'modify',
          reason: 'Record is in draft status and can be modified'
        }
      });
    });
  });

  describe('validateBulkOperation', () => {
    test('should validate bulk update operations successfully', async () => {
      mockGetRecordById
        .mockResolvedValueOnce(mockDraftRecord)
        .mockResolvedValueOnce(mockDraftRecord)
        .mockResolvedValueOnce(mockDraftRecord);
      
      const recordIds = [1, 2, 3];
      const result = await recordImmutabilityService.validateBulkOperation(recordIds, mockGetRecordById, 'update', 'Invoice');
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.summary).toEqual({
        total: 3,
        allowed: 3,
        blocked: 0
      });
      
      result.results.forEach((res, index) => {
        expect(res.recordId).toBe(recordIds[index]);
        expect(res.canUpdate).toBe(true);
      });
    });

    test('should validate bulk delete operations with mixed results', async () => {
      mockGetRecordById
        .mockResolvedValueOnce(mockDraftRecord)
        .mockResolvedValueOnce(mockPostedRecord)
        .mockResolvedValueOnce(mockDraftRecord);
      
      const recordIds = [1, 2, 3];
      const result = await recordImmutabilityService.validateBulkOperation(recordIds, mockGetRecordById, 'delete', 'Invoice');
      
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(3);
      expect(result.summary).toEqual({
        total: 3,
        allowed: 2,
        blocked: 1
      });
      
      expect(result.results[0].canDelete).toBe(true);
      expect(result.results[1].canDelete).toBe(false);
      expect(result.results[2].canDelete).toBe(true);
    });

    test('should handle empty record IDs array', async () => {
      const result = await recordImmutabilityService.validateBulkOperation([], mockGetRecordById, 'update', 'Invoice');
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.summary).toEqual({
        total: 0,
        allowed: 0,
        blocked: 0
      });
    });

    test('should handle database errors in bulk operations', async () => {
      mockGetRecordById
        .mockResolvedValueOnce(mockDraftRecord)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockPostedRecord);
      
      const recordIds = [1, 2, 3];
      const result = await recordImmutabilityService.validateBulkOperation(recordIds, mockGetRecordById, 'update', 'Invoice');
      
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(3);
      expect(result.summary.blocked).toBe(2); // One error, one posted
      expect(result.summary.allowed).toBe(1); // One draft
    });
  });

  describe('validateOperationMiddleware', () => {
    test('should pass validation for draft record update', async () => {
      mockGetRecordById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'update', 'Invoice');
      
      expect(result.canUpdate).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    test('should pass validation for draft record deletion', async () => {
      mockGetRecordById.mockResolvedValue(mockDraftRecord);
      
      const result = await recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'delete', 'Invoice');
      
      expect(result.canDelete).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    test('should throw error for posted record update', async () => {
      mockGetRecordById.mockResolvedValue(mockPostedRecord);
      
      await expect(
        recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'update', 'Invoice')
      ).rejects.toEqual({
        statusCode: 403,
        message: 'Posted records cannot be modified',
        type: 'IMMUTABILITY_VIOLATION'
      });
    });

    test('should throw error for posted record deletion', async () => {
      mockGetRecordById.mockResolvedValue(mockPostedRecord);
      
      await expect(
        recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'delete', 'Invoice')
      ).rejects.toEqual({
        statusCode: 403,
        message: 'Posted records cannot be modified',
        type: 'IMMUTABILITY_VIOLATION'
      });
    });

    test('should throw error for non-existent record', async () => {
      mockGetRecordById.mockResolvedValue(null);
      
      await expect(
        recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'update', 'Invoice')
      ).rejects.toEqual({
        statusCode: 404,
        message: 'Invoice not found',
        type: 'IMMUTABILITY_VIOLATION'
      });
    });

    test('should throw error for database failure', async () => {
      mockGetRecordById.mockRejectedValue(new Error('Database error'));
      
      await expect(
        recordImmutabilityService.validateOperationMiddleware(1, mockGetRecordById, 'update', 'Invoice')
      ).rejects.toEqual({
        statusCode: 500,
        message: 'Failed to retrieve invoice for validation',
        type: 'IMMUTABILITY_VIOLATION'
      });
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete workflow for invoice operations', async () => {
      // Test draft invoice - all operations allowed
      const draftInvoice = { id: 1, status: 'draft', amount: 100 };
      const allowedOps = recordImmutabilityService.getAllowedOperations(draftInvoice);
      
      expect(allowedOps.canUpdate).toBe(true);
      expect(allowedOps.canDelete).toBe(true);
      expect(allowedOps.canPost).toBe(true);
      
      // Test posted invoice - only read allowed
      const postedInvoice = { id: 2, status: 'posted', amount: 200 };
      const restrictedOps = recordImmutabilityService.getAllowedOperations(postedInvoice);
      
      expect(restrictedOps.canUpdate).toBe(false);
      expect(restrictedOps.canDelete).toBe(false);
      expect(restrictedOps.canPost).toBe(false);
      expect(restrictedOps.canRead).toBe(true);
    });

    test('should provide consistent error messages across all record types', () => {
      const invoiceError = recordImmutabilityService.createImmutabilityError('Invoice', 'update');
      const purchaseError = recordImmutabilityService.createImmutabilityError('Purchase bill', 'delete');
      const expenseError = recordImmutabilityService.createImmutabilityError('Production expense', 'update');
      
      expect(invoiceError.error).toBe('Posted records cannot be modified');
      expect(purchaseError.error).toBe('Posted records cannot be modified');
      expect(expenseError.error).toBe('Posted records cannot be modified');
      
      expect(invoiceError.statusCode).toBe(403);
      expect(purchaseError.statusCode).toBe(403);
      expect(expenseError.statusCode).toBe(403);
    });

    test('should handle status checking utilities correctly', () => {
      const draftRecord = { status: 'draft' };
      const postedRecord = { status: 'posted' };
      const unknownRecord = { status: 'cancelled' };
      
      expect(recordImmutabilityService.isRecordDraft(draftRecord)).toBe(true);
      expect(recordImmutabilityService.isRecordDraft(postedRecord)).toBe(false);
      expect(recordImmutabilityService.isRecordDraft(unknownRecord)).toBe(false);
      
      expect(recordImmutabilityService.isRecordPosted(draftRecord)).toBe(false);
      expect(recordImmutabilityService.isRecordPosted(postedRecord)).toBe(true);
      expect(recordImmutabilityService.isRecordPosted(unknownRecord)).toBe(false);
    });
  });
});