import { ControllerFn, ProductStatus } from "../types";
import appDataSource from "../typeorm.config";
import Showroom from "../entities/showroom";
import ErrorHandler from "../utils/errorHandler";
import ReturnProduct from "../entities/returnProduct";
import Product from "../entities/product";
import Customer from "../entities/customer";
import Invoice from "../entities/invoice";
import { In } from "typeorm";
import moment from "moment";
import wdate from "../helper/wdate";

export const createReturnProduct: ControllerFn = async (req, res, next) => {
  try {
    const { check, customerPhone, exchange, items } = req.body as {
      customerPhone: string;
      check: string;
      exchange: string;
      items: string[];
    };
    // Finding The Showroom For Sells

    if (!customerPhone) {
      return next(new ErrorHandler("You Must Provide an Customer", 404));
    }

    if (!check) {
      return next(new ErrorHandler("You Must Provide an Check %", 404));
    }
    if (!exchange) {
      return next(new ErrorHandler("You Must Provide an Exchange Type", 404));
    }

    const showroom =
      (await appDataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoices")
        .where("showroom.id=:id", { id: req.showroomId })
        .getOne()) ||
      (await appDataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoices")
        .where("showroom.showroomCode='HO'")
        .getOne());

    const customer = await appDataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .leftJoinAndSelect("customer.returnedProducts", "returnedProducts")
      .where("customer.customerPhone=:customerPhone", { customerPhone })
      .getOne();

    if (!showroom) {
      return next(new ErrorHandler("Showroom Not Found", 404));
    }

    if (!customer) {
      return next(new ErrorHandler("Customer Not Found", 404));
    }

    if (exchange === "Not Exchanging") {
      if (!req.body.cash && !req.body.bkash && !req.body.cbl) {
        return next(
          new ErrorHandler(
            "You Must Select A Method How Your Returning The Amount",
            404
          )
        );
      }
    }

    const products = await appDataSource.getRepository(Product).find({
      where: {
        itemCode: In(items),
      },
    });

    const returnProduct = new ReturnProduct();

    for (const product of products) {
      product.sellingStatus = ProductStatus.Unsold;
      product.sellPriceAfterDiscount = product.sellPrice;
      product.returnStatus = true;
      customer.returnPurchase(product);
      returnProduct.addProduct(product);
      await Promise.all([customer.save(), product.save()]);
    }

    const amount: number = products.reduce(function (
      accumulator,
      currentProduct
    ) {
      return accumulator + currentProduct.sellPriceAfterDiscount;
    },
    0);

    console.log(amount);

    returnProduct.check = check;
    returnProduct.customerPhone = customer.customerPhone;
    returnProduct.amount = amount;
    returnProduct.bkash = req.body?.bkash;
    returnProduct.cbl = req.body?.cbl;
    returnProduct.cash = req.body?.cash;

    if (exchange === "Exchanging") {
      returnProduct.exchange = true;
      await Promise.all([
        appDataSource.getRepository(ReturnProduct).save(returnProduct),
      ]);
      res.status(201).json(returnProduct);
    } else {
      const invoice = new Invoice();
      invoice.bkash = 0 - returnProduct.bkash;
      invoice.cash = 0 - returnProduct.cash;
      invoice.cbl = 0 - returnProduct.cbl;
      invoice.customerMobile = customer.customerPhone;
      invoice.customerName = customer.customerName;
      invoice.invoiceAmount = 0 - amount;
      invoice.netAmount = 0 - amount;
      invoice.returned = returnProduct;

      invoice.showroomInvoiceCode =
        showroom.showroomCode +
        (showroom.invoices.length + 1).toString().padStart(8, "0");
      invoice.showroomAddress = showroom.showroomAddress;
      invoice.showroomMobile = showroom.showroomMobile;
      invoice.showroomName = showroom.showroomName;
      showroom.invoices.push(invoice);

      await Promise.all([
        showroom.save(),
        appDataSource.getRepository(Invoice).save(invoice),
      ]);
      res.status(200).json(invoice);
    }
  } catch (err) {
    console.log(
      "🚀 ~ file: returnController.ts:25 ~ constcreateReturnProduct:ControllerFn= ~ err:",
      err
    );
    res.status(500).json({ message: err.message });
  }
};

export const getReturns: ControllerFn = async (req, res) => {
  const returns = await appDataSource
    .getRepository(ReturnProduct)
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.returnProducts", "returnProducts")
    .leftJoinAndSelect("returnProducts.employee", "employee")
    .getMany();

  res.status(200).json(returns);
};

export const getReturnReport: ControllerFn = async (req, res, next) => {
  try {
    const { showroomCode } = req.query;
    const showroom = await appDataSource
      .getRepository(Showroom)
      .createQueryBuilder("sr")
      .where("sr.showroomCode=:showroomCode", { showroomCode })
      .getOne();

    const data = await appDataSource
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.showroom", "showroom")
      .leftJoinAndSelect("invoice.returned", "returned")
      .leftJoinAndSelect("returned.returnProducts", "returnProducts")
      .leftJoinAndSelect("returnProducts.employee", "employee")
      .where("showroom.id=:id", { id: showroom?.id })
      .andWhere("returned.amount>:amount", { amount: 0 })
      .getMany();

    const returnData = data.map((iv) => {
      return {
        day: wdate(moment(iv?.returned?.createdAt).isoWeekday()),
        date: moment(iv?.returned?.createdAt).format("DD-MM-YYYY"),
        tagPrice: iv?.returned?.returnProducts.map((p) => p.sellPrice),
        finalPrice: iv?.returned?.returnProducts.map(
          (p) => p.sellPriceAfterDiscount
        ),
        seller: iv?.returned?.returnProducts.map((p) => p.employee),
        products: iv?.returned?.returnProducts.map((p) => ({
          itemCode: p.itemCode,
          productName: p.productGroup,
        })),
        invoiceNo: iv?.showroomInvoiceCode,
        check: iv?.returned?.check,
      };
    });
    res.status(200).json(returnData);
  } catch (err) {
    console.log(
      "🚀 ~ file: returnController.ts:164 ~ constgetReturnReport:ControllerFn= ~ err:",
      err
    );
    res.status(500).json({ message: err.message });
  }
};
