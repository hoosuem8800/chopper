import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Index from './pages/Index';
import ProfilePage from './pages/ProfilePage';
import AppointmentPage from './pages/AppointmentPage';
import AppointmentSuccessPage from './pages/AppointmentSuccessPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import NotFound from './pages/NotFound';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import PaymentPageWrapper from './pages/PaymentPageWrapper';
import WelcomePremiumPage from './pages/WelcomePremiumPage';
import AppDash from '@/pages/AppDash';
import DoctorDash from '@/pages/DoctorDash';
import ScanPage from '@/pages/ScanPage';
import ConsultationPage from '@/pages/ConsultationPage';
import ManagementPage from '@/pages/Admin/ManagementPage';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import NotificationsPage from '@/pages/NotificationsPage';
import TestPage from './pages/TestPage';
import AdminPage from './pages/AdminPage';

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Helper component to ensure background is refreshed on route changes
const RouteChangeHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Dispatch event to refresh background settings on all route changes
    window.dispatchEvent(new CustomEvent('background-settings-refresh'));
    window.dispatchEvent(new CustomEvent('routechange'));
    
    console.log('Route changed to:', location.pathname);
  }, [location]);
  
  return null;
};

// Protected Route component
const ProtectedRouteComponent = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const routeId = React.useRef(`route-${Math.random().toString(36).slice(2, 8)}`).current;
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log(`ProtectedRoute ${routeId} mounted - isAuthenticated: ${isAuthenticated}`);
    
    // Check authentication immediately when mounted
    if (!isAuthenticated) {
      console.log(`ProtectedRoute ${routeId} - Not authenticated, redirecting to login`);
      
      // Navigate directly to login without showing modal
      setTimeout(() => {
        console.log(`ProtectedRoute ${routeId} - Redirecting to login page`);
        navigate('/login');
      }, 10);
    }
    
    return () => {
      console.log(`ProtectedRoute ${routeId} unmounted`);
    };
  }, [routeId, isAuthenticated, navigate]);

  // Return null or children based on authentication
  return isAuthenticated ? <>{children}</> : null;
};

// Admin Route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const routeId = React.useRef(`admin-route-${Math.random().toString(36).slice(2, 8)}`).current;
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log(`AdminRoute ${routeId} mounted - isAuthenticated: ${isAuthenticated}`);
    
    // Handle not authenticated
    if (!isAuthenticated) {
      console.log(`AdminRoute ${routeId} - Not authenticated, redirecting to login`);
      
      // Navigate directly to login
      setTimeout(() => {
        console.log(`AdminRoute ${routeId} - Redirecting to login page`);
        navigate('/login');
      }, 10);
      return;
    }
    
    // Handle not admin
    if (user?.role !== 'admin') {
      console.log(`AdminRoute ${routeId} - Not admin, redirecting`);
      navigate('/');
    }
    
    return () => console.log(`AdminRoute ${routeId} unmounted`);
  }, [routeId, isAuthenticated, user, navigate]);

  // Return based on conditions
  return (isAuthenticated && user?.role === 'admin') ? <>{children}</> : null;
};

// Premium Route component
const PremiumRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const routeId = React.useRef(`premium-route-${Math.random().toString(36).slice(2, 8)}`).current;
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log(`PremiumRoute ${routeId} mounted - isAuthenticated: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      console.log(`PremiumRoute ${routeId} - Redirecting to login page`);
      navigate('/login');
      return;
    }
    
    if (user?.subscription_type !== 'premium') {
      navigate('/pricing');
    }
    
    return () => console.log(`PremiumRoute ${routeId} unmounted`);
  }, [routeId, isAuthenticated, user, navigate]);

  return (isAuthenticated && user?.subscription_type === 'premium') ? <>{children}</> : null;
};

// Admin and Assistant Route component
const AdminAssistantRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin' && user?.role !== 'assistant') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  return (isAuthenticated && (user?.role === 'admin' || user?.role === 'assistant')) ? <>{children}</> : null;
};

// Doctor Route component
const DoctorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'doctor') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  return (isAuthenticated && user?.role === 'doctor') ? <>{children}</> : null;
};

// ProtectedRoute with requireAdmin prop
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (requireAdmin && user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, requireAdmin, navigate]);

  return (isAuthenticated && (!requireAdmin || user?.role === 'admin')) ? <>{children}</> : null;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <RouteChangeHandler />
              <Index />
            </>
          }
        />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/login"
          element={
            <>
              <RouteChangeHandler />
              <LoginPage />
            </>
          }
        />
        <Route
          path="/welcome"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <WelcomePage />
            </ProtectedRouteComponent>
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/test" element={
          <AdminRoute>
            <TestPage />
          </AdminRoute>
        } />
        
        {/* Protected Routes */}
        <Route
          path="/payment"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <PaymentPageWrapper />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/welcome-premium"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <WelcomePremiumPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <ProfilePage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/appointment"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <AppointmentPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/appointment/success"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <AppointmentSuccessPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <ScanPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/consultation"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <ConsultationPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRouteComponent>
              <RouteChangeHandler />
              <NotificationsPage />
            </ProtectedRouteComponent>
          }
        />
        <Route
          path="/app-dash"
          element={
            <AdminAssistantRoute>
              <RouteChangeHandler />
              <AppDash />
            </AdminAssistantRoute>
          }
        />
        <Route
          path="/doctor-dash"
          element={
            <DoctorRoute>
              <RouteChangeHandler />
              <DoctorDash />
            </DoctorRoute>
          }
        />
        
        {/* Admin Management Routes */}
        <Route
          path="/admin/manage/:resource"
          element={
            <AdminRoute>
              <RouteChangeHandler />
              <ManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/manage"
          element={
            <AdminRoute>
              <RouteChangeHandler />
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <RouteChangeHandler />
              <AdminPage />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all route */}
        <Route
          path="*"
          element={
            <>
              <RouteChangeHandler />
              <NotFound />
            </>
          }
        />
      </Routes>
    </>
  );
};

export default AppRoutes; 