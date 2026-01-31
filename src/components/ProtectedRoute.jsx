import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can replace this with a proper loading spinner component
    return <div>Loading...</div>; 
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access unauthorized area
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'client') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    // Fallback
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
