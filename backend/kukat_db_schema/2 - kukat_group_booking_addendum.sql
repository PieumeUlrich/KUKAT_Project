-- ============================================================
--  KUKAT — Group Booking Addendum
--  Add this on top of kukat_schema.sql
--  Enables: named group members, share tracking, group invoicing
-- ============================================================

-- ------------------------------------------------------------
--  CHANGE 1: bookings.customerID becomes the LEAD customer
--  (no ALTER needed — existing column stays, semantics change)
--  bookings.customerID = group organizer / primary contact
--  bookings.numberOfTravellers = total headcount (can be more
--  than the number of registered customers, e.g. children)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
--  CHANGE 2: New junction table — booking_customers
--  Links any number of existing customers to one booking.
--  The lead customer from bookings.customerID should also
--  appear here with role = 'lead'.
-- ------------------------------------------------------------
CREATE TABLE booking_customers (
    bookingCustomerID  INT           PRIMARY KEY IDENTITY(1,1),
    bookingID          INT           NOT NULL REFERENCES bookings(bookingID) ON DELETE CASCADE,
    customerID         INT           NOT NULL REFERENCES customers(customerID),
    role               VARCHAR(30)   DEFAULT 'member',  -- 'lead', 'member'
    shareAmount        DECIMAL(12,2) DEFAULT 0.00,      -- their portion of totalAmount
    sharePaid          DECIMAL(12,2) DEFAULT 0.00,      -- how much they've paid so far
    shareStatus        VARCHAR(30)   DEFAULT 'unpaid',  -- unpaid, partial, paid
    notes              VARCHAR(500),
    createdAt          DATETIME      DEFAULT GETDATE(),
    updatedAt          DATETIME      DEFAULT GETDATE(),

    CONSTRAINT uq_booking_customer UNIQUE (bookingID, customerID)  -- no duplicate members
);

-- ------------------------------------------------------------
--  CHANGE 3: Group metadata on bookings table
--  Add two columns to the existing bookings table
-- ------------------------------------------------------------
ALTER TABLE bookings ADD
    isGroupBooking     BIT           DEFAULT 0,          -- flag for quick filtering
    groupName          VARCHAR(200)  NULL;                -- e.g. "Smith Family", "Johnson Corp"

-- ------------------------------------------------------------
--  INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_booking_customers_booking  ON booking_customers(bookingID);
CREATE INDEX idx_booking_customers_customer ON booking_customers(customerID);
CREATE INDEX idx_bookings_group             ON bookings(isGroupBooking);

-- ============================================================
--  HOW IT WORKS IN PRACTICE
-- ============================================================
--
--  Scenario: Sophie (agent) books a 4-person Europe tour for
--  the "Tremblay Family". Lead: customer #12 (Marc Tremblay).
--  Other members: customers #45, #67, #89.
--  Total invoice: $12,000. Each pays $3,000.
--
--  bookings row:
--    bookingID=55, employeeID=3, customerID=12,
--    isGroupBooking=1, groupName='Tremblay Family',
--    numberOfTravellers=4, basePrice=12000.00
--
--  booking_customers rows:
--    (55, 12, 'lead',   3000.00, 3000.00, 'paid')
--    (55, 45, 'member', 3000.00, 1500.00, 'partial')
--    (55, 67, 'member', 3000.00, 0.00,    'unpaid')
--    (55, 89, 'member', 3000.00, 3000.00, 'paid')
--
--  invoices row: one invoice tied to bookingID=55, total=12000
--  payments: can be made per-customer share or as lump sum
--
--  For individual (non-group) bookings:
--    isGroupBooking=0, booking_customers has 1 row (lead only)
--    behaviour is identical to the original schema
--
-- ============================================================
