import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = localStorage.getItem('userType');

  // Check if authentication is required
  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific roles are required
  if (allowedRoles.length > 0) {
    const userRole = user.role || userType;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;