import Brand from '../entities/brand';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const getBrands: ControllerFn = async (_req, res, _next) => {
  const brands = await Brand.find();

  res.status(200).json(brands);
};

export const createBrand: ControllerFn = async (req, res, next) => {
  const { name } = req.body as Brand;

  if (!name) {
    return next(new ErrorHandler('Please provide a brand name', 404));
  }

  const brand = Brand.create(req.body);

  await brand.save();

  res.status(201).json(brand);
};
