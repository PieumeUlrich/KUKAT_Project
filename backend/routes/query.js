import { Router } from "express";
import { runQuery } from "../controllers/queryController.js";

const query = Router();

query.post("/", runQuery);

export default query;