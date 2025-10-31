import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus } from '../../hooks/useRedux';
import { isTokenExpired, handleTokenExpiration } from '../../utils/auth';
import { type FC, type ReactNode, useEffect } from 'react';
import { UserRole } from '../../types';
import { MainLayout } from '../../layouts/MainLayout';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface PrivateRouteProps {
  children?: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Component for protected routes that require authentication
 * Uses Redux for auth state management
 */
export const PrivateRoute: FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.warn('Token is expired in PrivateRoute, redirecting to login');
    handleTokenExpiration(location.pathname);
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && user?.role !== requiredRole) {
    console.warn(`User role ${user?.role} does not match required role ${requiredRole}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Get normalized user role for consistent comparison
  const userRoleStr = String(user?.role || '').toLowerCase();
  
  // Check if a specific role is required and user doesn't have it
  if (requiredRole) {
    const requiredRoleStr = String(requiredRole).toLowerCase();
    
    console.log('Role check:', { 
      userRole: userRoleStr, 
      requiredRole: requiredRoleStr 
    });
    
    // Check if user has the required role with case-insensitive comparison
    if (userRoleStr !== requiredRoleStr) {
      // Allow admin to access teacher routes
      if (userRoleStr === 'admin' && requiredRoleStr === 'teacher') {
        console.log('Admin accessing teacher route - allowed');
        // Admin can access teacher routes - do nothing and continue
      } else {
        console.log('Role mismatch, redirecting to dashboard', { userRoleStr, requiredRoleStr });
        // For other role mismatches, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Student access restrictions - only allow course/assignment/material related routes
  if (userRoleStr === 'student') {
    const allowedStudentPaths = [
      '/courses',         // Course listings and details
      '/student',         // Student-specific views (like student course view)
      '/student-courses', // Student course views including detailed course view
      '/assignments',     // Assignment submissions
      '/submissions',     // Omat palautukset
      '/materials',       // Course materials
      '/material',        // Single material view
      '/dashboard',       // Student dashboard
      '/profile',         // User profile
      '/settings',        // User settings
      '/notifications'    // Notifications page
    ].map(path => path.toLowerCase());

    // Enhanced path check with specific logging
    const currentPath = location.pathname.toLowerCase();
    console.log('Path validation for student:', {
      currentPath,
      allowedPaths: allowedStudentPaths
    });
    
    // Check if current path starts with any allowed path (including nested routes)
    const isAllowed = allowedStudentPaths.some(path => currentPath.startsWith(path));

    console.log('Path allowed:', isAllowed);

    // Block access to admin/teacher routes like /groups, /users, etc.
    if (!isAllowed) {
      console.log('Student accessing restricted path, redirecting to dashboard', location.pathname);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Teacher access restrictions
  if (userRoleStr === 'teacher') {
    // Block access to pages that require admin role or student-only pages
    const teacherRestrictedPaths: string[] = [
      // Add routes that should be restricted for teachers
      '/submissions' // Omat palautukset - only for students
    ];
    
    const isRestrictedPage = teacherRestrictedPaths.some(path => 
      location.pathname.toLowerCase().startsWith(path.toLowerCase())
    );
    
    if (isRestrictedPage) {
      console.log('Teacher accessing restricted path, redirecting to dashboard', location.pathname);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Admin access restrictions
  if (userRoleStr === 'admin') {
    // Block access to student-only pages
    const adminRestrictedPaths: string[] = [
      '/submissions' // Omat palautukset - only for students
    ];
    
    const isRestrictedPage = adminRestrictedPaths.some(path => 
      location.pathname.toLowerCase().startsWith(path.toLowerCase())
    );
    
    if (isRestrictedPage) {
      console.log('Admin accessing restricted path, redirecting to dashboard', location.pathname);
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('Access granted to path:', location.pathname);

  // If children are provided, render them
  if (children) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Otherwise, render the appropriate layout based on user role
  return <ErrorBoundary><MainLayout /></ErrorBoundary>;
};
