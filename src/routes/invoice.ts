import express from "express";
import { createInvoice, getInvoices } from "../controller/invoice";
import {
  createHoldInvoice,
  getHold,
  removeHold,
} from "../controller/holdInvoice";
import {
  createReturnProduct,
  getReturns,
} from "../controller/returnController";

export const invoiceRoutes = express.Router();

invoiceRoutes.route("/").get(getInvoices).post(createInvoice);

invoiceRoutes.route("/hold").get(getHold).post(createHoldInvoice);
invoiceRoutes.route("/hold/:id").delete(removeHold);
invoiceRoutes.route("/return").post(createReturnProduct).get(getReturns);

export default invoiceRoutes;
