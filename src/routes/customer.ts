import express from 'express';
import multer from 'multer';
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  importCustomers,
  updateCustomer
} from '../controller/customer';
import { isManagerOrAdmin } from '../middleware/isAuth';

export const customerRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

customerRoutes.route('/').get(getCustomers).post(createCustomer);
customerRoutes
  .route('/:id')
  .delete(isManagerOrAdmin, deleteCustomer)
  .patch(isManagerOrAdmin, updateCustomer);
customerRoutes.post('/import', upload.single('file'), importCustomers);
export default customerRoutes;
