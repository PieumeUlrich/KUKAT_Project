import { useState, useEffect, useCallback } from 'react';
import {
  customersApi, invoicesApi, commissionsApi,
  packagesApi, staffApi, reportsApi,
} from '../api/allModulesApi';

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
      const list = data.customers ?? data;
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
      const list = data.invoices ?? data;
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
      const list = data.commissions ?? data;
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
      const list = data.products ?? data;
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
      const list = data.employees ?? data;
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
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [revenue, bookings, agents, topDest] = await Promise.all([
        reportsApi.getRevenueSummary(params),
        reportsApi.getBookingStats(params),
        reportsApi.getAgentPerformance(params),
        reportsApi.getTopDestinations(params),
      ]);
      setReport({
        revenue:      revenue.data ?? [],
        bookings:     bookings.data ?? {},
        agents:       agents.data ?? [],
        destinations: topDest.data ?? [],
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load reports.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refetch: fetch };
}
