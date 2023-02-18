import express from "express";
import {seed} from "../controller/seed";

const seedRoutes = express.Router();

seedRoutes.post('/seed', seed)

export default seedRoutes;