import Category from '../entities/category';
import Product from '../entities/product';
import ProductGroup from '../entities/productGroup';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createProductGroup: ControllerFn = async (req, res, next) => {
  const { productCategory, productCode, productName } =
    req.body as ProductGroup;

  if (!productCategory || !productCode || !productName) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }
  const isExist = await Product.findOne({
    where: {
      productCode
    }
  });
  if (isExist) {
    return next(new ErrorHandler('Product Group Already Exist', 404));
  }
  const productGroup = ProductGroup.create({
    ...req.body,
    productCode: Number(productCode)
  });

  await productGroup.save();

  return res.status(201).json(productGroup);
};

export const createProduct: ControllerFn = async (req, res, next) => {
  const {
    itemCode,
    productGroup,
    invoiceNumber,
    unitCost,
    sellPrice,
    supplierName,
    transportationCost,
    productCode,
    lotNumber
  } = req.body as Product;

  if (
    !itemCode ||
    !productGroup ||
    !invoiceNumber ||
    !unitCost ||
    !sellPrice ||
    !supplierName ||
    !transportationCost ||
    !productCode ||
    !lotNumber
  ) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }

  const product = Product.create(req.body);

  await product.save();

  return res.status(201).json(product);
};

export const createCat: ControllerFn = async (req, res, next) => {
  const { categoryName } = req.body as Category;

  if (!categoryName) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }

  const isExist = await Category.findOne({
    where: { categoryName },
    relations: {
      user: true
    }
  });

  if (isExist) {
    return next(new ErrorHandler('Category Already Exist', 404));
  }
  const category = Category.create(req.body);

  await category.save();

  res.status(201).json(category);
};

export const getProducts: ControllerFn = async (_req, res) => {
  const product = await Product.find();

  res.status(200).json(product);
};
