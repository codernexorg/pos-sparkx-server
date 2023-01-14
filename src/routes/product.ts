import express from 'express';
import multer from 'multer';
import { createCat, getCat } from '../controller/category';
import {
  createMultipleProducts,
  createProductGroup,
  createSingleProduct,
  getProductGroup,
  getProducts,
  importProduct
} from '../controller/productController';

const upload = multer({ storage: multer.memoryStorage() });
const productRoutes = express.Router();
productRoutes.route('/group').post(createProductGroup).get(getProductGroup);

productRoutes.route('/category').post(createCat).get(getCat);

productRoutes.route('/single').post(createSingleProduct);
productRoutes.route('/multiple').post(createMultipleProducts);
productRoutes.post('/import', upload.single('file'), importProduct);
productRoutes.get('/', getProducts);
export default productRoutes;
