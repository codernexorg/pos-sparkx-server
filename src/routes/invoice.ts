import express from "express";
import {createInvoice, deleteInvoice, getInvoices, updateInvoice} from "../controller/invoice";
import {sellMiddleware} from "../middleware/showroom";

const invoiceRoutes = express.Router()

invoiceRoutes.route('/').get(getInvoices).post(sellMiddleware, createInvoice)
invoiceRoutes.route('/:id').patch(updateInvoice).delete(deleteInvoice)

export default invoiceRoutes