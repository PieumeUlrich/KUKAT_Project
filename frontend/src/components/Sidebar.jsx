import { useState } from "react";

const Sidebar = () => {
  const [active, setActive] = useState("dashboard");

  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "bookings", label: "Bookings" },
    { id: "customers", label: "Customers" },
    { id: "querylab", label: "Query Lab" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Travel Admin</div>
      <nav>
        {items.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${active === item.id ? "active" : ""}`}
            onClick={() => {
              setActive(item.id);
              window.dispatchEvent(new CustomEvent("nav-change", { detail: item.id }));
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;