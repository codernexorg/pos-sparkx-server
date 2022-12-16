import express from 'express';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  updateSupplier
} from '../controller/supplier';

const supplierRoutes = express.Router();

supplierRoutes.route('/').post(createSupplier).get(getSupplier);
supplierRoutes.route('/:id').patch(updateSupplier).delete(deleteSupplier);

export default supplierRoutes;
