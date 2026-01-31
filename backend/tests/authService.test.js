const authService = require('../services/authService');

describe('AuthService', () => {
  describe('authenticateUser', () => {
    const mockGetUserByCredentials = jest.fn();

    beforeEach(() => {
      mockGetUserByCredentials.mockClear();
    });

    test('returns error when email is missing', async () => {
      const result = await authService.authenticateUser('', 'password', mockGetUserByCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
      expect(mockGetUserByCredentials).not.toHaveBeenCalled();
    });

    test('returns error when password is missing', async () => {
      const result = await authService.authenticateUser('test@example.com', '', mockGetUserByCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
      expect(mockGetUserByCredentials).not.toHaveBeenCalled();
    });

    test('returns error when credentials are invalid', async () => {
      mockGetUserByCredentials.mockResolvedValue(null);
      
      const result = await authService.authenticateUser('test@example.com', 'wrongpassword', mockGetUserByCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockGetUserByCredentials).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });

    test('returns user identity and role on successful authentication', async () => {
      const mockUser = {
        id: '123',
        email: 'admin@example.com',
        role: 'admin'
      };
      mockGetUserByCredentials.mockResolvedValue(mockUser);
      
      const result = await authService.authenticateUser('admin@example.com', 'password', mockGetUserByCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: '123',
        email: 'admin@example.com',
        role: 'admin'
      });
    });

    test('handles database errors gracefully', async () => {
      mockGetUserByCredentials.mockRejectedValue(new Error('Database error'));
      
      const result = await authService.authenticateUser('test@example.com', 'password', mockGetUserByCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });

  describe('extractUserContext', () => {
    test('returns user context when req.user exists', () => {
      const req = {
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'admin'
        }
      };
      
      const result = authService.extractUserContext(req);
      
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'admin'
      });
    });

    test('returns null when req.user does not exist', () => {
      const req = {};
      
      const result = authService.extractUserContext(req);
      
      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    test('returns true when user has required role', () => {
      const userContext = { id: '123', email: 'test@example.com', role: 'admin' };
      
      const result = authService.hasRole(userContext, 'admin');
      
      expect(result).toBe(true);
    });

    test('returns false when user has different role', () => {
      const userContext = { id: '123', email: 'test@example.com', role: 'portal' };
      
      const result = authService.hasRole(userContext, 'admin');
      
      expect(result).toBe(false);
    });

    test('returns false when userContext is null', () => {
      const result = authService.hasRole(null, 'admin');
      
      expect(result).toBe(false);
    });

    test('returns false when role is missing', () => {
      const userContext = { id: '123', email: 'test@example.com' };
      
      const result = authService.hasRole(userContext, 'admin');
      
      expect(result).toBe(false);
    });
  });

  describe('canAccessAdmin', () => {
    test('returns true for admin users', () => {
      const userContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const result = authService.canAccessAdmin(userContext);
      
      expect(result).toBe(true);
    });

    test('returns false for portal users', () => {
      const userContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = authService.canAccessAdmin(userContext);
      
      expect(result).toBe(false);
    });
  });

  describe('canAccessPortal', () => {
    test('returns true for admin users', () => {
      const userContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const result = authService.canAccessPortal(userContext);
      
      expect(result).toBe(true);
    });

    test('returns true for portal users', () => {
      const userContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = authService.canAccessPortal(userContext);
      
      expect(result).toBe(true);
    });

    test('returns false for invalid role', () => {
      const userContext = { id: '123', email: 'user@example.com', role: 'invalid' };
      
      const result = authService.canAccessPortal(userContext);
      
      expect(result).toBe(false);
    });
  });

  describe('canModifyBusinessData', () => {
    test('returns true only for admin users', () => {
      const adminContext = { id: '123', email: 'admin@example.com', role: 'admin' };
      
      const result = authService.canModifyBusinessData(adminContext);
      
      expect(result).toBe(true);
    });

    test('returns false for portal users', () => {
      const portalContext = { id: '123', email: 'portal@example.com', role: 'portal' };
      
      const result = authService.canModifyBusinessData(portalContext);
      
      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when user has id and role', () => {
      const userContext = { id: '123', email: 'test@example.com', role: 'admin' };
      
      const result = authService.isAuthenticated(userContext);
      
      expect(result).toBe(true);
    });

    test('returns false when id is missing', () => {
      const userContext = { email: 'test@example.com', role: 'admin' };
      
      const result = authService.isAuthenticated(userContext);
      
      expect(result).toBe(false);
    });

    test('returns false when role is missing', () => {
      const userContext = { id: '123', email: 'test@example.com' };
      
      const result = authService.isAuthenticated(userContext);
      
      expect(result).toBe(false);
    });

    test('returns false when userContext is null', () => {
      const result = authService.isAuthenticated(null);
      
      expect(result).toBe(false);
    });
  });
});