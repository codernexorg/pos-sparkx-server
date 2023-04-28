import express from 'express'
import multer from "multer";
import {createCustomer, deleteCustomer, getCustomers, importCustomers, updateCustomer} from "../controller/customer";

const customerRoutes = express.Router()
const upload = multer({storage: multer.memoryStorage()});

customerRoutes.route('/').get(getCustomers).post(createCustomer)
customerRoutes.route('/:id').delete(deleteCustomer).patch(updateCustomer)
customerRoutes.post('/import', upload.single('file'), importCustomers)
export default customerRoutes