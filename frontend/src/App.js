import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './styles/theme';
import { AuthProvider, ROLES } from './store/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage          from './pages/auth/LoginPage';
import UnauthorizedPage   from './pages/auth/UnauthorizedPage';
import DashboardPage      from './pages/dashboard/DashboardPage';
import BookingsPage       from './pages/bookings/BookingsPage';
import BookingDetailPage  from './pages/bookings/BookingDetailPage';
import CustomersPage      from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import PackagesPage       from './pages/packages/PackagesPage';
import InvoicesPage       from './pages/invoices/InvoicesPage';
import CommissionsPage    from './pages/commissions/CommissionsPage';
import ReportsPage        from './pages/reports/ReportsPage';
import StaffPage          from './pages/staff/StaffPage';
import HRPage             from './pages/hr/HRPage';
import InvoiceDetailPage     from './pages/invoices/InvoiceDetailPage';
import CommissionDetailPage  from './pages/commissions/CommissionDetailPage';
import ChangePasswordPage    from './pages/auth/ChangePasswordPage';

const { SUPERADMIN, MANAGER, AGENT, ACCOUNTANT, HR } = ROLES;

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT]}>
                <BookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT]}>
                <BookingDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/customers" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT, HR]}>
                <CustomersPage />
              </ProtectedRoute>
            } />
            <Route path="/customers/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT, HR]}>
                <CustomerDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/packages" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT]}>
                <PackagesPage />
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <InvoicesPage />
              </ProtectedRoute>
            } />

            <Route path="/invoices/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <InvoiceDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/commissions" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT, ACCOUNTANT]}>
                <CommissionsPage />
              </ProtectedRoute>
            } />

            <Route path="/commissions/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT, ACCOUNTANT]}>
                <CommissionDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT, HR]}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute roles={[SUPERADMIN, HR]}>
                <StaffPage />
              </ProtectedRoute>
            } />

            <Route path="/hr" element={
              <ProtectedRoute roles={[SUPERADMIN, HR]}>
                <HRPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />

            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } />

            </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
