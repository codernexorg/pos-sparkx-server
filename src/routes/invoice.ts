import express from "express";
import {createInvoice, deleteInvoice, getInvoices, updateInvoice} from "../controller/invoice";
import {isSuperAdmin} from "../middleware/isAuth";

const invoiceRoutes = express.Router()

invoiceRoutes.route('/').get(getInvoices).post(createInvoice)
invoiceRoutes.route('/:id').patch(updateInvoice).delete(isSuperAdmin, deleteInvoice)

export default invoiceRoutes