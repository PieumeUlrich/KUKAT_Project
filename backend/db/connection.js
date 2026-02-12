// db/connection.js
import sql from "mssql";
import config from "./config.js";

async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

export default getConnection;