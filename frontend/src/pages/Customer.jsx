import { useState, useEffect } from "react";
import "./customer.css";
import DataTableFunc from "../components/DataTableFunc";


export const Customers = () => {

  const initialFormState = {
    CUSTOMERID: "",
    FIRSTNAME: "",
    LASTNAME: "",
    EMAIL: "",
    HOMEPHONE: "",
    BUSINESSPHONE: "",
    BIRTHDATE: "",
    ADDRESS: "",
    CITY: "",
    POSTALCODE: "",
    PROVINCE: "",
    COUNTRY: ""
  };
  const [form, setForm] = useState(initialFormState);
  
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState([]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getCustomers = () => {
    // Future: Fetch and display list of customers
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/customer`)
      .then(async (res) => {
        const data = await res.json();
        setCustomers(data);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  };

  const getCustmer = (id) => {
    // Future: Fetch and display single customer details
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/customer/${id.CUSTOMERID}`)
      .then(async (res) => {
        const data = await res.json();
        setForm(data[0]);
        setIsEditing(true);
      })
      .catch((error) => {
        console.error("Error fetching customer:", error);
      });
      console.log(form);
  };

  const updateCustomer = (id) => {
    // Future: Update customer details
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/customer/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then((res) => res.json())
      .then(() => setMessage("Customer updated successfully!"))
      .catch(() => setMessage("Error updating customer"));
    };    
    
    
    const deleteCustomer = (id) => {
      // Future: Delete customer
      if (!window.confirm("Are you sure you want to delete this customer?")) return;
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/customer/${id.CUSTOMERID}`, {
          method: "DELETE"
        })
        .then(() => {
          setMessage("Customer deleted successfully!");
          getCustomers();
        })
        .catch(() => setMessage("Error deleting customer!"));
    };

  const handleUpdate = (e) => {
    e.preventDefault();
    console.log("Updating customer with ID:", form.CUSTOMERID);
    updateCustomer(form.CUSTOMERID);
    setIsEditing(false);
    getCustomers();
    setForm(initialFormState);
  };  

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then((res) => res.json())
      .then(() => setMessage("Customer created successfully!"))
      .catch(() => setMessage("Error creating customer"));
    setForm(initialFormState);
  };

  useEffect(() => {
    getCustomers();
  }, []);


  return (
    <div className="customer">
      <h1>Customers</h1>
      <div className="customer-page">
        <section className="form-section">
          <form className="form-vertical" onSubmit={isEditing ? handleUpdate : handleSubmit}>
            {Object.keys(form).map((field) => (
              <div key={field} className="form-group">
                {
                  field === "CUSTOMERID" ? null : (
                  <label>{field.replace(/([A-Z])/g, "$1")}:</label>
                )}
                <input
                  name={field}
                  value={form[field] === null ? "" : form[field]}
                  onChange={handleChange}
                  type={field === "CUSTOMERID" ? "hidden" : field === "BIRTHDATE" ? "date" : 
                        field === "BIRTHDATE" ? "date" : 
                        field === "EMAIL" ? "email" : 
                        field === "HOMEPHONE" || field === "BUSINESSPHONE" ? "tel" : "text"
                      }
                />
              </div>
            ))}

            <button type="submit">
              {isEditing ? "Update Customer" : "Create Customer"}
            </button>
          </form>
        </section>
        <section className="customer-table">
            {/* Future: List of customers will go here */}
            <DataTableFunc data={customers ? customers : []} onEdit={ getCustmer } onDelete={deleteCustomer} />
            
        </section>
      </div>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}
export default Customers;