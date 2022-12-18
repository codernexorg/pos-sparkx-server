import Supplier from '../entities/supplier';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createSupplier: ControllerFn = async (req, res, next) => {
  const { supplierName, contactPersonName, contactPersonNumber } =
    req.body as Supplier;

  if (!supplierName || !contactPersonNumber || !contactPersonName) {
    return next(new ErrorHandler('Please provide required information', 404));
  }
  const isExist = await Supplier.findOne({ where: { contactPersonNumber } });
  if (isExist) {
    return next(
      new ErrorHandler('Supplier with this mobile number already exist', 404)
    );
  }

  const supplier = Supplier.create(req.body);

  await supplier.save();
  return res.status(200).json(supplier);
};
export const updateSupplier = async () => {};
export const deleteSupplier = async () => {};
export const getSupplier: ControllerFn = async (_req, res) => {
  const suppliers = await Supplier.find();
  return res.status(200).json(suppliers);
};
