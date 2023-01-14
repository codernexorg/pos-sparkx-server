import express from 'express';
import { createBrand, getBrands } from '../controller/brand';

const brandRoutes = express.Router();

brandRoutes.route('/').post(createBrand).get(getBrands);

export default brandRoutes;
