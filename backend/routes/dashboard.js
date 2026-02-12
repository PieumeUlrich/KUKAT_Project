// routes/dashboard.js
import { Router } from "express";
import { getDashboardMetrics,
        getLastBookings,
        getLastTransactions } from "../controllers/dashboardController.js";

const dashboard = Router();

dashboard.get("/", getDashboardMetrics);
dashboard.get("/last-bookings", getLastBookings);
dashboard.get("/last-transactions", getLastTransactions);

export default dashboard;