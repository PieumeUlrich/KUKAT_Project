import { Router } from "express";
import { loginUser,
        SignupUser,
        logoutUser
 } from "../controllers/authController.js";

const auth = Router();

auth.post("/login", loginUser);
auth.post("/signup", SignupUser);
auth.post("/logout", logoutUser);

export default auth;