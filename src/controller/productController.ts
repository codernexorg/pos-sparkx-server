import {NextFunction, Request, Response} from 'express';
import moment from 'moment';
import xlsx from 'xlsx';
import Product from '../entities/product';
import ProductGroup from '../entities/productGroup';
import dataSource from '../typeorm.config';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createProductGroup: ControllerFn = async (req, res, next) => {
    const {productCategory, productCode, productName} =
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
        let itemMCode = parseInt(itemCode);
        for (let i = 0; i < totalItem; i++) {
            productArr.push({
                ...req.body,
                itemCode: itemMCode.toString().padStart(10, '0'),
                productCode: productCode?.productCode,
                grossProfit: (sellPrice - (transportationCost + unitCost)).toString(),
                grossMargin: (
                    sellPrice -
                    (transportationCost + unitCost) -
                    (transportationCost + unitCost) / sellPrice -
                    (transportationCost + unitCost)
                ).toString(),
                unitTotalCost: unitCost + transportationCost
            });
            itemMCode = itemMCode + 1;
        }

        productArr.every(async product => {
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
            invoiceDate: moment(req.body.invoiceDate).toDate(),
            productCode: productCode?.productCode,
            unitTotalCost: transportationCost + unitCost,
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
    const qb = dataSource
        .getRepository(Product)
        .createQueryBuilder('product')
        .orderBy('"itemCode"', 'ASC')
        .take();

    if (req.query.cursor) {
        console.log('Entering Cursor');
        qb.where('"itemCode" >= :cursor', {
            cursor: parseInt(req.query.cursor)
        });
    }

    const product = await qb.getMany();

    res.status(200).json({
        product: product,
        hasMore: false
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

    products.every(async (product: Product) => {
        ProductGroup.findOne({
            where: {productName: product['productGroup']}
        }).then(async value => {
            const productToSave = Product.create({
                ...product,
                invoiceDate: moment(req.body.invoiceDate).toDate(),
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
                totalItem: products.length,
                unitCost: product.unitCost + product.transportationCost
            });
            await productToSave.save();
        });
    });

    return res.status(200).json(products);
};

export const importProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const file = req.file;

    if (!file) {
        return next(new ErrorHandler('No File Found', 400));
    }
    const workbook = xlsx.read(file?.buffer, {type: 'buffer'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: Product[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
        return next(new ErrorHandler('No Data Found', 400));
    }
    if (
        !data[0].sellPrice ||
        !data[0].unitCost ||
        !data[0].itemCode ||
        !data[0].productGroup ||
        !data[0].whName ||
        !data[0].showroomName ||
        !data[0].lotNumber
    ) {
        return next(new ErrorHandler('Required Information Missing', 400));
    }
    data.every(async product => {
        const productToSave = Product.create({
            ...product,
            invoiceDate: moment(product.invoiceDate).toDate(),
            itemCode: parseInt(product.itemCode).toString().padStart(10, '0'),
            grossProfit: (product.sellPrice - product.unitCost).toString(),
            grossMargin: (
                product.sellPrice -
                product.unitCost -
                product.unitCost / product.sellPrice -
                +product.unitCost
            ).toString(),
            unitTotalCost: product.transportationCost
                ? product.unitCost + product.transportationCost
                : product.unitCost,

            deliveryDate: moment(product.deliveryDate).toDate()
        });

        await productToSave.save();
    });

    res.status(200).json({message: 'Data imported successfully', data: data});
};
