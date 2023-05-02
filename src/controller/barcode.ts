import { Request, Response } from "express";
import Barcode from "../entities/barcode";
import BarcodeDefault from "../entities/barcodeDefault";
import Product from "../entities/product";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const createBarcode: ControllerFn = async (req, res, _next) => {
  try {
    if (!req.body.name) {
      return _next(new ErrorHandler("Barcode Name is required", 404));
    }
    const barcode = Barcode.create(req.body);

    await barcode.save();

    return res.status(200).json(barcode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBarcode = async (_req: Request, res: Response) => {
  const barcode = await Barcode.find();
  return res.status(200).json(barcode);
};

export const setDefaultBarcode: ControllerFn = async (req, res, _next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return _next(new ErrorHandler("No barcode id", 400));
    }
    const barcode = await Barcode.findOne({ where: { id } });

    if (!barcode) {
      return _next(new ErrorHandler("No barcode found", 400));
    }

    const defaultBarcode = await BarcodeDefault.find();

    if (!defaultBarcode.length) {
      const defaultBarcode = new BarcodeDefault();

      defaultBarcode.barcodeId = barcode.id;

      await defaultBarcode.save();

      res.status(200).json(defaultBarcode);
    } else {
      defaultBarcode[0].barcodeId = barcode.id;
      await defaultBarcode[0].save();
      res.status(200).json(defaultBarcode[0]);
    }
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const generateBarcode: ControllerFn = async (req, res, next) => {
  const { startItemCode, endItemCode } = req.body as {
    startItemCode: string;
    endItemCode: string;
  };

  if (!startItemCode && !endItemCode) {
    return next(new ErrorHandler("Invalid Start & End Item Code", 404));
  }

  const products = await dataSource
    .getRepository(Product)
    .createQueryBuilder("product")
    .where("product.itemCode>=:startItemCode", { startItemCode })
    .andWhere("product.itemCode<=:endItemCode", { endItemCode })
    .getMany();

  return res.status(200).json(products);
};

export const updateBarcode: ControllerFn = async (req, res, next) => {
  const { id } = req.params;
  const barcode = await Barcode.findOne({ where: { id } });
  if (!barcode) {
    return next(new ErrorHandler("No barcode found", 404));
  }
  Object.assign(barcode, req.body);

  await barcode.save();
  res.status(200).json(barcode);
};

export const deleteBarcode: ControllerFn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const barcode = await Barcode.findOne({ where: { id } });
    const defaultBarcode = await BarcodeDefault.find();
    if (barcode && defaultBarcode[0].barcodeId === barcode.id) {
      return next(
        new ErrorHandler("You are not able to delete default barcode", 404)
      );
    }
    if (!barcode) {
      return next(new ErrorHandler("No barcode found", 404));
    }
    await barcode.remove();
    res.status(200).json(await Barcode.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDefaultBarcode: ControllerFn = async (_req, res, _next) => {
  const defaultBarcode = await BarcodeDefault.find();
  res.status(200).json(defaultBarcode[0]);
};
