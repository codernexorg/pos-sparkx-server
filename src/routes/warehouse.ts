import express from 'express';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  updateWarehouse
} from '../controller/warehouse';

const warehouseRoutes = express.Router();

warehouseRoutes.route('/').post(createWarehouse).get(getWarehouse);
warehouseRoutes.route('/:id').patch(updateWarehouse).delete(deleteWarehouse);

export default warehouseRoutes;
