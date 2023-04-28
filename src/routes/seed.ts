import express from "express";
import { seed } from "../controller/seed";

const seedRoutes = express.Router();

seedRoutes.get('/seed', seed)

export default seedRoutes;