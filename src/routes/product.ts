import express from 'express';
import multer from 'multer';
import { createCat, getCat } from '../controller/category';
import {
  addTaglessProduct,
  createMultipleProducts,
  createProductGroup,
  createSingleProduct,
  getProductByShowroom,
  getProductGroup,
  getProducts,
  getTransferHistory,
  importProduct,
  importProductGroup,
  transferProduct,
  updateBulkProduct,
  updateProduct
} from '../controller/productController';
import { isManagerOrAdmin } from '../middleware/isAuth';

const upload = multer({ storage: multer.memoryStorage() });
export const productRoutes = express.Router();
productRoutes
  .route('/group')
  .post(isManagerOrAdmin, createProductGroup)
  .get(getProductGroup);
productRoutes
  .route('/group/import')
  .post(upload.single('file'), importProductGroup);

productRoutes.route('/category').post(isManagerOrAdmin, createCat).get(getCat);

productRoutes.route('/single').post(isManagerOrAdmin, createSingleProduct);
productRoutes.route('/multiple').post(isManagerOrAdmin, createMultipleProducts);
productRoutes.post('/import', upload.single('file'), importProduct);
productRoutes.get('/', getProducts);
productRoutes.post('/tagless', addTaglessProduct);
productRoutes
  .route('/transfer')
  .post(isManagerOrAdmin, transferProduct)
  .get(isManagerOrAdmin, getTransferHistory);
productRoutes.patch('/:id', isManagerOrAdmin, updateProduct);

productRoutes.post('/update', upload.single('file'), updateBulkProduct);

productRoutes.get('/filter', getProductByShowroom);

export default productRoutes;
