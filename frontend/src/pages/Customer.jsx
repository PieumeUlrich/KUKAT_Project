import { useState, useEffect } from "react";
import "./customer.css";
import DataTable from "../components/DataTable";

export default function Customers() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    homePhone: "",
    businessPhone: "",
    birthDate: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: ""
  });

  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState([]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getCustomers = () => {
    // Future: Fetch and display list of customers
    fetch("http://localhost:3001/api/customer")
      .then(async (res) => {
        const data = await res.json();
        setCustomers(data);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:3001/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then((res) => res.json())
      .then(() => setMessage("Customer created successfully!"))
      .catch(() => setMessage("Error creating customer"));
  };

  useEffect(() => {
    getCustomers();
  }, []);


  return (
    <div className="customer">
      <h1>Customers</h1>
      <div className="customer-page">
        <section className="form-section">
          <form className="form-vertical" onSubmit={handleSubmit}>
            {Object.keys(form).map((field) => (
              <div key={field} className="form-group">
                <label>{field.replace(/([A-Z])/g, " $1").toUpperCase()}:</label>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  type={field === "birthDate" ? "date" : "text"}
                />
              </div>
            ))}

            <button type="submit">Create Customer</button>
          </form>
        </section>
        <section className="customer-table">
            {/* Future: List of customers will go here */}
            <DataTable data={customers ? customers : []} />
            
        </section>
      </div>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}