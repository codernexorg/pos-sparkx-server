import express from 'express';
import { createCat, getCat } from '../controller/category';
import {
  createProductGroup,
  createSingleProduct,
  getProductGroup,
  getProducts
} from '../controller/productController';

const productRoutes = express.Router();
productRoutes.route('/group').post(createProductGroup).get(getProductGroup);

productRoutes.route('/category').post(createCat).get(getCat);

productRoutes.route('/single').post(createSingleProduct);
productRoutes.get('/', getProducts);
export default productRoutes;
