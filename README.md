# ✈ KUKAT Travel Agency — Database Management System

> A full-stack travel agency management platform built with React, Express.js and Azure SQL Server. Features a public-facing landing page, role-based staff portal, multi-item booking system, invoice generation, commission tracking and audit logging.

**Live Demo:** [kukat-project.vercel.app](https://kukat-project.vercel.app)  
**Backend API:** [kukat-backend.up.railway.app](https://kukat-backend.up.railway.app)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Roles and Permissions](#roles-and-permissions)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Team](#team)

---

## Overview

KUKAT is a complete travel agency management system designed to streamline the day-to-day operations of a travel agency. It covers the full booking lifecycle — from client enquiry through to invoice generation, commission tracking and payment reconciliation — all within a secure, role-based platform.

The system includes a public-facing marketing website that displays live agency statistics, featured destinations, supplier promotions and a contact form. Staff access a separate authenticated portal tailored to their specific role.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Material UI (MUI), Recharts |
| Backend | Node.js, Express.js (ESM) |
| Database | Azure SQL Server (via `mssql` / Tedious) |
| Auth | JWT Access Tokens + Refresh Token Rotation |
| Email | Nodemailer + Gmail SMTP |
| Hosting — Frontend | Vercel |
| Hosting — Backend | Railway |
| Hosting — Database | Azure SQL |

---

## Features

### Public Landing Page
- Auto-advancing hero slideshow from local images
- Live agency statistics pulled from the database
- Scrolling destination image carousel
- Featured partner promotions with commission rates
- Partner logo sliding strip with fallback to initials
- About section with parallax background
- Full contact section with company details and enquiry form
- Enquiry modal triggered from CTA button
- Responsive design — mobile and desktop

### Authentication
- JWT access tokens with refresh token rotation
- Brute-force lockout protection
- OTP password reset via email (6-digit code, 15-minute expiry)
- Role-based route protection

### Booking Management
- Multi-item bookings — one booking can include products from multiple suppliers
- Group booking support with lead customer and additional travellers
- Share amount tracking per traveller with payment status
- Booking lifecycle — pending → confirmed → completed / cancelled
- Per-item trip dates, class type and destination

### Invoice and Payments
- Auto-generated invoices on booking confirmation
- Partial and full payment recording
- Invoice status tracking — unpaid / partial / paid
- PDF invoice export

### Commission Tracking
- One commission generated per supplier per booking
- Commission rate pulled from supplier profile
- Due date calculation — trip end + 60 days
- Commission payment recording with reference and processor details
- Overdue commission flagging

### Supplier Management
- Full supplier CRUD with address, contact and affiliation details
- Products linked to suppliers with category and booking revenue
- Supplier activation and deactivation with product guard
- Commission history per supplier

### Customer Management
- Full customer profiles with contact details
- Booking history per customer
- Group membership tracking across bookings

### Staff Portal
- Role-based dashboards with charts and KPIs
- HR module — employee management
- Audit log — full trail of all system actions
- Reports module — revenue, bookings and commission summaries

---

## Project Structure

```
kukat-project/
│
├── frontend/                        # React application
│   ├── public/
│   │   └── images/
│   │       ├── hero/                # Hero slideshow images
│   │       │   ├── slide1.jpg
│   │       │   └── ...
│   │       ├── logos/               # Supplier logos (supplierID.png)
│   │       │   └── 1001.png
│   │       └── wallpaper6.jpg       # About section background
│   └── src/
│       ├── api/                     # Axios API client and endpoint functions
│       ├── components/              # Shared UI components
│       │   ├── common/              # StatusChip, ProtectedRoute, NotFoundPage
│       │   └── layout/              # AppLayout, Sidebar, Header
│       ├── hooks/                   # Custom React hooks
│       │   ├── useBookings.js
│       │   └── useModules.js
│       ├── pages/                   # Page components by module
│       │   ├── landing/             # LandingPage.js + LandingPage.css
│       │   ├── auth/                # Login, ForgotPassword, ResetPassword
│       │   ├── bookings/            # BookingsPage, BookingDetailPage, BookingForm
│       │   ├── customers/
│       │   ├── invoices/
│       │   ├── commissions/
│       │   ├── suppliers/
│       │   ├── packages/
│       │   ├── staff/
│       │   ├── hr/
│       │   ├── reports/
│       │   └── audit/
│       ├── store/                   # AuthContext
│       ├── styles/                  # Theme and global styles
│       └── App.js                   # Routes and app entry
│
└── backend/                         # Express.js API
    └── src/
        ├── config/                  # Database connection
        ├── controllers/             # Route handlers per module
        │   ├── authController.js
        │   ├── bookingsController.js
        │   ├── commissionsController.js
        │   ├── customersController.js
        │   ├── employeesController.js
        │   ├── invoicesController.js
        │   ├── suppliersController.js
        │   ├── productsController.js
        │   ├── reportsController.js
        │   ├── auditController.js
        │   ├── automationController.js
        │   └── publicController.js
        ├── middleware/              # Auth, validation, error handling
        ├── routes/                  # Express router
        ├── utils/                   # Helpers, audit logger, mailer
        └── index.js                 # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Azure SQL Server database
- Gmail account with App Password for email

### 1. Clone the repository

```bash
git clone https://github.com/PieumeUlrich/KUKAT_Project.git
cd kukat-project
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Set up environment variables

Create a `.env` file in the `backend/` folder — see [Environment Variables](#environment-variables) below.

Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

### 5. Set up the database

Run the SQL scripts in order — see [Database Setup](#database-setup) below.

### 6. Start the backend

```bash
cd backend
node src/index.js
```

Backend runs on `http://localhost:3001`

### 7. Start the frontend

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000`

---

## Environment Variables

Create `backend/.env` with the following:

```env
# Server
PORT=3001
NODE_ENV=development

# Database — Azure SQL Server
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASS=your-password
DB_ENCRYPT=true

# JWT Authentication
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email — Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465 # → Using this port because free deployment doesn't support 587 normal port for google mail.
EMAIL_SECURE=true
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=KUKAT Travel <your-gmail@gmail.com>
```

> **Gmail App Password** — Go to `myaccount.google.com` → Security → 2-Step Verification → App passwords → Generate.

---

## Database Setup

Run the following SQL in Azure SQL Server (SSMS or Azure Portal Query Editor):

### Core tables

```sql
-- Roles
CREATE TABLE roles (
  roleID   INT IDENTITY(1,1) PRIMARY KEY,
  roleName NVARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (roleName) VALUES
  ('superadmin'), ('manager'), ('agent'), ('accountant'), ('hr');

-- Employees
CREATE TABLE employees (
  employeeID   INT IDENTITY(1,1) PRIMARY KEY,
  roleID       INT NOT NULL REFERENCES roles(roleID),
  firstName    NVARCHAR(100) NOT NULL,
  lastName     NVARCHAR(100) NOT NULL,
  email        NVARCHAR(100) NOT NULL UNIQUE,
  passwordHash NVARCHAR(255) NOT NULL,
  agentCode    NVARCHAR(20)  NULL,
  refreshToken NVARCHAR(500) NULL,
  isActive     BIT DEFAULT 1,
  createdAt    DATETIME DEFAULT GETDATE(),
  updatedAt    DATETIME DEFAULT GETDATE()
);

-- Password resets (OTP)
CREATE TABLE password_resets (
  resetID   INT IDENTITY(1,1) PRIMARY KEY,
  email     NVARCHAR(100) NOT NULL,
  otp       NVARCHAR(10)  NOT NULL,
  expiresAt DATETIME      NOT NULL,
  used      BIT DEFAULT 0 NOT NULL,
  createdAt DATETIME DEFAULT GETDATE() NOT NULL
);

-- Customers
CREATE TABLE customers (
  customerID    INT IDENTITY(1,1) PRIMARY KEY,
  firstName     NVARCHAR(100) NOT NULL,
  lastName      NVARCHAR(100) NOT NULL,
  email         NVARCHAR(100) NULL,
  homePhone     NVARCHAR(30)  NULL,
  businessPhone NVARCHAR(30)  NULL,
  birthDate     DATE          NULL,
  address       NVARCHAR(200) NULL,
  city          NVARCHAR(100) NULL,
  province      NVARCHAR(100) NULL,
  postalCode    NVARCHAR(20)  NULL,
  country       NVARCHAR(100) NULL,
  notes         NVARCHAR(500) NULL,
  createdAt     DATETIME DEFAULT GETDATE(),
  updatedAt     DATETIME DEFAULT GETDATE()
);

-- Affiliations
CREATE TABLE affiliations (
  affiliationID   INT IDENTITY(1,1) PRIMARY KEY,
  affiliationCode NVARCHAR(20)  NOT NULL UNIQUE,
  affiliationName NVARCHAR(100) NOT NULL,
  createdAt       DATETIME DEFAULT GETDATE()
);

-- Suppliers
CREATE TABLE suppliers (
  supplierID      INT IDENTITY(1,1) PRIMARY KEY,
  affiliationID   INT NULL REFERENCES affiliations(affiliationID),
  supplierName    VARCHAR(200) NOT NULL,
  contactName     VARCHAR(100) NULL,
  address1        VARCHAR(200) NULL,
  address2        VARCHAR(200) NULL,
  city            VARCHAR(100) NULL,
  province        VARCHAR(100) NULL,
  postalCode      VARCHAR(20)  NULL,
  country         VARCHAR(100) NULL,
  phoneNumber     VARCHAR(30)  NULL,
  fax             VARCHAR(30)  NULL,
  email           VARCHAR(100) NULL,
  website         VARCHAR(200) NULL,
  representative  VARCHAR(100) NULL,
  commissionRate  DECIMAL(5,2) DEFAULT 10,
  isActive        BIT          DEFAULT 1,
  affiliationCode NVARCHAR(20) NULL,
  notes           NVARCHAR(500) NULL,
  createdAt       DATETIME DEFAULT GETDATE(),
  updatedAt       DATETIME DEFAULT GETDATE()
);

-- Product categories
CREATE TABLE product_categories (
  categoryID   INT IDENTITY(1,1) PRIMARY KEY,
  categoryName NVARCHAR(100) NOT NULL,
  createdAt    DATETIME DEFAULT GETDATE()
);

-- Products
CREATE TABLE products (
  productID   INT IDENTITY(1,1) PRIMARY KEY,
  supplierID  INT NOT NULL REFERENCES suppliers(supplierID),
  categoryID  INT NOT NULL REFERENCES product_categories(categoryID),
  productName NVARCHAR(200) NOT NULL,
  description NVARCHAR(500) NULL,
  isActive    BIT DEFAULT 1,
  createdAt   DATETIME DEFAULT GETDATE(),
  updatedAt   DATETIME DEFAULT GETDATE()
);

-- Destinations
CREATE TABLE destinations (
  destinationID   INT IDENTITY(1,1) PRIMARY KEY,
  destinationCode NVARCHAR(20)  NULL,
  destinationName NVARCHAR(200) NOT NULL,
  region          NVARCHAR(100) NULL,
  createdAt       DATETIME DEFAULT GETDATE(),
  updatedAt       DATETIME DEFAULT GETDATE()
);

-- Class types
CREATE TABLE class_types (
  classID     INT IDENTITY(1,1) PRIMARY KEY,
  classCode   NVARCHAR(20)  NULL,
  description NVARCHAR(100) NOT NULL,
  createdAt   DATETIME DEFAULT GETDATE(),
  updatedAt   DATETIME DEFAULT GETDATE()
);

-- Booking fees
CREATE TABLE booking_fees (
  feeID       INT IDENTITY(1,1) PRIMARY KEY,
  description NVARCHAR(200) NOT NULL,
  feeAmount   DECIMAL(10,2) NOT NULL,
  createdAt   DATETIME DEFAULT GETDATE()
);

-- Bookings
CREATE TABLE bookings (
  bookingID          INT IDENTITY(1,1) PRIMARY KEY,
  employeeID         INT NOT NULL REFERENCES employees(employeeID),
  customerID         INT NOT NULL REFERENCES customers(customerID),
  productID          INT NULL,
  destinationID      INT NULL REFERENCES destinations(destinationID),
  classID            INT NULL REFERENCES class_types(classID),
  feeID              INT NULL REFERENCES booking_fees(feeID),
  bookingDate        DATE         NOT NULL DEFAULT GETDATE(),
  tripStart          DATE         NULL,
  tripEnd            DATE         NULL,
  numberOfTravellers INT          DEFAULT 1,
  description        NVARCHAR(500) NULL,
  basePrice          DECIMAL(10,2) DEFAULT 0,
  taxRate            DECIMAL(5,2)  DEFAULT 5,
  status             NVARCHAR(20)  DEFAULT 'pending',
  notes              NVARCHAR(500) NULL,
  isGroupBooking     BIT           DEFAULT 0,
  groupName          NVARCHAR(200) NULL,
  createdAt          DATETIME DEFAULT GETDATE(),
  updatedAt          DATETIME DEFAULT GETDATE()
);

-- Booking items (multi-product per booking)
CREATE TABLE booking_items (
  itemID        INT IDENTITY(1,1) PRIMARY KEY,
  bookingID     INT NOT NULL REFERENCES bookings(bookingID) ON DELETE CASCADE,
  productID     INT NOT NULL REFERENCES products(productID),
  supplierID    INT NOT NULL REFERENCES suppliers(supplierID),
  categoryID    INT NOT NULL REFERENCES product_categories(categoryID),
  description   NVARCHAR(500) NULL,
  unitPrice     DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity      INT NOT NULL DEFAULT 1,
  lineTotal     AS (unitPrice * quantity) PERSISTED,
  tripStart     DATE NULL,
  tripEnd       DATE NULL,
  classTypeID   INT NULL REFERENCES class_types(classID),
  destinationID INT NULL REFERENCES destinations(destinationID),
  notes         NVARCHAR(500) NULL,
  createdAt     DATETIME DEFAULT GETDATE()
);

-- Booking customers (group members)
CREATE TABLE booking_customers (
  bookingCustomerID INT IDENTITY(1,1) PRIMARY KEY,
  bookingID         INT NOT NULL REFERENCES bookings(bookingID),
  customerID        INT NOT NULL REFERENCES customers(customerID),
  role              NVARCHAR(20) DEFAULT 'member',
  shareAmount       DECIMAL(10,2) NULL,
  sharePaid         DECIMAL(10,2) DEFAULT 0,
  shareStatus       NVARCHAR(20)  DEFAULT 'unpaid',
  notes             NVARCHAR(500) NULL,
  createdAt         DATETIME DEFAULT GETDATE(),
  updatedAt         DATETIME DEFAULT GETDATE()
);

-- Invoices
CREATE TABLE invoices (
  invoiceID   INT IDENTITY(1,1) PRIMARY KEY,
  bookingID   INT NOT NULL REFERENCES bookings(bookingID),
  totalAmount DECIMAL(10,2) NOT NULL,
  taxAmount   DECIMAL(10,2) DEFAULT 0,
  status      NVARCHAR(20)  DEFAULT 'unpaid',
  issuedAt    DATETIME DEFAULT GETDATE(),
  dueDate     DATE NULL,
  notes       NVARCHAR(500) NULL,
  createdAt   DATETIME DEFAULT GETDATE(),
  updatedAt   DATETIME DEFAULT GETDATE()
);

-- Payments
CREATE TABLE payments (
  paymentID     INT IDENTITY(1,1) PRIMARY KEY,
  invoiceID     INT NOT NULL REFERENCES invoices(invoiceID),
  amountPaid    DECIMAL(10,2) NOT NULL,
  paymentMethod NVARCHAR(50)  DEFAULT 'CASH',
  paymentType   NVARCHAR(50)  DEFAULT 'full',
  paymentDate   DATE          NOT NULL,
  reference     NVARCHAR(200) NULL,
  notes         NVARCHAR(500) NULL,
  status        NVARCHAR(20)  DEFAULT 'completed',
  createdAt     DATETIME DEFAULT GETDATE()
);

-- Commissions
CREATE TABLE commissions (
  commissionID     INT IDENTITY(1,1) PRIMARY KEY,
  bookingID        INT NOT NULL REFERENCES bookings(bookingID),
  invoiceID        INT NULL REFERENCES invoices(invoiceID),
  supplierID       INT NULL REFERENCES suppliers(supplierID),
  commissionRate   DECIMAL(5,2) NOT NULL,
  commissionAmount DECIMAL(10,2) NOT NULL,
  description      NVARCHAR(500) NULL,
  status           NVARCHAR(20)  DEFAULT 'pending',
  approvedBy       INT NULL,
  approvedAt       DATETIME NULL,
  dueDate          DATE NULL,
  createdAt        DATETIME DEFAULT GETDATE(),
  updatedAt        DATETIME DEFAULT GETDATE()
);

-- Commission payments
CREATE TABLE commission_payments (
  commPaymentID INT IDENTITY(1,1) PRIMARY KEY,
  commissionID  INT NOT NULL REFERENCES commissions(commissionID),
  employeeID    INT NULL REFERENCES employees(employeeID),
  paymentDate   DATE         NOT NULL,
  paymentAmount DECIMAL(10,2) NOT NULL,
  paymentMethod NVARCHAR(50)  DEFAULT 'TRANSFER',
  reference     NVARCHAR(200) NULL,
  status        NVARCHAR(20)  DEFAULT 'completed',
  isBonus       BIT DEFAULT 0,
  bonusReason   NVARCHAR(500) NULL,
  processedBy   NVARCHAR(200) NULL,
  supplierID    INT NULL REFERENCES suppliers(supplierID),
  createdAt     DATETIME DEFAULT GETDATE(),
  updatedAt     DATETIME DEFAULT GETDATE()
);

-- Reward programs
CREATE TABLE reward_programs (
  rewardID    INT IDENTITY(1,1) PRIMARY KEY,
  customerID  INT NOT NULL REFERENCES customers(customerID),
  points      INT DEFAULT 0,
  tier        NVARCHAR(50) DEFAULT 'bronze',
  createdAt   DATETIME DEFAULT GETDATE(),
  updatedAt   DATETIME DEFAULT GETDATE()
);

-- Audit logs
CREATE TABLE audit_logs (
  logID       INT IDENTITY(1,1) PRIMARY KEY,
  employeeID  INT NULL REFERENCES employees(employeeID),
  action      NVARCHAR(100) NOT NULL,
  tableName   NVARCHAR(100) NOT NULL,
  recordID    INT NULL,
  oldValues   NVARCHAR(MAX) NULL,
  newValues   NVARCHAR(MAX) NULL,
  ipAddress   NVARCHAR(50)  NULL,
  userAgent   NVARCHAR(500) NULL,
  createdAt   DATETIME DEFAULT GETDATE()
);
```

### Fix legacy text columns

```sql
ALTER TABLE bookings     ALTER COLUMN description NVARCHAR(500) NULL;
ALTER TABLE customers    ALTER COLUMN notes        NVARCHAR(500) NULL;
ALTER TABLE products     ALTER COLUMN description  NVARCHAR(500) NULL;
ALTER TABLE commissions  ALTER COLUMN description  NVARCHAR(500) NULL;
ALTER TABLE bookings     ADD notes NVARCHAR(500) NULL;
```

### Create a superadmin account

```sql
-- Password is 'Admin@123' — change immediately after first login
INSERT INTO employees (roleID, firstName, lastName, email, passwordHash, agentCode, isActive)
VALUES (
  1,
  'Super',
  'Admin',
  'admin@kukat.ca',
  '$2a$12$your-bcrypt-hash-here',
  'SA001',
  1
);
```

> Generate a bcrypt hash at `bcrypt-generator.com` with cost factor 12.

---

## Roles and Permissions

| Role | Dashboard | Bookings | Customers | Invoices | Commissions | Suppliers | Staff | HR | Reports | Audit |
|---|---|---|---|---|---|---|---|---|---|---|
| superadmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| agent | ✅ | Own only | ✅ | View | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| accountant | ✅ | View | View | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| hr | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## API Overview

All protected routes require `Authorization: Bearer <token>` header.

### Public (no auth)
```
GET  /api/public/stats
GET  /api/public/destinations
GET  /api/public/promotions
GET  /api/public/suppliers
POST /api/public/contact
```

### Auth
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
PUT  /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Bookings
```
GET    /api/bookings
GET    /api/bookings/stats
GET    /api/bookings/:id
POST   /api/bookings
PUT    /api/bookings/:id
PUT    /api/bookings/:id/confirm
PUT    /api/bookings/:id/complete
PUT    /api/bookings/:id/cancel
GET    /api/bookings/:id/members
POST   /api/bookings/:id/members
DELETE /api/bookings/:id/members/:customerID
POST   /api/bookings/:id/members/:customerID/payment
```

### Suppliers
```
GET  /api/suppliers
GET  /api/suppliers/stats
GET  /api/suppliers/:id
POST /api/suppliers
PUT  /api/suppliers/:id
PUT  /api/suppliers/:id/activate
PUT  /api/suppliers/:id/deactivate
GET  /api/suppliers/:id/products
GET  /api/suppliers/:id/commissions
```

### Other modules
```
/api/customers      — CRUD + booking history
/api/invoices       — CRUD + payments + PDF export
/api/commissions    — CRUD + payments
/api/products       — CRUD
/api/employees      — CRUD
/api/reports        — revenue, bookings, commissions
/api/audit          — read-only log
/api/automation     — generate commissions from bookings
```

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | `your-app.vercel.app` |
| Backend | Railway | `your-backend.up.railway.app` |
| Database | Azure SQL | `your-server.database.windows.net` |

### Deploy backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `backend`
3. Add all environment variables
4. Generate domain in Networking tab
5. Enable "Allow Azure services" on Azure SQL firewall

### Deploy frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add `REACT_APP_BACKEND_URL` environment variable
4. Deploy

### CORS
Update `backend/src/index.js` with your Vercel URL:
```javascript
origin: [
  'http://localhost:3000',
  'https://your-app.vercel.app',
]
```

---

## Team

Built by the KUKAT team as the capstone project for the **Database Administration Certificate** program at **SAIT (Southern Alberta Institute of Technology)**, Calgary, Alberta — 2025/2026.

| Name | Role |
|---|---|
| Ulrich Pieume | Lead Developer / DBA |
| Adebayo | Team Member |
| Tyvon Blake | Team Member |
| Kyle Santan | Team Member |
| Kiya | Team Member |

---

## License

This project was built for academic purposes as part of the SAIT Database Administration Certificate program. All rights reserved © 2026 KUKAT Travel Agency Team.

## Contact
> Email: pieumeulrich@gmail.com

> LinkedIn: www.linkedin.com/in/pieume-ulrich