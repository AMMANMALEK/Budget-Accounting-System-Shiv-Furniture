const { 
  validateOperation, 
  canAccessEndpoint, 
  getAllowedOperations, 
  getWriteRestrictedResources 
} = require('../utils/roleValidator');

describe('Role Validator', () => {
  describe('validateOperation', () => {
    test('returns not allowed when user is not authenticated', () => {
      const result = validateOperation(null, 'read', 'budget');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not authenticated');
    });

    test('allows admin to perform any operation', () => {
      const adminContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const readResult = validateOperation(adminContext, 'read', 'budget');
      const writeResult = validateOperation(adminContext, 'write', 'invoice');
      const adminResult = validateOperation(adminContext, 'admin', 'user');
      
      expect(readResult.allowed).toBe(true);
      expect(readResult.reason).toBe('Admin has full access');
      expect(writeResult.allowed).toBe(true);
      expect(adminResult.allowed).toBe(true);
    });

    test('allows portal users to read data', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = validateOperation(portalContext, 'read', 'budget');
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Portal user can read data');
    });

    test('denies portal users from writing business data', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const budgetResult = validateOperation(portalContext, 'write', 'budget');
      const invoiceResult = validateOperation(portalContext, 'write', 'invoice');
      const costCenterResult = validateOperation(portalContext, 'write', 'costcenter');
      
      expect(budgetResult.allowed).toBe(false);
      expect(budgetResult.reason).toBe('Portal users cannot modify business or financial data');
      expect(invoiceResult.allowed).toBe(false);
      expect(costCenterResult.allowed).toBe(false);
    });

    test('denies portal users from admin operations', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = validateOperation(portalContext, 'admin', 'user');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Portal users cannot perform admin operations');
    });

    test('denies unknown operations', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = validateOperation(portalContext, 'unknown', 'budget');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Operation not allowed for user role');
    });
  });

  describe('canAccessEndpoint', () => {
    test('allows everyone to access public endpoints', () => {
      const result1 = canAccessEndpoint(null, 'public');
      const result2 = canAccessEndpoint({ role: 'portal' }, 'public');
      const result3 = canAccessEndpoint({ role: 'admin' }, 'public');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    test('allows portal and admin users to access portal endpoints', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      const adminContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const portalResult = canAccessEndpoint(portalContext, 'portal');
      const adminResult = canAccessEndpoint(adminContext, 'portal');
      
      expect(portalResult).toBe(true);
      expect(adminResult).toBe(true);
    });

    test('denies unauthenticated users from portal endpoints', () => {
      const result = canAccessEndpoint(null, 'portal');
      
      expect(result).toBe(false);
    });

    test('allows only admin users to access admin endpoints', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      const adminContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const portalResult = canAccessEndpoint(portalContext, 'admin');
      const adminResult = canAccessEndpoint(adminContext, 'admin');
      
      expect(portalResult).toBe(false);
      expect(adminResult).toBe(true);
    });

    test('denies access to unknown endpoint types', () => {
      const adminContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const result = canAccessEndpoint(adminContext, 'unknown');
      
      expect(result).toBe(false);
    });
  });

  describe('getAllowedOperations', () => {
    test('returns all operations for admin role', () => {
      const result = getAllowedOperations('admin');
      
      expect(result).toEqual(['read', 'write', 'admin']);
    });

    test('returns only read operation for portal role', () => {
      const result = getAllowedOperations('portal');
      
      expect(result).toEqual(['read']);
    });

    test('returns empty array for unknown role', () => {
      const result = getAllowedOperations('unknown');
      
      expect(result).toEqual([]);
    });
  });

  describe('getWriteRestrictedResources', () => {
    test('returns no restrictions for admin role', () => {
      const result = getWriteRestrictedResources('admin');
      
      expect(result).toEqual([]);
    });

    test('returns business data restrictions for portal role', () => {
      const result = getWriteRestrictedResources('portal');
      
      expect(result).toEqual(['budget', 'invoice', 'costcenter']);
    });

    test('returns all restrictions for unknown role', () => {
      const result = getWriteRestrictedResources('unknown');
      
      expect(result).toEqual(['budget', 'invoice', 'costcenter', 'user']);
    });
  });
});