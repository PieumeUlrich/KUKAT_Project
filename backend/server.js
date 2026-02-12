import express from "express";
import cors from "cors";


import dashboard from "./routes/dashboard.js";
import bookings from "./routes/bookings.js";
import customers from "./routes/customer.js";
import query from "./routes/query.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/dashboard", dashboard);
app.use("/api/booking", bookings);
app.use("/api/customer", customers);
app.use("/api/query", query);


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});