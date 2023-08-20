import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import Tax from "../entities/tax";
import appDataSource from "../typeorm.config";
import Business from "../entities/business";

export const createTax: ControllerFn = async (req, res, next) => {
  if (!req.body?.taxName) {
    return next(new ErrorHandler("Tax & Tax Name Required", 404));
  }
  const tax = new Tax();

  tax.taxName = req.body?.taxName;

  tax.tax = req.body?.tax;

  await tax.save();
  res.status(201).json(tax);
};

export const getTax: ControllerFn = async (_req, res, _next) => {
  res.status(200).json(await Tax.find());
};

export const deleteTax: ControllerFn = async (_req, res, _next) => {
  const { id } = _req.params;

  if (!id) {
    return _next(new ErrorHandler("Tax id not found", 404));
  }

  const existingTax = await appDataSource.getRepository(Tax).findOne({
    where: {
      id,
    },
  });

  if (!existingTax) {
    return _next(new ErrorHandler("Tax not found with corresponding id", 404));
  }

  const business = await appDataSource.getRepository(Business).find();

  business[0].defaultTax = 0;

  await business[0].save();

  await existingTax.remove();

  res.status(200).json(await appDataSource.getRepository(Tax).find());
};
