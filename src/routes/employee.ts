import express from 'express'
import {createEmp, deleteEmployee, getEmployee, updateEmployee} from "../controller/employee";
import {isSuperAdmin} from "../middleware/isAuth";

const employeeRoutes = express.Router()

employeeRoutes.route('/').get(getEmployee).post(isSuperAdmin, createEmp)
employeeRoutes.route('/:id').patch(isSuperAdmin, updateEmployee).delete(isSuperAdmin, deleteEmployee)
export default employeeRoutes