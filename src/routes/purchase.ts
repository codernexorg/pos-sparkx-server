import express from "express";
import { getPurchase } from "../controller/purchase";

export const purchaseRoutes = express.Router();

purchaseRoutes.route("/").get(getPurchase);

export default purchaseRoutes;
