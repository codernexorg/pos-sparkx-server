import express from 'express'
import {createCustomer, deleteCustomer, getCustomers, updateCustomer} from "../controller/customer";

const customerRoutes = express.Router()

customerRoutes.route('/').get(getCustomers).post(createCustomer)
customerRoutes.route('/:id').delete(deleteCustomer).patch(updateCustomer)
export default customerRoutes