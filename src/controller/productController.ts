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
  const isExist = await ProductGroup.findOne({
    where: {
      productCode
    }
  });
  if (isExist) {
    return next(new ErrorHandler('Product Group Already Exist', 404));
  }
  const productGroup = ProductGroup.create({
    ...req.body,
    productCode: productCode
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
    !lotNumber ||
    !totalItem
  ) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }
  const productArr: Product[] | null = [];
  const productCode = await ProductGroup.findOne({
    where: {
      productName: productGroup
    }
  });
  if (totalItem > 1) {
    let itemMCode = itemCode;
    for (let i = 0; i < totalItem; i++) {
      itemMCode = itemMCode + 1;
      productArr.push({
        ...req.body,
        itemCode: itemMCode,
        productCode: productCode?.productCode,
        grossProfit: (sellPrice - (transportationCost + unitCost)).toString(),
        grossMargin: (
          sellPrice -
          (transportationCost + unitCost) -
          (transportationCost + unitCost) / sellPrice -
          (transportationCost + unitCost)
        ).toString()
      });
    }

    productArr.forEach(async product => {
      const productToSave = Product.create({
        ...product,
        invoiceDate: new Date(product.invoiceDate)
      });

      await productToSave.save();
    });
    return res.json(productArr);
  } else if (totalItem === 1) {
    const productToSave = Product.create({
      ...req.body,
      invoiceDate: new Date(req.body.invoiceDate),
      productCode: productCode?.productCode,
      grossProfit: (sellPrice - (transportationCost + unitCost)).toString(),
      grossMargin: (
        sellPrice -
        (transportationCost + unitCost) -
        (transportationCost + unitCost) / sellPrice -
        (transportationCost + unitCost)
      ).toString()
    });
    await productToSave.save();
    return res.json(productToSave);
  }
  return; // console.log(productArr);
};

export const getProducts: ControllerFn = async (req, res) => {
  const queryLimit = req.query.limit || 100;
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

export const getProductGroup: ControllerFn = async (_req, res) => {
  const productGroup = await ProductGroup.find();

  res.status(200).json(productGroup);
};

export const createMultipleProducts: ControllerFn = async (req, res, next) => {
  const products = req.body as Product[];

  if (products.length === 0) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  } else if (
    !products[0].invoiceDate ||
    !products[0].invoiceNumber ||
    !products[0].sellPrice ||
    !products[0].itemCode
  ) {
    return next(new ErrorHandler('Please Enter Required Information', 404));
  }

  products.forEach(async (product: Product) => {
    ProductGroup.findOne({
      where: { productName: product['productGroup'] }
    }).then(async value => {
      const productToSave = Product.create({
        ...product,
        invoiceDate: new Date(product.invoiceDate),
        productCode: value?.productCode,
        grossProfit: (
          product.sellPrice -
          (product.transportationCost + product.unitCost)
        ).toString(),
        grossMargin: (
          product.sellPrice -
          (product.transportationCost + product.unitCost) -
          (product.transportationCost + product.unitCost) / product.sellPrice -
          (product.transportationCost + product.unitCost)
        ).toString(),
        totalItem: products.length
      });
      await productToSave.save();
    });
  });

  return res.status(200).json(products[0]);
};
