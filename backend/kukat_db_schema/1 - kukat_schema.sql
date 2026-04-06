-- ============================================================
--  KUKAT Travel Agency — Clean Database Schema
--  Engine: SQL Server (Azure)
--  All tables include audit fields: createdAt, updatedAt
-- ============================================================

-- ------------------------------------------------------------
--  AUTH & ROLES
-- ------------------------------------------------------------
CREATE TABLE roles (
    roleID       INT           PRIMARY KEY IDENTITY(1,1),
    roleName     VARCHAR(50)   NOT NULL UNIQUE,   -- 'superadmin','manager','agent','accountant','hr'
    description  VARCHAR(255),
    createdAt    DATETIME      DEFAULT GETDATE(),
    updatedAt    DATETIME      DEFAULT GETDATE()
);

CREATE TABLE employees (
    employeeID   INT           PRIMARY KEY IDENTITY(1,1),
    roleID       INT           NOT NULL REFERENCES roles(roleID),
    agentCode    VARCHAR(20)   UNIQUE,
    firstName    VARCHAR(100)  NOT NULL,
    lastName     VARCHAR(100)  NOT NULL,
    email        VARCHAR(150)  NOT NULL UNIQUE,
    passwordHash VARCHAR(255)  NOT NULL,
    phoneNumber  VARCHAR(20),
    address1     VARCHAR(200),
    address2     VARCHAR(200),
    city         VARCHAR(100),
    province     VARCHAR(100),
    postalCode   VARCHAR(20),
    country      VARCHAR(100)  DEFAULT 'Canada',
    isActive     BIT           DEFAULT 1,
    hireDate     DATE,
    createdAt    DATETIME      DEFAULT GETDATE(),
    updatedAt    DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE customers (
    customerID     INT           PRIMARY KEY IDENTITY(1,1),
    assignedAgentID INT          REFERENCES employees(employeeID),  -- agent responsible
    firstName      VARCHAR(100)  NOT NULL,
    lastName       VARCHAR(100)  NOT NULL,
    email          VARCHAR(150),
    homePhone      VARCHAR(20),
    businessPhone  VARCHAR(20),
    birthDate      DATE,
    address        VARCHAR(200),
    city           VARCHAR(100),
    postalCode     VARCHAR(20),
    province       VARCHAR(100),
    country        VARCHAR(100)  DEFAULT 'Canada',
    notes          TEXT,
    createdAt      DATETIME      DEFAULT GETDATE(),
    updatedAt      DATETIME      DEFAULT GETDATE()
);

CREATE TABLE credit_cards (
    cardID         INT           PRIMARY KEY IDENTITY(1,1),
    customerID     INT           NOT NULL REFERENCES customers(customerID),
    cardNumber     VARCHAR(20)   NOT NULL,   -- stored masked: **** **** **** 1234
    cardHolderName VARCHAR(150)  NOT NULL,
    cardType       VARCHAR(20)   NOT NULL,   -- VISA, MC, AMEX, Diners
    expiryDate     DATE          NOT NULL,
    isDefault      BIT           DEFAULT 0,
    createdAt      DATETIME      DEFAULT GETDATE(),
    updatedAt      DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  REWARDS
-- ------------------------------------------------------------
CREATE TABLE reward_programs (
    rewardID      INT           PRIMARY KEY IDENTITY(1,1),
    programName   VARCHAR(100)  NOT NULL,
    description   VARCHAR(500),
    pointsPerDollar DECIMAL(5,2) DEFAULT 1.00,
    isActive      BIT           DEFAULT 1,
    createdAt     DATETIME      DEFAULT GETDATE(),
    updatedAt     DATETIME      DEFAULT GETDATE()
);

CREATE TABLE customer_rewards (
    customerRewardID INT        PRIMARY KEY IDENTITY(1,1),
    customerID       INT        NOT NULL REFERENCES customers(customerID),
    rewardID         INT        NOT NULL REFERENCES reward_programs(rewardID),
    pointsBalance    INT        DEFAULT 0,
    dateJoined       DATE       DEFAULT GETDATE(),
    status           VARCHAR(20) DEFAULT 'active',  -- active, suspended, expired
    createdAt        DATETIME   DEFAULT GETDATE(),
    updatedAt        DATETIME   DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  PRODUCTS & SUPPLIERS
-- ------------------------------------------------------------
CREATE TABLE affiliations (
    affiliationID   INT           PRIMARY KEY IDENTITY(1,1),
    affiliationCode VARCHAR(50)   NOT NULL UNIQUE,
    description     VARCHAR(255),
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

CREATE TABLE product_categories (
    categoryID      INT           PRIMARY KEY IDENTITY(1,1),
    categoryName    VARCHAR(100)  NOT NULL,
    rangeStart      INT,
    rangeEnd        INT,
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

CREATE TABLE suppliers (
    supplierID       INT           PRIMARY KEY IDENTITY(1,1),
    affiliationID    INT           REFERENCES affiliations(affiliationID),
    supplierName     VARCHAR(200)  NOT NULL,
    contactName      VARCHAR(150),
    address1         VARCHAR(200),
    address2         VARCHAR(200),
    city             VARCHAR(100),
    province         VARCHAR(100),
    postalCode       VARCHAR(20),
    country          VARCHAR(100),
    phoneNumber      VARCHAR(20),
    fax              VARCHAR(20),
    email            VARCHAR(150),
    website          VARCHAR(200),
    representative   VARCHAR(150),
    commissionRate   DECIMAL(5,2)  DEFAULT 0.00,  -- % commission this supplier pays the agency
    isActive         BIT           DEFAULT 1,
    createdAt        DATETIME      DEFAULT GETDATE(),
    updatedAt        DATETIME      DEFAULT GETDATE()
);

CREATE TABLE products (
    productID       INT           PRIMARY KEY IDENTITY(1,1),
    supplierID      INT           NOT NULL REFERENCES suppliers(supplierID),
    categoryID      INT           NOT NULL REFERENCES product_categories(categoryID),
    productName     VARCHAR(200)  NOT NULL,
    description     TEXT,
    isActive        BIT           DEFAULT 1,
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  BOOKING REFERENCE DATA
-- ------------------------------------------------------------
CREATE TABLE destinations (
    destinationID   INT           PRIMARY KEY IDENTITY(1,1),
    destinationCode VARCHAR(20)   NOT NULL UNIQUE,
    destinationName VARCHAR(200)  NOT NULL,
    region          VARCHAR(100),
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

CREATE TABLE class_types (
    classID         INT           PRIMARY KEY IDENTITY(1,1),
    classCode       VARCHAR(20)   NOT NULL UNIQUE,
    description     VARCHAR(100)  NOT NULL,
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

CREATE TABLE booking_fees (
    feeID           INT           PRIMARY KEY IDENTITY(1,1),
    feeCode         VARCHAR(20)   NOT NULL UNIQUE,
    description     VARCHAR(150)  NOT NULL,
    feeAmount       DECIMAL(10,2) NOT NULL,
    createdAt       DATETIME      DEFAULT GETDATE(),
    updatedAt       DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  BOOKINGS
-- ------------------------------------------------------------
CREATE TABLE bookings (
    bookingID          INT           PRIMARY KEY IDENTITY(1,1),
    employeeID         INT           NOT NULL REFERENCES employees(employeeID),
    customerID         INT           NOT NULL REFERENCES customers(customerID),
    productID          INT           NOT NULL REFERENCES products(productID),
    destinationID      INT           REFERENCES destinations(destinationID),
    classID            INT           REFERENCES class_types(classID),
    feeID              INT           REFERENCES booking_fees(feeID),
    bookingDate        DATE          NOT NULL DEFAULT GETDATE(),
    tripStart          DATE,
    tripEnd            DATE,
    numberOfTravellers INT           DEFAULT 1,
    description        TEXT,
    basePrice          DECIMAL(12,2) NOT NULL,
    taxRate            DECIMAL(5,2)  DEFAULT 5.00,   -- GST %
    status             VARCHAR(30)   DEFAULT 'pending',  -- pending, confirmed, cancelled, completed
    createdAt          DATETIME      DEFAULT GETDATE(),
    updatedAt          DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  INVOICES & PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE invoices (
    invoiceID      INT           PRIMARY KEY IDENTITY(1,1),
    bookingID      INT           NOT NULL UNIQUE REFERENCES bookings(bookingID),  -- 1 invoice per booking
    invoiceDate    DATE          NOT NULL DEFAULT GETDATE(),
    subtotal       DECIMAL(12,2) NOT NULL,
    taxAmount      DECIMAL(12,2) NOT NULL,
    feeAmount      DECIMAL(12,2) DEFAULT 0.00,
    totalAmount    DECIMAL(12,2) NOT NULL,  -- subtotal + tax + fees
    status         VARCHAR(30)   DEFAULT 'unpaid',  -- unpaid, partial, paid, refunded
    dueDate        DATE,
    notes          TEXT,
    createdAt      DATETIME      DEFAULT GETDATE(),
    updatedAt      DATETIME      DEFAULT GETDATE()
);

CREATE TABLE payments (
    paymentID      INT           PRIMARY KEY IDENTITY(1,1),
    invoiceID      INT           NOT NULL REFERENCES invoices(invoiceID),
    cardID         INT           REFERENCES credit_cards(cardID),
    billedAmount   DECIMAL(12,2) NOT NULL,
    amountPaid     DECIMAL(12,2) NOT NULL,
    paymentMethod  VARCHAR(30)   NOT NULL,  -- CARD, CASH, TRANSFER, CHECK
    paymentDate    DATE          NOT NULL DEFAULT GETDATE(),
    paymentType    VARCHAR(30)   DEFAULT 'full',  -- deposit, partial, full, refund
    status         VARCHAR(30)   DEFAULT 'pending',  -- pending, completed, failed, refunded
    reference      VARCHAR(100),  -- transaction ref / cheque number
    notes          TEXT,
    createdAt      DATETIME      DEFAULT GETDATE(),
    updatedAt      DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  COMMISSIONS
-- ------------------------------------------------------------
CREATE TABLE commissions (
    commissionID     INT           PRIMARY KEY IDENTITY(1,1),
    bookingID        INT           NOT NULL REFERENCES bookings(bookingID),
    employeeID       INT           NOT NULL REFERENCES employees(employeeID),  -- agent who earned it
    invoiceID        INT           NOT NULL REFERENCES invoices(invoiceID),
    commissionRate   DECIMAL(5,2)  NOT NULL,   -- % at time of booking
    commissionAmount DECIMAL(12,2) NOT NULL,
    description      TEXT,
    status           VARCHAR(30)   DEFAULT 'pending',  -- pending, approved, paid, cancelled
    approvedBy       INT           REFERENCES employees(employeeID),
    approvedAt       DATETIME,
    createdAt        DATETIME      DEFAULT GETDATE(),
    updatedAt        DATETIME      DEFAULT GETDATE()
);

CREATE TABLE commission_payments (
    commPaymentID    INT           PRIMARY KEY IDENTITY(1,1),
    commissionID     INT           NOT NULL REFERENCES commissions(commissionID),
    employeeID       INT           NOT NULL REFERENCES employees(employeeID),
    paymentDate      DATE          NOT NULL,
    paymentAmount    DECIMAL(12,2) NOT NULL,
    paymentMethod    VARCHAR(30)   NOT NULL,  -- TRANSFER, CHEQUE, CASH
    reference        VARCHAR(100),
    status           VARCHAR(30)   DEFAULT 'pending',  -- pending, completed, cancelled
    isBonus          BIT           DEFAULT 0,  -- flag for bonus payments
    bonusReason      VARCHAR(255),
    processedBy      INT           REFERENCES employees(employeeID),
    createdAt        DATETIME      DEFAULT GETDATE(),
    updatedAt        DATETIME      DEFAULT GETDATE()
);

-- ------------------------------------------------------------
--  INDEXES for performance
-- ------------------------------------------------------------
CREATE INDEX idx_bookings_employee    ON bookings(employeeID);
CREATE INDEX idx_bookings_customer    ON bookings(customerID);
CREATE INDEX idx_bookings_status      ON bookings(status);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_payments_invoice     ON payments(invoiceID);
CREATE INDEX idx_commissions_employee ON commissions(employeeID);
CREATE INDEX idx_commissions_status   ON commissions(status);
CREATE INDEX idx_customers_agent      ON customers(assignedAgentID);
CREATE INDEX idx_employees_role       ON employees(roleID);
