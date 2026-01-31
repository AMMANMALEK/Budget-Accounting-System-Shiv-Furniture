const { 
  requireAuth, 
  requireAdmin, 
  requirePortalAccess, 
  requireBusinessDataAccess, 
  attachUserContext 
} = require('../middleware/authMiddleware');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    test('calls next when user is authenticated', () => {
      req.user = { id: '123', email: 'test@example.com', role: 'admin' };
      
      requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'admin'
      });
    });

    test('returns 401 when user is not authenticated', () => {
      requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when user context is incomplete', () => {
      req.user = { email: 'test@example.com' }; // missing id and role
      
      requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    test('calls next when user is admin', () => {
      req.user = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      requireAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'admin@example.com',
        role: 'admin'
      });
    });

    test('returns 403 when user is portal', () => {
      req.user = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user is not authenticated', () => {
      requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requirePortalAccess', () => {
    test('calls next when user is admin', () => {
      req.user = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      requirePortalAccess(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'admin@example.com',
        role: 'admin'
      });
    });

    test('calls next when user is portal', () => {
      req.user = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      requirePortalAccess(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'portal@example.com',
        role: 'portal'
      });
    });

    test('returns 403 when user has invalid role', () => {
      req.user = { id: '123', email: 'user@example.com', role: 'invalid' };
      
      requirePortalAccess(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Portal access required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user is not authenticated', () => {
      requirePortalAccess(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Portal access required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireBusinessDataAccess', () => {
    test('calls next when user is admin', () => {
      req.user = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      requireBusinessDataAccess(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'admin@example.com',
        role: 'admin'
      });
    });

    test('returns 403 when user is portal', () => {
      req.user = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      requireBusinessDataAccess(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions to modify business data'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user is not authenticated', () => {
      requireBusinessDataAccess(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions to modify business data'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('attachUserContext', () => {
    test('attaches user context when user exists', () => {
      req.user = { id: '123', email: 'test@example.com', role: 'admin' };
      
      attachUserContext(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'admin'
      });
    });

    test('attaches null context when user does not exist', () => {
      attachUserContext(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.userContext).toBeNull();
    });
  });
});