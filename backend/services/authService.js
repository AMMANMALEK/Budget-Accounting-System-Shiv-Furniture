class AuthService {
  // Returns success/error object after validating email/password against database
  async authenticateUser(email, password, getUserByCredentials) {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    try {
      // Get user from database (assuming this function exists)
      const user = await getUserByCredentials(email, password);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Return user identity and role on successful authentication
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  // Extracts user object from req.user, returns null if not found
  extractUserContext(req) {
    // Assume user context is attached to request by middleware
    if (req.user) {
      return {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      };
    }
    return null;
  }

  // Returns true if user's role matches the required role
  hasRole(userContext, requiredRole) {
    if (!userContext || !userContext.role) {
      return false;
    }
    return userContext.role === requiredRole;
  }

  // Returns true only if user has admin role
  canAccessAdmin(userContext) {
    return this.hasRole(userContext, 'admin');
  }

  // Returns true if user has portal or admin role
  canAccessPortal(userContext) {
    return this.hasRole(userContext, 'portal') || this.hasRole(userContext, 'admin');
  }

  // Returns true only for admin users - portal users cannot modify business data
  canModifyBusinessData(userContext) {
    // Only admin users can modify business or financial data
    return this.hasRole(userContext, 'admin');
  }

  // Returns true if user has valid id and role properties
  isAuthenticated(userContext) {
    return !!(userContext && userContext.id && userContext.role);
  }
}

module.exports = new AuthService();