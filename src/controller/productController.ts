import {NextFunction, Request, Response} from 'express';
import moment from 'moment';
import xlsx from 'xlsx';
import Product from '../entities/product';
import ProductGroup from '../entities/productGroup';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';
import {Showroom, TransferProduct} from "../entities";

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
                itemCode: String(itemMCode.toString().padStart(10, '0')),
                productCode: String(productCode?.productCode),
                grossProfit: String(transportationCost ? (sellPrice - (transportationCost + unitCost)).toString() : (sellPrice - unitCost).toString()),
                grossMargin: String(transportationCost ? (
                    (sellPrice -
                        (transportationCost + unitCost)) / sellPrice * 100
                ).toString() : (
                    (sellPrice - unitCost) / sellPrice * 100
                ).toString()),
                unitTotalCost: Number(transportationCost ? unitCost + transportationCost : unitCost)
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
    } else {
        const productToSave = Product.create({
            ...req.body,
            invoiceDate: moment(req.body.invoiceDate).toDate(),
            productCode: productCode?.productCode,
            unitTotalCost: Number(transportationCost ? unitCost + transportationCost : unitCost),
            grossProfit: String(transportationCost ? (sellPrice - (transportationCost + unitCost)).toString() : (sellPrice - unitCost).toString()),
            grossMargin: String(transportationCost ? (
                (sellPrice -
                    (transportationCost + unitCost)) / sellPrice * 100
            ).toString() : (
                (sellPrice - unitCost) / sellPrice * 100
            ).toString()),
        });

        await productToSave.save();
        return res.json([productToSave]);
    }
};

export const getProducts: ControllerFn = async (req, res, next) => {
    if (req.showroomId) {
        const showroom = await Showroom.findOne({where: {id: req.showroomId}});
        if (!showroom) {
            return next(new ErrorHandler("Unexpected Result", 404))
        }
        const product = await Product.find({
            order: {
                itemCode: 'ASC'
            }, where: {showroomName: showroom.showroomName}
        })
        console.log(product.length)
        res.status(200).json({
            product: product,
            hasMore: false
        });
    } else {
        const product = await Product.find({
            order: {
                itemCode: 'ASC'
            }
        })
        res.status(200).json({
            product: product,
            hasMore: false
        });
    }
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
                productCode: String(value?.productCode),
                grossProfit: String((
                    product.sellPrice -
                    (product.transportationCost + product.unitCost)
                ).toString()),
                grossMargin: String((
                    product.sellPrice -
                    (product.transportationCost + product.unitCost) -
                    (product.transportationCost + product.unitCost) / product.sellPrice -
                    (product.transportationCost + product.unitCost)
                ).toString()),
                totalItem: products.length,
                unitCost: Number(product.unitCost + product.transportationCost)
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
            itemCode: String(parseInt(product.itemCode).toString().padStart(10, '0')),
            grossProfit: String((product.sellPrice - product.unitCost).toString()),
            grossMargin: String((
                product.sellPrice -
                product.unitCost -
                product.unitCost / product.sellPrice -
                +product.unitCost
            ).toString()),
            unitTotalCost: Number(product.transportationCost
                ? product.unitCost + product.transportationCost
                : product.unitCost),

            deliveryDate: moment(product.deliveryDate).toDate(),
            sellPrice: Number(product.sellPrice),
        });

        await productToSave.save();
    });

    res.status(200).json({message: 'Data imported successfully', data: data});
};


export const transferProduct: ControllerFn = async (req, res, next) => {
    const {
        showroomName,
        lotNumber,
        whName,
        itemCodes
    } = req.body as { showroomName: string, lotNumber: string, whName: string, itemCodes: { itemCode: string }[] }

    if (!showroomName || !whName || !lotNumber || !itemCodes.length) {
        return next(new ErrorHandler("Please Provide All Information", 404))
    }
    try {
        const productArr: Product[] = []

        for (const itemCode of itemCodes) {
            const product = await Product.findOne({where: {itemCode: itemCode.itemCode}})

            if (product) {
                productArr.push(product)

                product.whName = showroomName
                product.showroomName = showroomName
                await product.save()
            }
        }
        const transferData = new TransferProduct()
        transferData.transferredLot = lotNumber
        transferData.prevLocation = whName
        transferData.currentLocation = showroomName
        transferData.productCount = itemCodes.length
        transferData.transferredProducts = productArr

        await transferData.save()
        res.status(200).json("Product Transferred Successfully")
    } catch (e) {
        console.log(e)
        res.status(400).json({success: false, message: e.message})
    }
}

export const getTransferHistory: ControllerFn = async (_req, res) => {
    res.status(200).json(await TransferProduct.find())
}

export const importProductGroup: ControllerFn = async (req, res, next) => {
    const file = req.file
    if (!file) {
        return next(new ErrorHandler('No File Found', 400));
    }
    const workbook = xlsx.read(file?.buffer, {type: 'buffer'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: ProductGroup[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
        return next(new ErrorHandler('No Data Found', 400));
    }

    if (!data[0].productCode || !data[0].productName || !data[0].productCategory) {
        return next(new ErrorHandler('Product Name, Code & Category Required', 400));
    }

    data.every(async item => {
        const productGroup = new ProductGroup();

        productGroup.productName = item.productName;
        productGroup.productCategory = item.productCategory;
        productGroup.productCode = item.productCode;

        await productGroup.save();
    })
    res.status(200).json({message: 'Data Imported Successfully'})
}