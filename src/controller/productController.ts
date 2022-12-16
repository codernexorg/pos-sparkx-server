import Product from '../entities/product';
import ProductGroup from '../entities/productGroup';
import dataSource from '../typeorm.config';
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

export const createSingleProduct: ControllerFn = async (req, res, next) => {
  const {
    itemCode,
    productGroup,
    invoiceNumber,
    unitCost,
    sellPrice,
    supplierName,
    transportationCost,
    productCode,
    lotNumber,
    totalItem
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
    !lotNumber ||
    !totalItem
  ) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }
  const productArr: Product[] | null = [];
  if (totalItem > 1) {
    let itemMCode = itemCode;
    for (let i = 0; i < totalItem; i++) {
      productArr.push({ ...req.body, itemCode: itemMCode });
      itemMCode = itemMCode + 1;
    }
  }
  // console.log(productArr);

  productArr.forEach(async product => {
    const productToSave = Product.create(product);

    await productToSave.save();
  });

  return res.json(productArr);
};

export const getProducts: ControllerFn = async (req, res) => {
  const queryLimit = req.params.limit || 100;
  const currentLimit = Math.min(50, queryLimit);

  const qb = dataSource
    .getRepository(Product)
    .createQueryBuilder('product')
    .orderBy('"itemCode"', 'ASC')
    .take(currentLimit + 1);

  if (req.query.cursor) {
    console.log('Entering Cursor');
    qb.where('"itemCode" >= :cursor', {
      cursor: parseInt(req.query.cursor)
    });
  }

  const product = await qb.getMany();

  res.status(200).json({
    product: product.slice(0, currentLimit),
    hasMore: product.length === currentLimit + 1
  });
};
