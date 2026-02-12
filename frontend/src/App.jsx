import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customer";
import QueryLab from "./pages/QueryLab";
import "./index.css";

export default function App() {
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const handler = (e) => setPage(e.detail);
    window.addEventListener("nav-change", handler);
    return () => window.removeEventListener("nav-change", handler);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "bookings":
        return <Bookings />;
      case "customers":
        return <Customers />;
      case "querylab":
        return <QueryLab />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}