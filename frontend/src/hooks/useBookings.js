import { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/index';

export const useBookings = (filters = {}) => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [total,    setTotal]    = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await bookingsApi.getAll(filters);
      const list = data.data ?? data.bookings ?? data;
      setBookings(Array.isArray(list) ? list : []);
      setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);
  return { bookings, loading, error, total, refetch: load };
};

export const useBooking = (id) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await bookingsApi.getById(id);
      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  return { booking, loading, error, refetch: load };
};

// Reference data for form dropdowns
export const useBookingFormData = () => {
  const [data,    setData]    = useState({
    destinations: [], classTypes: [], fees: [], products: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingsApi.getDestinations(),
      bookingsApi.getClassTypes(),
      bookingsApi.getBookingFees(),
      bookingsApi.getProducts(),
    ]).then(([dest, cls, fees, prod]) => {
      setData({
        destinations: Array.isArray(dest.data) ? dest.data : (dest.data?.data ?? []),
        classTypes:   Array.isArray(cls.data)  ? cls.data  : (cls.data?.data  ?? []),
        fees:         Array.isArray(fees.data) ? fees.data : (fees.data?.data ?? []),
        products:     Array.isArray(prod.data) ? prod.data : (prod.data?.data ?? []),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
};

export const useBookingStats = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    bookingsApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({
        total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0,
      }))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
};