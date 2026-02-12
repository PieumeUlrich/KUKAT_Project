# 🌍 KUKAT Travel Agency Dashboard  
A full‑stack web application designed to manage travel agency operations, including customers, bookings, dashboard metrics, and SQL query exploration.  
This project includes a **Node.js + SQL Server backend** and a **React frontend** with a clean, modern UI.

---

## 🚀 Features

### **Dashboard**
- Total bookings  
- Total revenue  
- Current month bookings  
- Best‑selling product  
- Last 5 bookings  
- Last 5 transactions  

### **Customers**
- Create new customers  
- View all customers in a paginated table (10 rows per page)  
- Clean 2‑column form layout  
- Birthdate formatting (YYYY‑MM‑DD)  

### **Bookings**
- Filter bookings by destination  
- Dynamic table display  

### **Query Lab**
- Run safe SQL queries  
- Dynamic table output  
- Backend sanitization to prevent destructive queries  

---

## 🏗️ Tech Stack

### **Frontend**
- React (Create React App)
- Modern CSS styling
- Reusable components (tables, forms, layout, topbar, sidebar)

### **Backend**
- Node.js (ES Modules)
- Express.js
- SQL Server (mssql driver)
- Clean controller + routes architecture

---

## 📁 Project Structure

### **Backend**
```
backend/
│
├── server.js
├── package.json
│
├── db/
│   ├── config.js
│   └── connection.js
│
├── routes/
│   ├── dashboard.js
│   ├── bookings.js
│   ├── clients.js
│   └── query.js
│
└── controllers/
    ├── dashboardController.js
    ├── bookingsController.js
    ├── clientsController.js
    └── queryController.js
```
### **Frontend**
```
frontend/
│
├── package.json
├── public/
│   └── index.html
│
└── src/
    ├── index.js
    ├── index.css
    ├── App.jsx
    │
    ├── components/
    │   ├── Layout.jsx
    │   ├── Sidebar.jsx
    │   ├── Topbar.jsx
    │   ├── MetricCard.jsx
    │   └── DataTable.jsx
    │
    └── pages/
    │    ├── Dashboard.jsx
    │    ├── Bookings.jsx
    │    ├── Customers.jsx
    │    └── QueryLab.jsx
    │
    └── styles/
```
---

## 🛠️ Installation & Setup

### **1. Clone the repository**

git clone [https://github.com/<your-username>/<your-repo>.git](https://github.com/PieumeUlrich/CPRG_206_Webintegration.git)

`cd Assignemt03`