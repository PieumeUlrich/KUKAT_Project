import getConnection from "../db/connection.js";

export const runQuery = async (req, res) => {
  const { query } = req.body;

  // Basic safety check
  const forbidden = ["DROP", "DELETE", "ALTER", "TRUNCATE"];
  const upper = query.toUpperCase();

  if (forbidden.some((word) => upper.includes(word))) {
    return res.status(400).json({ error: "Dangerous queries are not allowed" });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request().query(query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error running query");
  }
};