import { Request, Response } from 'express';
import Barcode from '../entities/barcode';
import Product from '../entities/product';
import dataSource from '../typeorm.config';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const settingBarcode: ControllerFn = async (req, res, _next) => {
  const barcodeItem = req.body as Barcode;
  const barcode = await Barcode.findOne({ where: { id: 1 } });
  let barcodeToSave;
  if (!barcode) {
    barcodeToSave = Barcode.create(barcodeItem);
    await barcodeToSave.save();
  } else {
    barcodeToSave = await dataSource
      .createQueryBuilder()
      .update(Barcode)
      .set(barcodeItem)
      .where('id =:id', { id: 1 })
      .execute();
  }
  return res.status(200).json(barcodeToSave);
};

export const getBarcode = async (_req: Request, res: Response) => {
  const barcode = await Barcode.findOne({ where: { id: 1 } });
  return res.status(200).json(barcode);
};

export const generateBarcode: ControllerFn = async (req, res, next) => {
  const { lotNumber } = req.body as Product;

  if (!lotNumber) {
    return next(new ErrorHandler('Invalid lot number', 404));
  }

  const products = await Product.find({
    where: { lotNumber },
    order: {
      itemCode: 'ASC'
    }
  });

  return res.status(200).json(products);
};
