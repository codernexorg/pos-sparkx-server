import { NextFunction, Request, Response } from "express";
import moment from "moment";
import xlsx from "xlsx";
import Product from "../entities/product";
import ProductGroup from "../entities/productGroup";
import { ControllerFn, ProductStatus } from "../types";
import ErrorHandler from "../utils/errorHandler";
import Showroom from "../entities/showroom";
import TransferProduct from "../entities/transfer";
import Purchase from "../entities/purchase";

export const createProductGroup: ControllerFn = async (req, res, next) => {
  try {
    const { productCategory, productCode, productName } =
      req.body as ProductGroup;

    if (!productCategory || !productCode || !productName) {
      return next(new ErrorHandler("Please Enter Required Information", 404));
    }

    const productGroup = new ProductGroup();

    productGroup.productCategory = productCategory;
    productGroup.productCode = productCode;
    productGroup.productName = productName;

    await productGroup.save();

    return res.status(201).json(productGroup);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

export const createSingleProduct: ControllerFn = async (req, res, next) => {
  try{
  const {
    itemCode,
    productGroup,
    invoiceNumber,
    unitCost,
    sellPrice,
    lotNumber,
    totalItem,
    whName,
    invoiceTotalPrice
  } = req.body as Product;

  const requiredFields = [
    itemCode,
    productGroup,
    invoiceNumber,
    unitCost,
    sellPrice,
    lotNumber,
    totalItem,
    whName,
  ];
  if (requiredFields.some((field) => !field)) {
    return next(new ErrorHandler("Please Enter Required Information", 404));
  }

    const productCode = await ProductGroup.findOne({
      where: {
        productName: productGroup,
      },
    });


    if (totalItem > 1) {
      let itemMCode = parseInt(itemCode);
      const productArr: Product[] = [];
      for (let i = 0; i < totalItem; i++) {
        productArr.push({
          ...req.body,
          itemCode: String(itemMCode.toString().padStart(10, "0")),
          productCode: String(productCode?.productCode),
          grossProfit: String(sellPrice - + unitCost),
          grossMargin: String(((sellPrice - unitCost) / sellPrice) *100),
          unitTotalCost: Number( unitCost),
          sellingStatus: ProductStatus.Unsold,
        });
        itemMCode += 1;
      }
      const productToPurchase:Product[]=[]
      await Promise.all(
          productArr.map(async (product) => {
            const productToSave = Product.create({
              ...product,
              invoiceDate: new Date(req.body?.invoiceDate),
            });
            productToPurchase.push(product)
            await productToSave.save();
          })
      );

      const purchase=new Purchase()

      if(productToPurchase.length){
        purchase.invoiceNo=invoiceNumber
        purchase.supplierName=req.body?.supplierName
        purchase.purchaseAmount=invoiceTotalPrice
        purchase.products=productToPurchase
        await purchase.save();
      }

      return res.json(productArr);
    }else {
      const productToSave = Product.create({
        ...req.body,
        invoiceDate: moment(req.body?.invoiceDate).toDate(),
        productCode: productCode?.productCode,
        unitTotalCost: Number( unitCost),
        sellingStatus: ProductStatus.Unsold,
        grossProfit: String(sellPrice - + unitCost),
        grossMargin: String(((sellPrice - unitCost) / sellPrice) *100),
      });

      await productToSave.save();

      const purchase= new Purchase()
      purchase.products=[productToSave]
      purchase.invoiceNo=invoiceNumber
      purchase.supplierName=req.body?.supplierName
      purchase.purchaseAmount=invoiceTotalPrice

      await purchase.save();

      return res.json([productToSave]);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

export const getProducts: ControllerFn = async (req, res, next) => {
  if (req.showroomId) {
    const showroom = await Showroom.findOne({ where: { id: req.showroomId } });
    if (!showroom) {
      return next(new ErrorHandler("Unexpected Result", 404));
    }
    const product = await Product.find({
      order: {
        itemCode: "ASC",
      },
      where: { showroomName: showroom.showroomName },
    });
    console.log(product.length);
    res.status(200).json({
      product: product,
      hasMore: false,
    });
  } else {
    const product = await Product.find({
      order: {
        itemCode: "ASC",
      },
    });
    res.status(200).json({
      product: product,
      hasMore: false,
    });
  }
};

export const getProductGroup: ControllerFn = async (_req, res,_next) => {

  res.status(200).json(await ProductGroup.find());
};

export const createMultipleProducts: ControllerFn = async (req, res, next) => {
  try {
    const products = req.body as Product[];

    if (products.length === 0) {
      return next(new ErrorHandler("Please Enter Required Information", 404));
    } else if (
      !products[0].invoiceDate ||
      !products[0].invoiceNumber ||
      !products[0].sellPrice ||
      !products[0].itemCode
    ) {
      return next(new ErrorHandler("Please Enter Required Information", 404));
    }

    let showroom:Showroom|null

    if(req.showroomId){
      showroom= await Showroom.findOne({ where: { id: req.showroomId } });
    }else{
      showroom = await Showroom.findOne({ where: { showroomCode:'HO'}})
    }
    if(!showroom){
      return next(new ErrorHandler("Unexpected Result", 404));
    }

    const invoiceDate = moment(req.body.invoiceDate).toDate();

    const productArr:Product[]=[]

    await Promise.all(
        products.map(async (product: Product) => {
          const grossProfit = product.sellPrice -  product.unitCost;
          const grossMargin = ((grossProfit / product.sellPrice) * 100).toString();
          const productCode = await ProductGroup.findOne({where:{productName:product.productGroup}})

          const productToSave = Product.create({
            ...product,
            invoiceDate,
            grossProfit: grossProfit.toString(),
            grossMargin,
            totalItem: products.length,
            unitCost: Number(product.unitCost),
            sellingStatus: ProductStatus.Unsold,
            productCode:productCode?.productCode
          });

          await productToSave.save();
          productArr.push(productToSave)
        })
    );

    return res.json(productArr);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

export const importProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;

    if (!file) {
      return next(new ErrorHandler("No File Found", 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: Product[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return next(new ErrorHandler("No Data Found", 400));
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
      return next(new ErrorHandler("Required Information Missing", 400));
    }
    data.every(async (product) => {
      const productToSave = Product.create({
        ...product,
        invoiceDate: moment(product.invoiceDate).toDate(),
        itemCode: String(
          parseInt(product.itemCode).toString().padStart(10, "0")
        ),
        grossProfit: String((product.sellPrice - product.unitCost).toString()),
        grossMargin: String(
          (
            product.sellPrice -
            product.unitCost -
            product.unitCost / product.sellPrice -
            +product.unitCost
          ).toString()
        ),
        unitTotalCost: Number(
          product.transportationCost
            ? product.unitCost + product.transportationCost
            : product.unitCost
        ),

        deliveryDate: moment(product.deliveryDate).toDate(),
        sellPrice: Number(product.sellPrice),
      });

      await productToSave.save();
    });

    res.status(200).json({ message: "Data imported successfully", data: data });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const transferProduct: ControllerFn = async (req, res, next) => {
  const { showroomName, lotNumber, whName, itemCodes } = req.body as {
    showroomName: string;
    lotNumber: string;
    whName: string;
    itemCodes: { itemCode: string }[];
  };

  if (!showroomName || !lotNumber || !itemCodes.length) {
    return next(new ErrorHandler("Please Provide All Information", 404));
  }
  try {
    const productArr: Product[] = [];

    for (const itemCode of itemCodes) {
      const product = await Product.findOne({
        where: { itemCode: itemCode.itemCode },
      });

      if (product) {
        productArr.push(product);

        product.whName = showroomName;
        product.showroomName = showroomName;
        await product.save();
      }
    }
    const transferData = new TransferProduct();
    transferData.transferredLot = lotNumber;
    transferData.prevLocation = whName;
    transferData.currentLocation = showroomName;
    transferData.productCount = itemCodes.length;
    transferData.transferredProducts = productArr;

    await transferData.save();
    res.status(200).json("Product Transferred Successfully");
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getTransferHistory: ControllerFn = async (_req, res) => {
  res.status(200).json(await TransferProduct.find());
};

export const importProductGroup: ControllerFn = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(new ErrorHandler("No File Found", 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: ProductGroup[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return next(new ErrorHandler("No Data Found", 400));
    }

    if (
      !data[0].productCode ||
      !data[0].productName ||
      !data[0].productCategory
    ) {
      return next(
        new ErrorHandler("Product Name, Code & Category Required", 400)
      );
    }

    data.every(async (item) => {
      const productGroup = new ProductGroup();

      productGroup.productName = item.productName;
      productGroup.productCategory = item.productCategory;
      productGroup.productCode = item.productCode;

      await productGroup.save();
    });
    res.status(200).json({ message: "Data Imported Successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateProduct: ControllerFn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }

    product.sellingStatus = req.body?.sellingStatus;

    await product.save();

    res.status(200).json(product);
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
