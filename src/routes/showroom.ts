import express from 'express';
import {
  createShowroom,
  deleteShowroom,
  getShowroom,
  updateShowroom
} from '../controller/shoroom';
import { isManagerOrAdmin, isSuperAdmin } from '../middleware/isAuth';

export const showroomRoutes = express.Router();

showroomRoutes.route('/').post(isSuperAdmin, createShowroom).get(getShowroom);
showroomRoutes
  .route('/:id')
  .patch(isManagerOrAdmin, updateShowroom)
  .delete(isManagerOrAdmin, deleteShowroom);

export default showroomRoutes;
