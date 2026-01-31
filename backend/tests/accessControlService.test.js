const accessControlService = require('../services/accessControlService');

describe('AccessControlService', () => {
  // Mock user contexts
  const mockAdminUser = { id: 1, email: 'admin@test.com', role: 'admin' };
  const mockPortalUser = { id: 2, email: 'portal@test.com', role: 'portal' };
  const mockInvalidUser = { id: 3, email: 'invalid@test.com', role: 'invalid' };
  const mockUnauthenticatedUser = null;

  describe('validateAccess', () => {
    test('should allow admin full access to all operations', () => {
      const operations = ['read', 'create', 'update', 'delete', 'post', 'admin'];
      const resources = ['costcenter', 'budget', 'invoice', 'product'];

      operations.forEach(operation => {
        resources.forEach(resource => {
          const result = accessControlService.validateAccess(mockAdminUser, operation, resource);
          expect(result.allowed).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toContain('Admin access granted');
        });
      });
    });

    test('should allow portal users read access only', () => {
      const readOperations = ['read', 'view', 'list'];
      const resources = ['costcenter', 'budget', 'invoice', 'product'];

      readOperations.forEach(operation => {
        resources.forEach(resource => {
          const result = accessControlService.validateAccess(mockPortalUser, operation, resource);
          expect(result.allowed).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toContain('Portal user can');
        });
      });
    });

    test('should deny portal users write access to business data', () => {
      const writeOperations = ['create', 'update', 'delete', 'post'];
      const businessResources = ['costcenter', 'budget', 'invoice', 'purchasebill', 'productionexpense'];

      writeOperations.forEach(operation => {
        businessResources.forEach(resource => {
          const result = accessControlService.validateAccess(mockPortalUser, operation, resource);
          expect(result.allowed).toBe(false);
          expect(result.statusCode).toBe(403);
          expect(result.error).toBe('Portal users cannot modify business data');
        });
      });
    });

    test('should deny portal users admin operations', () => {
      const adminOperations = ['admin', 'configure'];
      
      adminOperations.forEach(operation => {
        const result = accessControlService.validateAccess(mockPortalUser, operation, 'system');
        expect(result.allowed).toBe(false);
        expect(result.statusCode).toBe(403);
        expect(result.error).toBe('Portal users cannot perform admin operations');
      });
    });

    test('should deny access for unauthenticated users', () => {
      const result = accessControlService.validateAccess(mockUnauthenticatedUser, 'read', 'invoice');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toBe('Authentication required');
    });

    test('should deny access for invalid roles', () => {
      const result = accessControlService.validateAccess(mockInvalidUser, 'read', 'invoice');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error).toBe('Invalid user role');
    });
  });

  describe('Resource-specific validation methods', () => {
    test('should validate cost center access correctly', () => {
      expect(accessControlService.validateCostCenterAccess(mockAdminUser, 'create').allowed).toBe(true);
      expect(accessControlService.validateCostCenterAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateCostCenterAccess(mockPortalUser, 'create').allowed).toBe(false);
    });

    test('should validate budget access correctly', () => {
      expect(accessControlService.validateBudgetAccess(mockAdminUser, 'update').allowed).toBe(true);
      expect(accessControlService.validateBudgetAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateBudgetAccess(mockPortalUser, 'update').allowed).toBe(false);
    });

    test('should validate invoice access correctly', () => {
      expect(accessControlService.validateInvoiceAccess(mockAdminUser, 'post').allowed).toBe(true);
      expect(accessControlService.validateInvoiceAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateInvoiceAccess(mockPortalUser, 'post').allowed).toBe(false);
    });

    test('should validate purchase bill access correctly', () => {
      expect(accessControlService.validatePurchaseBillAccess(mockAdminUser, 'delete').allowed).toBe(true);
      expect(accessControlService.validatePurchaseBillAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validatePurchaseBillAccess(mockPortalUser, 'delete').allowed).toBe(false);
    });

    test('should validate production expense access correctly', () => {
      expect(accessControlService.validateProductionExpenseAccess(mockAdminUser, 'create').allowed).toBe(true);
      expect(accessControlService.validateProductionExpenseAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateProductionExpenseAccess(mockPortalUser, 'create').allowed).toBe(false);
    });

    test('should validate product access correctly', () => {
      expect(accessControlService.validateProductAccess(mockAdminUser, 'update').allowed).toBe(true);
      expect(accessControlService.validateProductAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateProductAccess(mockPortalUser, 'update').allowed).toBe(false);
    });

    test('should validate contact access correctly', () => {
      expect(accessControlService.validateContactAccess(mockAdminUser, 'delete').allowed).toBe(true);
      expect(accessControlService.validateContactAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateContactAccess(mockPortalUser, 'delete').allowed).toBe(false);
    });

    test('should validate analytics access correctly', () => {
      expect(accessControlService.validateAnalyticsAccess(mockAdminUser, 'create').allowed).toBe(true);
      expect(accessControlService.validateAnalyticsAccess(mockPortalUser, 'read').allowed).toBe(true);
      expect(accessControlService.validateAnalyticsAccess(mockPortalUser, 'create').allowed).toBe(false);
    });

    test('should validate dashboard access correctly', () => {
      expect(accessControlService.validateDashboardAccess(mockAdminUser).allowed).toBe(true);
      expect(accessControlService.validateDashboardAccess(mockPortalUser).allowed).toBe(true);
      expect(accessControlService.validateDashboardAccess(mockPortalUser, 'admin').allowed).toBe(false);
    });

    test('should validate report access correctly', () => {
      expect(accessControlService.validateReportAccess(mockAdminUser).allowed).toBe(true);
      expect(accessControlService.validateReportAccess(mockPortalUser).allowed).toBe(true);
      expect(accessControlService.validateReportAccess(mockPortalUser, 'admin').allowed).toBe(false);
    });
  });

  describe('Permission check methods', () => {
    test('should check create permissions correctly', () => {
      expect(accessControlService.canCreate(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canCreate(mockPortalUser, 'invoice')).toBe(false);
    });

    test('should check update permissions correctly', () => {
      expect(accessControlService.canUpdate(mockAdminUser, 'budget')).toBe(true);
      expect(accessControlService.canUpdate(mockPortalUser, 'budget')).toBe(false);
    });

    test('should check delete permissions correctly', () => {
      expect(accessControlService.canDelete(mockAdminUser, 'costcenter')).toBe(true);
      expect(accessControlService.canDelete(mockPortalUser, 'costcenter')).toBe(false);
    });

    test('should check post permissions correctly', () => {
      expect(accessControlService.canPost(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canPost(mockPortalUser, 'invoice')).toBe(false);
    });

    test('should check read permissions correctly', () => {
      expect(accessControlService.canRead(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canRead(mockPortalUser, 'invoice')).toBe(true);
    });
  });

  describe('getResourcePermissions', () => {
    test('should return full permissions for admin users', () => {
      const permissions = accessControlService.getResourcePermissions(mockAdminUser, 'invoice');
      
      expect(permissions).toEqual({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canPost: true
      });
    });

    test('should return read-only permissions for portal users', () => {
      const permissions = accessControlService.getResourcePermissions(mockPortalUser, 'invoice');
      
      expect(permissions).toEqual({
        canRead: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canPost: false
      });
    });
  });

  describe('validateBulkOperation', () => {
    test('should allow bulk operations for admin users', () => {
      const result = accessControlService.validateBulkOperation(mockAdminUser, 'delete', 'invoice', 5);
      
      expect(result.allowed).toBe(true);
      expect(result.details.recordCount).toBe(5);
      expect(result.details.reason).toBe('Bulk operation allowed');
    });

    test('should deny bulk operations for portal users', () => {
      const result = accessControlService.validateBulkOperation(mockPortalUser, 'delete', 'invoice', 5);
      
      expect(result.allowed).toBe(false);
      expect(result.details.recordCount).toBe(5);
      expect(result.details.reason).toBe('Access denied for bulk operation');
    });
  });

  describe('enforceAccess', () => {
    test('should pass for allowed operations', () => {
      expect(() => {
        accessControlService.enforceAccess(mockAdminUser, 'create', 'invoice');
      }).not.toThrow();
    });

    test('should throw error for denied operations', () => {
      expect(() => {
        accessControlService.enforceAccess(mockPortalUser, 'create', 'invoice');
      }).toThrow();
      
      try {
        accessControlService.enforceAccess(mockPortalUser, 'create', 'invoice');
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.type).toBe('ACCESS_DENIED');
        expect(error.details.operation).toBe('create');
        expect(error.details.resourceType).toBe('invoice');
        expect(error.details.userRole).toBe('portal');
      }
    });
  });

  describe('Response creation methods', () => {
    test('should create access denied response correctly', () => {
      const response = accessControlService.createAccessDeniedResponse('create', 'invoice', 'portal');
      
      expect(response).toEqual({
        success: false,
        statusCode: 403,
        error: 'Access denied',
        details: {
          operation: 'create',
          resourceType: 'invoice',
          userRole: 'portal',
          reason: 'Insufficient permissions for requested operation'
        }
      });
    });

    test('should create access granted response correctly', () => {
      const response = accessControlService.createAccessGrantedResponse('read', 'invoice', 'admin');
      
      expect(response).toEqual({
        success: true,
        statusCode: 200,
        message: 'Access granted',
        details: {
          operation: 'read',
          resourceType: 'invoice',
          userRole: 'admin',
          reason: 'User has sufficient permissions'
        }
      });
    });
  });

  describe('Access requirement methods', () => {
    test('should validate admin access requirement', () => {
      const adminResult = accessControlService.requireAdminAccess(mockAdminUser);
      expect(adminResult.allowed).toBe(true);
      expect(adminResult.statusCode).toBe(200);

      const portalResult = accessControlService.requireAdminAccess(mockPortalUser);
      expect(portalResult.allowed).toBe(false);
      expect(portalResult.statusCode).toBe(403);
      expect(portalResult.error).toBe('Admin access required');
    });

    test('should validate portal access requirement', () => {
      const adminResult = accessControlService.requirePortalAccess(mockAdminUser);
      expect(adminResult.allowed).toBe(true);

      const portalResult = accessControlService.requirePortalAccess(mockPortalUser);
      expect(portalResult.allowed).toBe(true);

      const unauthResult = accessControlService.requirePortalAccess(mockUnauthenticatedUser);
      expect(unauthResult.allowed).toBe(false);
      expect(unauthResult.error).toBe('Portal access required');
    });

    test('should validate business data access requirement', () => {
      const adminResult = accessControlService.requireBusinessDataAccess(mockAdminUser);
      expect(adminResult.allowed).toBe(true);

      const portalResult = accessControlService.requireBusinessDataAccess(mockPortalUser);
      expect(portalResult.allowed).toBe(false);
      expect(portalResult.error).toBe('Insufficient permissions to modify business data');
    });
  });

  describe('getUserPermissionsSummary', () => {
    test('should return complete permissions summary for admin user', () => {
      const summary = accessControlService.getUserPermissionsSummary(mockAdminUser);
      
      expect(summary).toEqual({
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

    test('should return limited permissions summary for portal user', () => {
      const summary = accessControlService.getUserPermissionsSummary(mockPortalUser);
      
      expect(summary).toEqual({
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

    test('should return no permissions for unauthenticated user', () => {
      const summary = accessControlService.getUserPermissionsSummary(mockUnauthenticatedUser);
      
      expect(summary).toEqual({
        authenticated: false,
        role: null,
        permissions: {
          canAccessAdmin: false,
          canAccessPortal: false,
          canModifyBusinessData: false,
          allowedOperations: []
        }
      });
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete workflow for admin user', () => {
      // Admin can perform all operations
      expect(accessControlService.canCreate(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canUpdate(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canPost(mockAdminUser, 'invoice')).toBe(true);
      expect(accessControlService.canDelete(mockAdminUser, 'invoice')).toBe(true);
      
      // Admin can access all areas
      expect(accessControlService.requireAdminAccess(mockAdminUser).allowed).toBe(true);
      expect(accessControlService.requireBusinessDataAccess(mockAdminUser).allowed).toBe(true);
    });

    test('should handle complete workflow for portal user', () => {
      // Portal user can only read
      expect(accessControlService.canRead(mockPortalUser, 'invoice')).toBe(true);
      expect(accessControlService.canCreate(mockPortalUser, 'invoice')).toBe(false);
      expect(accessControlService.canUpdate(mockPortalUser, 'invoice')).toBe(false);
      expect(accessControlService.canPost(mockPortalUser, 'invoice')).toBe(false);
      expect(accessControlService.canDelete(mockPortalUser, 'invoice')).toBe(false);
      
      // Portal user has limited access
      expect(accessControlService.requirePortalAccess(mockPortalUser).allowed).toBe(true);
      expect(accessControlService.requireAdminAccess(mockPortalUser).allowed).toBe(false);
      expect(accessControlService.requireBusinessDataAccess(mockPortalUser).allowed).toBe(false);
    });

    test('should provide consistent error responses across all business resources', () => {
      const businessResources = ['costcenter', 'budget', 'invoice', 'purchasebill', 'productionexpense'];
      const writeOperations = ['create', 'update', 'delete', 'post'];
      
      businessResources.forEach(resource => {
        writeOperations.forEach(operation => {
          const result = accessControlService.validateAccess(mockPortalUser, operation, resource);
          expect(result.allowed).toBe(false);
          expect(result.statusCode).toBe(403);
          expect(result.error).toBe('Portal users cannot modify business data');
        });
      });
    });
  });
});