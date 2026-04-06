import { useState, useEffect, useCallback } from 'react';
import bookingsApi from '../api/bookingsApi';

export function useBookings(filters = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [total,    setTotal]    = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await bookingsApi.getAll(filters);
      // Backend returns { bookings: [], total: N }
      setBookings(data.bookings ?? data);
      setTotal(data.total ?? (data.bookings ?? data).length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, error, total, refetch: fetch };
}

export function useBooking(id) {
  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await bookingsApi.getById(id);
      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { booking, loading, error, refetch: fetch };
}

// Reference data for form dropdowns
export function useBookingFormData() {
  const [data, setData]       = useState({ destinations: [], classTypes: [], fees: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingsApi.getDestinations(),
      bookingsApi.getClassTypes(),
      bookingsApi.getBookingFees(),
      bookingsApi.getProducts(),
    ]).then(([dest, cls, fees, prod]) => {
      setData({
        destinations: dest.data,
        classTypes:   cls.data,
        fees:         fees.data,
        products:     prod.data,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}
