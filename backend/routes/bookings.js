import { Router } from "express";
import { getBookingsByDestination, getDestinations } from "../controllers/bookingController.js";
import { requireAuth } from "../authServices/authMiddleware.js";

const bookings = Router();

bookings.get("/", getBookingsByDestination);
bookings.get("/destination", getDestinations);
bookings.get('/trips', requireAuth, (req, res) => {
  // req.user has AccountId, role, etc.
});


export default bookings;