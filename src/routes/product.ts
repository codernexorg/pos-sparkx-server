import express from 'express';
import { createCat, getCat } from '../controller/category';
import {
  createProductGroup,
  createSingleProduct,
  getProducts
} from '../controller/productController';

const productRoutes = express.Router();
productRoutes.route('/group').post(createProductGroup).get();

productRoutes.route('/category').post(createCat).get(getCat);

productRoutes.route('/').post(createSingleProduct).get(getProducts);
export default productRoutes;
