import express from 'express';
import { createTax, deleteTax, getTax } from '../controller/tax';

export const taxRoutes = express.Router();
taxRoutes.route('/').get(getTax).post(createTax);

taxRoutes.delete('/:id', deleteTax);

export default taxRoutes;
