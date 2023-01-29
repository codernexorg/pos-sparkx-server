import express from 'express';
import multer from 'multer';
import {createCat, getCat} from '../controller/category';
import {
  createMultipleProducts,
  createProductGroup,
  createSingleProduct,
  getProductGroup,
  getProducts,
  importProduct,
  transferProduct
} from '../controller/productController';
import {isSuperAdmin} from "../middleware/isAuth";

const upload = multer({storage: multer.memoryStorage()});
const productRoutes = express.Router();
productRoutes.route('/group').post(isSuperAdmin, createProductGroup).get(getProductGroup);

productRoutes.route('/category').post(isSuperAdmin, createCat).get(getCat);

productRoutes.route('/single').post(isSuperAdmin, createSingleProduct);
productRoutes.route('/multiple').post(isSuperAdmin, createMultipleProducts);
productRoutes.post('/import', upload.single('file'), importProduct);
productRoutes.get('/', getProducts);
productRoutes.post('/transfer', isSuperAdmin, transferProduct);
export default productRoutes;
