import { Router } from "express";
import { 
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from "../controllers/customerController.js";

const customers = Router();

customers.post("/", createCustomer);
customers.get("/", getAllCustomers);
customers.get("/:id", getCustomerById);
customers.put("/:id", updateCustomer);
customers.delete("/:id", deleteCustomer);

export default customers;