import getConnection from "../db/connection.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {

  const getExistingCustomerIds = async () => {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
        SELECT customerId FROM ulrich.Customer
      `);
      const ids = result.recordset.map(row => row.customerId);
      return ids;
  }

  const getNextAvailableNumber = (existingNumbers, min = 1) => {
    const used = new Set(existingNumbers);
    let num = min;
    while (used.has(num)) {
      num++;
    }
    return num;
  }

  const id = getNextAvailableNumber(await getExistingCustomerIds());

  const {
    FIRSTNAME,
    LASTNAME,
    EMAIL,
    HOMEPHONE,
    BUSINESSPHONE,
    BIRTHDATE,
    ADDRESS,
    CITY,
    POSTALCODE,
    PROVINCE,
    COUNTRY
  } = req.body;

  try {
    const pool = await getConnection();

    await pool.request()
      .input("customerId", id)
      .input("firstName", FIRSTNAME)
      .input("lastName", LASTNAME)
      .input("email", EMAIL)
      .input("homePhone", HOMEPHONE)
      .input("businessPhone", BUSINESSPHONE)
      .input("birthDate", BIRTHDATE)
      .input("address", ADDRESS)
      .input("city", CITY)
      .input("postalCode", POSTALCODE)
      .input("province", PROVINCE)
      .input("country", COUNTRY)
      .query(`
        INSERT INTO ULRICH.CUSTOMER 
        (CUSTOMERID, FIRSTNAME, LASTNAME, EMAIL, HOMEPHONE, BUSINESSPHONE, BIRTHDATE, ADDRESS, CITY, POSTALCODE, PROVINCE, COUNTRY)
        VALUES 
        (@customerId, @firstName, @lastName, @email, @homePhone, @businessPhone, @birthDate, @address, @city, @postalCode, @province, @country)
      `);

    res.json({ message: "Customer created successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating customer");
  }
};


// GET ALL CUSTOMERS
export const getAllCustomers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT CUSTOMERID, FIRSTNAME, LASTNAME, EMAIL, HOMEPHONE, BUSINESSPHONE,
             CONVERT(varchar(10), BIRTHDATE, 23) AS BIRTHDATE, ADDRESS, CITY, POSTALCODE, PROVINCE, COUNTRY
      FROM ULRICH.CUSTOMER
      ORDER BY CUSTOMERID
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching customers");
  }
};


// GET ONE CUSTOMER
export const getCustomerById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", id)
      .query(`
          SELECT CUSTOMERID, FIRSTNAME, LASTNAME, EMAIL, HOMEPHONE, BUSINESSPHONE,
            CONVERT(varchar(10), BIRTHDATE, 23) AS BIRTHDATE, ADDRESS, CITY, POSTALCODE, PROVINCE, COUNTRY
          FROM ULRICH.CUSTOMER WHERE CUSTOMERID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching customer");
  }
};


// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    CUSTOMERID,
    FIRSTNAME,
    LASTNAME,
    EMAIL,
    HOMEPHONE,
    BUSINESSPHONE,
    BIRTHDATE,
    ADDRESS,
    CITY,
    POSTALCODE,
    PROVINCE,
    COUNTRY
  } = req.body;

  try {
    const pool = await getConnection();

    await pool.request()
      .input("id", parseInt(id))
      .input("firstName", FIRSTNAME)
      .input("lastName", LASTNAME)
      .input("email", EMAIL)
      .input("homePhone", HOMEPHONE)
      .input("businessPhone", BUSINESSPHONE)
      .input("birthDate", BIRTHDATE)
      .input("address", ADDRESS)
      .input("city", CITY)
      .input("postalCode", POSTALCODE)
      .input("province", PROVINCE)
      .input("country", COUNTRY)
      .query(`
        UPDATE ULRICH.CUSTOMER
        SET FIRSTNAME = @firstName,
            LASTNAME = @lastName,
            EMAIL = @email,
            HOMEPHONE = @homePhone,
            BUSINESSPHONE = @businessPhone,
            BIRTHDATE = @birthDate,
            ADDRESS = @address,
            CITY = @city,
            POSTALCODE = @postalCode,
            PROVINCE = @province,
            COUNTRY = @country
        WHERE CUSTOMERID = @id
      `);

      res.json({ message: "Customer updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating customer");
  }
};


// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM ULRICH.CUSTOMER WHERE CUSTOMERID = @id
      `);

    res.json({ message: "Customer deleted successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting customer");
  }
};