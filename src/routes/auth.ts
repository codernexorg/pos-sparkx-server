import express from "express";
import { loginUser, logoutUser } from "../controller/user";

export const authRoutes = express.Router();

authRoutes.post("/login", loginUser);
authRoutes.post("/logout", logoutUser);

export default authRoutes;
