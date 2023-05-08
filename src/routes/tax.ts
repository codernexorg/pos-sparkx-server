import express from "express";
import { createTax, getTax } from "../controller/tax";

export const taxRoutes = express.Router();
taxRoutes.route("/").get(getTax).post(createTax);

export default taxRoutes;
