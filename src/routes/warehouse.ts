import express from 'express';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  updateWarehouse
} from '../controller/warehouse';
import { isManagerOrAdmin, isSuperAdmin } from '../middleware/isAuth';

export const warehouseRoutes = express.Router();

warehouseRoutes
  .route('/')
  .post(isSuperAdmin, createWarehouse)
  .get(getWarehouse);
warehouseRoutes
  .route('/:id')
  .patch(isManagerOrAdmin, updateWarehouse)
  .delete(isManagerOrAdmin, deleteWarehouse);

export default warehouseRoutes;
