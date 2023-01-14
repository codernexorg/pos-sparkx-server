import express from 'express';
import { createBrand, getBrands, updateBrand } from '../controller/brand';

const brandRoutes = express.Router();

brandRoutes.route('/').post(createBrand).get(getBrands);

brandRoutes.route('/:id').patch(updateBrand);

export default brandRoutes;
