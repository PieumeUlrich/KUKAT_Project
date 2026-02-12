import getConnection from "../db/connection.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    homePhone,
    businessPhone,
    birthDate,
    address,
    city,
    postalCode,
    province,
    country
  } = req.body;

  try {
    const pool = await getConnection();

    await pool.request()
      .input("firstName", firstName)
      .input("lastName", lastName)
      .input("email", email)
      .input("homePhone", homePhone)
      .input("businessPhone", businessPhone)
      .input("birthDate", birthDate)
      .input("address", address)
      .input("city", city)
      .input("postalCode", postalCode)
      .input("province", province)
      .input("country", country)
      .query(`
        INSERT INTO ULRICH.CUSTOMER 
        (FIRSTNAME, LASTNAME, EMAIL, HOMEPHONE, BUSINESSPHONE, BIRTHDATE, ADDRESS, CITY, POSTALCODE, PROVINCE, COUNTRY)
        VALUES 
        (@firstName, @lastName, @email, @homePhone, @businessPhone, @birthDate, @address, @city, @postalCode, @province, @country)
      `);

    res.json({ message: "Customer created successfully" });

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
      ORDER BY CUSTOMERID DESC
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
        SELECT * FROM ULRICH.CUSTOMER WHERE CUSTOMERID = @id
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
    firstName,
    lastName,
    email,
    homePhone,
    businessPhone,
    birthDate,
    address,
    city,
    postalCode,
    province,
    country
  } = req.body;

  try {
    const pool = await getConnection();

    await pool.request()
      .input("id", id)
      .input("firstName", firstName)
      .input("lastName", lastName)
      .input("email", email)
      .input("homePhone", homePhone)
      .input("businessPhone", businessPhone)
      .input("birthDate", birthDate)
      .input("address", address)
      .input("city", city)
      .input("postalCode", postalCode)
      .input("province", province)
      .input("country", country)
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

    res.json({ message: "Customer deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting customer");
  }
};