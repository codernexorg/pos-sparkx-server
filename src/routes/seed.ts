import express from "express";
import { seed } from "../controller/seed";

export const seedRoutes = express.Router();

seedRoutes.get("/seed", seed);

export default seedRoutes;
