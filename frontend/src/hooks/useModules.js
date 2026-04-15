import { useState, useEffect, useCallback } from 'react';
import {
  customersApi, invoicesApi, commissionsApi,
  packagesApi, staffApi, reportsApi, 
  dashboardApi, notificationsApi,
} from '../api/index';

// ── Customers ─────────────────────────────────────────────────
export function useCustomers(filters = {}) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [total,     setTotal]     = useState(0);

  const key = JSON.stringify(filters);
  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);
  return { customers, loading, error, total, refetch: fetch };
}

export function useCustomer(id) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await customersApi.getById(id);
      setCustomer(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Customer not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { customer, loading, error, refetch: fetch };
}

// ── Invoices ──────────────────────────────────────────────────
export function useInvoices(filters = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [total,    setTotal]    = useState(0);

  const key = JSON.stringify(filters);
  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);
  return { invoices, loading, error, total, refetch: fetch };
}

export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await invoicesApi.getById(id);
      setInvoice(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Invoice not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { invoice, loading, error, refetch: fetch };
}

// ── Commissions ───────────────────────────────────────────────
export function useCommissions(filters = {}) {
  const [commissions, setCommissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [total,       setTotal]       = useState(0);

  const key = JSON.stringify(filters);
  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);
  return { commissions, loading, error, total, refetch: fetch };
}

// ── Packages ──────────────────────────────────────────────────
export function usePackages(filters = {}) {
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const key = JSON.stringify(filters);
  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);
  return { packages, loading, error, refetch: fetch };
}

export function usePackageFormData() {
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([packagesApi.getCategories(), packagesApi.getSuppliers()])
      .then(([cats, sups]) => {
        setCategories(cats.data ?? []);
        setSuppliers(sups.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, suppliers, loading };
}

// ── Staff ─────────────────────────────────────────────────────
export function useStaff(filters = {}) {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const key = JSON.stringify(filters);
  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);
  return { staff, loading, error, refetch: fetch };
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
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [revenue, bookings, agents, topDest, topProd, trend, commReport] = await Promise.all([
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
            revenue:      revenue.data ?? {},
            bookings:     bookings.data ?? {},
            agents:       Array.isArray(agents.data) ? agents.data : [],
            destinations: Array.isArray(topDest.data) ? topDest.data : [],
            products:     Array.isArray(topProd.data) ? topProd.data : [],
            trend:        Array.isArray(trend.data)   ? trend.data   : [],
            commissions:  commReport.data ?? {},
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { report, loading, error };
}

// ── Stats hooks (accurate counts across all records) ──────────
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

export function useInvoiceStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    invoicesApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ total: 0, paid: 0, unpaid: 0, partial: 0, totalCollected: 0, totalOutstanding: 0 }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

export function useCommissionStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    commissionsApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ total: 0, pending: 0, approved: 0, paid: 0, totalPaid: 0, bonusCount: 0 }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
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

// ── Dashboard ─────────────────────────────────────────────────
export function useDashboard(params = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
    load();
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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.get();
      setNotifications(data.notifications ?? []);
      setTotal(data.total ?? 0);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { notifications, total, loading, refetch: fetch };
}
