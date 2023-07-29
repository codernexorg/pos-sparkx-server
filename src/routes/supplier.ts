import express from 'express';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  importSupplier,
  updateSupplier
} from '../controller/supplier';
import multer from 'multer';
import { isManagerOrAdmin } from '../middleware/isAuth';

export const supplierRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

supplierRoutes
  .route('/')
  .post(isManagerOrAdmin, createSupplier)
  .get(getSupplier);
supplierRoutes.post('/import', upload.single('file'), importSupplier);
supplierRoutes
  .route('/:id')
  .patch(isManagerOrAdmin, updateSupplier)
  .delete(isManagerOrAdmin, deleteSupplier);
export default supplierRoutes;
