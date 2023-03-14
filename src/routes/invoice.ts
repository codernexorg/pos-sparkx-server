import express from "express";
import { createInvoice, getInvoices } from "../controller/invoice";
import ReturnProduct from "../controller/return";

const invoiceRoutes = express.Router();

invoiceRoutes.route('/').get(getInvoices).post(createInvoice)
// invoiceRoutes.route('/:id').patch(updateInvoice)
invoiceRoutes.route('/return').get(ReturnProduct.getReturnProduct).post(ReturnProduct.createReturnProduct)

export default invoiceRoutes