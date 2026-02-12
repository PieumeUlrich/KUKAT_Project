import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";
import DataTable from "../components/DataTable";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [lastBookings, setLastBookings] = useState([]);
  const [lastTransactions, setLastTransactions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/dashboard")
      .then((res) => res.json())
      .then((data) => setMetrics(data));

    fetch("http://localhost:3001/api/dashboard/last-bookings")
      .then((res) => res.json())
      .then((data) => setLastBookings(data.recordset || []));

    fetch("http://localhost:3001/api/dashboard/last-transactions")
      .then((res) => res.json())
      .then((data) => setLastTransactions(data.recordset || []));
  }, []);

  return (
    <div>
      <h1>Dashboard Overview</h1>

      <div className="metrics-grid">
        <MetricCard label="Total Bookings" value={metrics.totalBookings} />
        <MetricCard label="Total Revenue" value={`$${metrics.totalRevenue}`} accent="#16a34a" />
        <MetricCard label="Bookings This Month" value={metrics.currentMonthBookings} accent="#f97316" />
        <MetricCard label="Best Product" value={metrics.bestProduct} accent="#2563eb" />
      </div>

      <h2 className="section-title">Last 5 Bookings</h2>
      <DataTable data={lastBookings} />

      <h2 className="section-title">Last 5 Transactions</h2>
      <DataTable data={lastTransactions} />
    </div>
  );
}