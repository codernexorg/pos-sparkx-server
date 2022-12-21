import express from 'express';
import {
  generateBarcode,
  getBarcode,
  settingBarcode
} from '../controller/barcode';

const barcodeRoutes = express.Router();

barcodeRoutes.route('/').get(getBarcode).post(settingBarcode);
barcodeRoutes.route('/generate').post(generateBarcode);

export default barcodeRoutes;
