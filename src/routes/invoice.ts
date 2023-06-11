import express from "express";
import { createInvoice, getInvoices } from "../controller/invoice";
import {
  createHoldInvoice,
  getHold,
  removeHold,
} from "../controller/holdInvoice";

export const invoiceRoutes = express.Router();

invoiceRoutes.route("/").get(getInvoices).post(createInvoice);

invoiceRoutes.route("/hold").get(getHold).post(createHoldInvoice);
invoiceRoutes.route("/hold/:id").delete(removeHold);

export default invoiceRoutes;
