const accessControlMiddleware = require('../middleware/accessControlMiddleware');

describe('AccessControlMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      method: 'GET',
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  // Mock user contexts
  const mockAdminUser = { id: 1, email: 'admin@test.com', role: 'admin' };
  const mockPortalUser = { id: 2, email: 'portal@test.com', role: 'portal' };

  describe('createResourceAccessMiddleware', () => {
    test('should allow admin users to access any resource', () => {
      req.user = mockAdminUser;
      
      const middleware = accessControlMiddleware.createResourceAccessMiddleware('invoice', 'create');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.userContext).toEqual(mockAdminUser);
    });

    test('should deny portal users write access to business resources', () => {
      req.user = mockPortalUser;
      
      const middleware = accessControlMiddleware.createResourceAccessMiddleware('invoice', 'create');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Portal users cannot modify business data',
          type: 'ACCESS_DENIED'
        })
      );
    });

    test('should allow portal users read access', () => {
      req.user = mockPortalUser;
      
      const middleware = accessControlMiddleware.createResourceAccessMiddleware('invoice', 'read');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.userContext).toEqual(mockPortalUser);
    });
  });

  describe('Specific resource middleware', () => {
    test('requireInvoiceWrite should work correctly', () => {
      req.user = mockAdminUser;
      
      accessControlMiddleware.requireInvoiceWrite(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual(mockAdminUser);
    });

    test('requireBudgetWrite should deny portal users', () => {
      req.user = mockPortalUser;
      
      accessControlMiddleware.requireBudgetWrite(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('requireCostCenterWrite should work for admin', () => {
      req.user = mockAdminUser;
      
      accessControlMiddleware.requireCostCenterWrite(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireBusinessDataAccess', () => {
    test('should allow admin users', () => {
      req.user = mockAdminUser;
      
      accessControlMiddleware.requireBusinessDataAccess(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual(mockAdminUser);
    });

    test('should deny portal users', () => {
      req.user = mockPortalUser;
      
      accessControlMiddleware.requireBusinessDataAccess(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions to modify business data'
      });
    });
  });

  describe('attachUserPermissions', () => {
    test('should attach admin permissions correctly', () => {
      req.user = mockAdminUser;
      
      accessControlMiddleware.attachUserPermissions(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userPermissions).toEqual({
        authenticated: true,
        role: 'admin',
        permissions: {
          canAccessAdmin: true,
          canAccessPortal: true,
          canModifyBusinessData: true,
          allowedOperations: ['read', 'create', 'update', 'delete', 'post', 'admin']
        }
      });
    });

    test('should attach portal permissions correctly', () => {
      req.user = mockPortalUser;
      
      accessControlMiddleware.attachUserPermissions(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userPermissions).toEqual({
        authenticated: true,
        role: 'portal',
        permissions: {
          canAccessAdmin: false,
          canAccessPortal: true,
          canModifyBusinessData: false,
          allowedOperations: ['read']
        }
      });
    });
  });

  describe('requireBulkOperationAccess', () => {
    test('should allow admin bulk operations', () => {
      req.user = mockAdminUser;
      req.body = { ids: [1, 2, 3, 4, 5] };
      
      const middleware = accessControlMiddleware.requireBulkOperationAccess('invoice', 'delete');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual(mockAdminUser);
    });

    test('should deny portal bulk operations', () => {
      req.user = mockPortalUser;
      req.body = { ids: [1, 2, 3] };
      
      const middleware = accessControlMiddleware.requireBulkOperationAccess('invoice', 'delete');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Portal users cannot modify business data',
          details: expect.objectContaining({
            recordCount: 3,
            operation: 'delete',
            resourceType: 'invoice'
          })
        })
      );
    });

    test('should handle missing record count gracefully', () => {
      req.user = mockAdminUser;
      req.body = {};
      
      const middleware = accessControlMiddleware.requireBulkOperationAccess('invoice', 'update');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ensureReadOnlyForPortal', () => {
    test('should allow admin users all HTTP methods', () => {
      req.user = mockAdminUser;
      req.method = 'POST';
      
      accessControlMiddleware.ensureReadOnlyForPortal(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow portal users GET requests', () => {
      req.user = mockPortalUser;
      req.method = 'GET';
      
      accessControlMiddleware.ensureReadOnlyForPortal(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny portal users POST requests', () => {
      req.user = mockPortalUser;
      req.method = 'POST';
      
      accessControlMiddleware.ensureReadOnlyForPortal(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Portal users have read-only access',
        details: {
          userRole: 'portal',
          requestMethod: 'POST',
          reason: 'Portal users cannot perform write operations'
        }
      });
    });

    test('should deny portal users PUT requests', () => {
      req.user = mockPortalUser;
      req.method = 'PUT';
      
      accessControlMiddleware.ensureReadOnlyForPortal(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should deny portal users DELETE requests', () => {
      req.user = mockPortalUser;
      req.method = 'DELETE';
      
      accessControlMiddleware.ensureReadOnlyForPortal(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('logAccessAttempt', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log access attempts for authenticated users', () => {
      req.user = mockAdminUser;
      
      const middleware = accessControlMiddleware.logAccessAttempt('invoice', 'create');
      middleware(req, res, next);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Access attempt: admin@test.com (admin) attempting create on invoice'
      );
      expect(next).toHaveBeenCalled();
    });

    test('should log access attempts for anonymous users', () => {
      req.user = null;
      
      const middleware = accessControlMiddleware.logAccessAttempt('invoice', 'read');
      middleware(req, res, next);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Access attempt: anonymous (unknown) attempting read on invoice'
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireResourceAccess factory', () => {
    test('should create middleware for any resource and operation', () => {
      req.user = mockAdminUser;
      
      const customMiddleware = accessControlMiddleware.requireResourceAccess('customresource', 'customoperation');
      customMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual(mockAdminUser);
    });

    test('should deny unauthorized access for custom resources', () => {
      req.user = mockPortalUser;
      
      const customMiddleware = accessControlMiddleware.requireResourceAccess('budget', 'delete');
      customMiddleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete admin workflow', () => {
      req.user = mockAdminUser;
      
      // Test multiple middleware in sequence
      accessControlMiddleware.attachUserPermissions(req, res, next);
      expect(req.userPermissions.permissions.canModifyBusinessData).toBe(true);
      
      accessControlMiddleware.requireBusinessDataAccess(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      
      accessControlMiddleware.requireInvoiceWrite(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
    });

    test('should handle complete portal workflow', () => {
      req.user = mockPortalUser;
      
      // Portal user can attach permissions
      accessControlMiddleware.attachUserPermissions(req, res, next);
      expect(req.userPermissions.permissions.canModifyBusinessData).toBe(false);
      expect(next).toHaveBeenCalledTimes(1);
      
      // Portal user cannot access business data modification
      accessControlMiddleware.requireBusinessDataAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should enforce consistent access control across all business resources', () => {
      req.user = mockPortalUser;
      
      const businessMiddlewares = [
        accessControlMiddleware.requireCostCenterWrite,
        accessControlMiddleware.requireBudgetWrite,
        accessControlMiddleware.requireInvoiceWrite,
        accessControlMiddleware.requirePurchaseBillWrite,
        accessControlMiddleware.requireProductionExpenseWrite
      ];
      
      businessMiddlewares.forEach(middleware => {
        // Reset mocks
        res.status.mockClear();
        res.json.mockClear();
        next.mockClear();
        
        middleware(req, res, next);
        
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });
});