import { useState, useEffect, useCallback } from 'react';
import {
  customersApi, invoicesApi, commissionsApi,
  packagesApi, staffApi, reportsApi,
  dashboardApi, notificationsApi, suppliersApi,
} from '../api/index';

// ── Customers ─────────────────────────────────────────────────
export function useCustomers(filters = {}) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [total,     setTotal]     = useState(0);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await customersApi.getAll(filters);
      const list = data.customers ?? data.data ?? data;
      setCustomers(Array.isArray(list) ? list : []);
      setTotal(data.total ?? list.length);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load customers.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { customers, loading, error, total, refetch: load };
}

export function useCustomer(id) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await customersApi.getById(id);
      setCustomer(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Customer not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  return { customer, loading, error, refetch: load };
}

export function useCustomerStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    customersApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ total: 0, withBookings: 0, newThisMonth: 0 }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

// ── Invoices ──────────────────────────────────────────────────
export function useInvoices(filters = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [total,    setTotal]    = useState(0);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await invoicesApi.getAll(filters);
      const list = data.invoices ?? data.data ?? data;
      setInvoices(Array.isArray(list) ? list : []);
      setTotal(data.total ?? list.length);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load invoices.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { invoices, loading, error, total, refetch: load };
}

export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await invoicesApi.getById(id);
      setInvoice(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Invoice not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  return { invoice, loading, error, refetch: load };
}

export function useInvoiceStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    invoicesApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({
        total: 0, paid: 0, unpaid: 0, partial: 0,
        totalCollected: 0, totalOutstanding: 0,
      }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

// ── Commissions ───────────────────────────────────────────────
export function useCommissions(filters = {}) {
  const [commissions, setCommissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [total,       setTotal]       = useState(0);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await commissionsApi.getAll(filters);
      const list = data.commissions ?? data.data ?? data;
      setCommissions(Array.isArray(list) ? list : []);
      setTotal(data.total ?? list.length);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load commissions.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { commissions, loading, error, total, refetch: load };
}

export function useCommissionStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    commissionsApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({
        total: 0, pending: 0, approved: 0, paid: 0,
        totalPaid: 0, totalPending: 0,
        overdueCount: 0,
      }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

// ── Packages ──────────────────────────────────────────────────
export function usePackages(filters = {}) {
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await packagesApi.getAll(filters);
      const list = data.products ?? data.data ?? data;
      setPackages(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load packages.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { packages, loading, error, refetch: load };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  useEffect(() => {
    packagesApi.getCategories()
      .then(({ data }) => setCategories(data.categories ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { categories, loading };
}

// ← getSuppliers removed from packagesApi — now uses suppliersApi
export function usePackageFormData() {
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      packagesApi.getCategories(),
      suppliersApi.getAll({ isActive: true, limit: 'all' }),
    ])
      .then(([cats, sups]) => {
        setCategories(cats.data?.categories ?? cats.data ?? []);
        const list = sups.data?.data ?? sups.data ?? [];
        setSuppliers(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, suppliers, loading };
}

// ── Suppliers ─────────────────────────────────────────────────
export function useSuppliers(filters = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [total,     setTotal]     = useState(0);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await suppliersApi.getAll(filters);
      const list = data.data ?? data;
      setSuppliers(Array.isArray(list) ? list : []);
      setTotal(data.total ?? list.length);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load suppliers.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { suppliers, loading, error, total, refetch: load };
}

export function useSupplier(id) {
  const [supplier, setSupplier] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await suppliersApi.getById(id);
      setSupplier(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Supplier not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  return { supplier, loading, error, refetch: load };
}

export function useSupplierStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    suppliersApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({
        total: 0, active: 0, inactive: 0,
        withPendingCommissions: 0, withOverdueCommissions: 0,
        totalPendingAmount: 0, totalReceivedAmount: 0,
      }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

// ── Staff ─────────────────────────────────────────────────────
export function useStaff(filters = {}) {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const key = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await staffApi.getAll(filters);
      const list = data.employees ?? data.data ?? data;
      setStaff(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load staff.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { staff, loading, error, refetch: load };
}

export function useStaffStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    staffApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ total: 0, active: 0, inactive: 0, agents: 0 }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

export function useRoles() {
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    staffApi.getRoles()
      .then(({ data }) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { roles, loading };
}

// ── Reports ───────────────────────────────────────────────────
export function useReports(params = {}) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      setLoading(true); setError(null);
      try {
        const [revenue, bookings, agents, topDest, topProd, trend, commReport] =
          await Promise.all([
            reportsApi.getRevenueSummary(params),
            reportsApi.getBookingStats(params),
            reportsApi.getAgentPerformance(params),
            reportsApi.getTopDestinations(params),
            reportsApi.getTopProducts(params),
            reportsApi.getRevenueTrend(params),
            reportsApi.getCommissionReport(params),
          ]);
        if (!cancelled) {
          setReport({
            revenue:      revenue.data  ?? {},
            bookings:     bookings.data ?? {},
            agents:       Array.isArray(agents.data)    ? agents.data    : [],
            destinations: Array.isArray(topDest.data)   ? topDest.data   : [],
            products:     Array.isArray(topProd.data)   ? topProd.data   : [],
            trend:        Array.isArray(trend.data)     ? trend.data     : [],
            // array grouped by supplier from getCommissionReport
            commissions:  Array.isArray(commReport.data) ? commReport.data : [],
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadReports();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { report, loading, error };
}

// ── Dashboard ─────────────────────────────────────────────────
export function useDashboard(params = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async () => {
      setLoading(true); setError(null);
      try {
        const { data: res } = await dashboardApi.get(params);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDashboard();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error };
}

// ── Notifications ─────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.get();
      setNotifications(data.notifications ?? []);
      setTotal(data.total ?? 0);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { notifications, total, loading, refetch: load };
}