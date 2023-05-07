import express from "express";
import {
  createInvoice,
  getInvoices,
  resetHoldInvoice,
  updateInvoice,
} from "../controller/invoice";
import { createReturnProduct, getReturnProduct } from "../controller/return";

export const invoiceRoutes = express.Router();

invoiceRoutes.route("/").get(getInvoices).post(createInvoice);
invoiceRoutes.route("/:id").patch(updateInvoice);
invoiceRoutes.route("/return").get(getReturnProduct).post(createReturnProduct);
invoiceRoutes.route("/reset-hold/:id").patch(resetHoldInvoice);

export default invoiceRoutes;
