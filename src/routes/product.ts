import express from 'express';
import {
  createCat,
  createProduct,
  createProductGroup
} from '../controller/productController';
import { commonAuth, isAuth } from '../middleware/isAuth';

const productRoutes = express.Router();

productRoutes.route('/group').post(isAuth, commonAuth, createProductGroup);
productRoutes.route('/category').post(isAuth, commonAuth, createCat);
productRoutes.route('/').post(isAuth, commonAuth, createProduct);
export default productRoutes;
