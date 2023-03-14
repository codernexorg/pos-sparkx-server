import express from 'express';
import {
    createBarcode,
    deleteBarcode,
    generateBarcode,
    getBarcode,
    getDefaultBarcode,
    setDefaultBarcode,
    updateBarcode
} from '../controller/barcode';

const barcodeRoutes = express.Router();

barcodeRoutes.route('/').get(getBarcode).post(createBarcode);
barcodeRoutes.route('/:id').patch(updateBarcode).delete(deleteBarcode);
barcodeRoutes.route('/default').get(getDefaultBarcode)
barcodeRoutes.route('/default/:id').post(setDefaultBarcode)
barcodeRoutes.route('/generate').post(generateBarcode);

export default barcodeRoutes;
