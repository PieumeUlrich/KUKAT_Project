import { Router } from "express";
import { getBookingsByDestination, getDestinations } from "../controllers/bookingController.js";

const bookings = Router();

bookings.get("/", getBookingsByDestination);
bookings.get("/destination", getDestinations);

export default bookings;