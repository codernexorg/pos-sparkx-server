import { ControllerFn, PaymentMethod, ProductStatus } from "../types";
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
import Payment from "../entities/Payment";
import Employee from "../entities/employee";

export const createReturnProduct: ControllerFn = async (req, res, next) => {
  try {
    const { check, customerPhone, exchange, items, cash, bkash, cbl } =
      req.body as {
        customerPhone: string;
        check: string;
        exchange: string;
        items: string[];
        cash: number;
        bkash: number;
        cbl: number;
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

    if (exchange === "Not Exchanging" && !cash && !bkash && !cbl) {
      return next(
        new ErrorHandler(
          "You must select a method for returning the amount.",
          404
        )
      );
    }

    const products = await appDataSource.getRepository(Product).find({
      where: {
        itemCode: In(items),
      },
      relations: {
        employee: true,
      },
    });

    const returnProduct = new ReturnProduct();
    for (const product of products) {
      product.sellingStatus = ProductStatus.Unsold;
      product.sellPriceAfterDiscount = product.sellPrice;
      product.returnStatus = true;
      customer.returnPurchase(product);
      returnProduct.addProduct(product);
      const employee = await appDataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where("emp.id=:id", { id: product.employee.id })
        .getOne();

      if (employee) {
        employee.returnSale(product);
      }

      await Promise.all([customer.save(), employee?.save(), product.save()]);
    }

    const amount: number = products.reduce(function (
      accumulator,
      currentProduct
    ) {
      return accumulator + currentProduct.sellPriceAfterDiscount;
    },
    0);

    returnProduct.check = check;
    returnProduct.customerPhone = customer.customerPhone;
    returnProduct.amount = amount;
    returnProduct.bkash = bkash;
    returnProduct.cbl = cbl;
    returnProduct.cash = cash;

    if (exchange === "Exchanging") {
      returnProduct.exchange = true;
      await appDataSource.getRepository(ReturnProduct).save(returnProduct);
      res.status(201).json(returnProduct);
    } else if (exchange === "Not Exchanging") {
      const paymentMethod = new Payment();
      paymentMethod.amount = 0 - returnProduct.amount;
      paymentMethod.paymentMethod = PaymentMethod.RETURNED;

      const invoice = new Invoice();
      invoice.bkash = 0 - returnProduct.bkash;
      invoice.cash = 0 - returnProduct.cash;
      invoice.cbl = 0 - returnProduct.cbl;
      invoice.customerMobile = customer.customerPhone;
      invoice.customerName = customer.customerName;
      invoice.invoiceAmount = 0 - returnProduct.amount;
      invoice.netAmount = 0 - returnProduct.amount;
      invoice.returned = returnProduct;
      invoice.paymentMethod = paymentMethod;
      await appDataSource.getRepository(ReturnProduct).save(returnProduct);
      invoice.showroomInvoiceCode =
        showroom.showroomCode +
        (showroom.invoices.length + 1).toString().padStart(8, "0");
      invoice.showroomAddress = showroom.showroomAddress;
      invoice.showroomMobile = showroom.showroomMobile;
      invoice.showroomName = showroom.showroomName;
      showroom.invoices.push(invoice);

      await paymentMethod.save();

      await invoice.save();

      await showroom.save();
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
      .leftJoinAndSelect("invoice.paymentMethod", "paymentMethod")
      .leftJoinAndSelect("returnProducts.employee", "employee")
      .where("showroom.id=:id", { id: showroom?.id })
      .getMany();

    const returnData = data.map((iv) => {
      if (iv.returned)
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
      else return null;
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
