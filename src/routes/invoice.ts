import express from "express";
import {createInvoice, deleteInvoice, getInvoices, updateInvoice} from "../controller/invoice";

const invoiceRoutes = express.Router()

invoiceRoutes.route('/').get(getInvoices).post(createInvoice)
invoiceRoutes.route('/:id').patch(updateInvoice).delete(deleteInvoice)

export default invoiceRoutes