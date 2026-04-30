import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './styles/theme';
import { AuthProvider, ROLES } from './store/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage             from './pages/auth/LoginPage';
import UnauthorizedPage      from './pages/auth/UnauthorizedPage';
import ChangePasswordPage    from './pages/auth/ChangePasswordPage';
import DashboardPage         from './pages/dashboard/DashboardPage';
import BookingsPage          from './pages/bookings/BookingsPage';
import BookingDetailPage     from './pages/bookings/BookingDetailPage';
import CustomersPage         from './pages/customers/CustomersPage';
import CustomerDetailPage    from './pages/customers/CustomerDetailPage';
import PackagesPage          from './pages/packages/PackagesPage';
import InvoicesPage          from './pages/invoices/InvoicesPage';
import InvoiceDetailPage     from './pages/invoices/InvoiceDetailPage';
import CommissionsPage       from './pages/commissions/CommissionsPage';
import CommissionDetailPage  from './pages/commissions/CommissionDetailPage';
import SuppliersPage         from './pages/suppliers/SuppliersPage';
import SupplierDetailPage    from './pages/suppliers/SupplierDetailPage';
import ReportsPage           from './pages/reports/ReportsPage';
import StaffPage             from './pages/staff/StaffPage';
import HRPage                from './pages/hr/HRPage';
import AuditPage             from './pages/admin/AuditPage';

const { SUPERADMIN, MANAGER, AGENT, ACCOUNTANT, HR } = ROLES;

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Public ───────────────────────────────────────── */}
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />

            {/* ── All authenticated users ───────────────────────── */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/change-password" element={
              <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
            } />

            {/* ── Bookings ──────────────────────────────────────── */}
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

            {/* ── Customers ─────────────────────────────────────── */}
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

            {/* ── Packages ──────────────────────────────────────── */}
            <Route path="/packages" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, AGENT]}>
                <PackagesPage />
              </ProtectedRoute>
            } />

            {/* ── Invoices ──────────────────────────────────────── */}
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

            {/* ── Commissions ───────────────────────────────────── */}
            <Route path="/commissions" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <CommissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/commissions/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <CommissionDetailPage />
              </ProtectedRoute>
            } />

            {/* ── Suppliers ─────────────────────────────────────── */}
            <Route path="/suppliers" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <SuppliersPage />
              </ProtectedRoute>
            } />
            <Route path="/suppliers/:id" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT]}>
                <SupplierDetailPage />
              </ProtectedRoute>
            } />

            {/* ── Reports ───────────────────────────────────────── */}
            <Route path="/reports" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER, ACCOUNTANT, HR]}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            {/* ── Staff ─────────────────────────────────────────── */}
            <Route path="/staff" element={
              <ProtectedRoute roles={[SUPERADMIN, HR]}>
                <StaffPage />
              </ProtectedRoute>
            } />

            {/* ── HR ────────────────────────────────────────────── */}
            <Route path="/hr" element={
              <ProtectedRoute roles={[SUPERADMIN, HR]}>
                <HRPage />
              </ProtectedRoute>
            } />

            {/* ── Audit ─────────────────────────────────────────── */}
            <Route path="/audit" element={
              <ProtectedRoute roles={[SUPERADMIN, MANAGER]}>
                <AuditPage />
              </ProtectedRoute>
            } />

            {/* ── Catch-all — must be last ──────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;