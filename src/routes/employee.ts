import express from 'express';
import {
  createEmp,
  deleteEmployee,
  getEmployee,
  updateEmployee
} from '../controller/employee';
import { isManagerOrAdmin } from '../middleware/isAuth';

export const employeeRoutes = express.Router();

employeeRoutes.route('/').get(getEmployee).post(isManagerOrAdmin, createEmp);
employeeRoutes
  .route('/:id')
  .patch(isManagerOrAdmin, updateEmployee)
  .delete(isManagerOrAdmin, deleteEmployee);
export default employeeRoutes;
