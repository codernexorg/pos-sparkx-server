import { forEach } from "underscore";
import Payment from "../entities/Payment";
import Customer from "../entities/customer";
import Employee from "../entities/employee";
import Invoice from "../entities/invoice";
import Product from "../entities/product";
import ReturnProduct from "../entities/returnProduct";
import Showroom from "../entities/showroom";
import appDataSource from "../typeorm.config";
import dataSource from "../typeorm.config";
import {
  ControllerFn,
  InvoiceStatus,
  PaymentMethod,
  ProductStatus,
} from "../types";
import ErrorHandler from "../utils/errorHandler";

export const createInvoice: ControllerFn = async (req, res, next) => {
  const queryRunner = appDataSource.createQueryRunner();
  const manager = queryRunner.manager;
  try {
    const {
      items,
      subtotal,
      customerPhone,
      crmPhone,
      discounts,
      vat,
      paidAmount,
      discountTk,
      payable,
      employees,
      paymentMethod,
      cash,
      bkash,
      cbl,
      salesTime,
      returnId,
    } = req.body as {
      items: Product[];
      subtotal: number;
      customerPhone: string;
      crmPhone: string;
      discounts: number[];
      vat: number;
      paidAmount: number;
      discountTk: number[];
      payable: number[];
      employees: string[];
      paymentMethod: PaymentMethod;
      cash: number;
      bkash: number;
      cbl: number;
      salesTime: string;
      returnId: number | null;
    };

    //Error Handling
    if (!paymentMethod)
      return next(new ErrorHandler("Please Select A Payment Method", 404));
    if (!employees)
      return next(new ErrorHandler("Please Select Employee", 404));
    if (!items || !items.length)
      return next(new ErrorHandler("No product to sell", 404));
    if (employees.length !== items.length)
      return next(
        new ErrorHandler("Please Select Employee For All Products", 400)
      );
    if (!crmPhone)
      return next(
        new ErrorHandler("Please Select A CRM For This Customer", 404)
      );

    // Finding The CRM For Customer

    const employee = await manager
      .getRepository(Employee)
      .createQueryBuilder("emp")
      .where("emp.empPhone=:crmPhone", { crmPhone })
      .leftJoinAndSelect("emp.sales", "sales")
      .getOne();

    // Checking If Employee Exist On Database

    if (!employee) {
      return next(new ErrorHandler("No Employee Found", 404));
    }

    // Finding The Showroom For Sells

    const showroom = await manager
      .getRepository(Showroom)
      .createQueryBuilder("showroom")
      .leftJoinAndSelect("showroom.invoices", "invoices")
      .leftJoinAndSelect("showroom.customer", "customer")
      .where("showroom.id=:id", { id: req.showroomId })
      .getOne();

    if (!showroom) {
      return next(new ErrorHandler("Something went wrong with showroom", 404));
    }

    const customer = await manager
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .leftJoinAndSelect("customer.showroom", "showroom")
      .where("customer.customerPhone=:customerMobile", {
        customerMobile: customerPhone,
      })
      .andWhere("showroom.id=:id", { id: showroom.id })
      .getOne();

    // Finding the customer

    // Checking If Customer Exist On Database
    if (!customer || (!customer.crm && !crmPhone)) {
      return next(
        new ErrorHandler("Please Select A CRM For This Customer", 404)
      );
    }

    // Calculating Net Amount With Tax

    const netAmount = payable.reduce((a, b) => a + b);

    // Calculating Discount Amount
    const discountAmount = discountTk.reduce((a, b) => a + b);

    // Calculating Subtotal with Tax Amount
    const withTax = netAmount + Math.round((subtotal / 100) * vat);
    // Initiating Product To Sell

    if (!returnId && paidAmount < netAmount) {
      return next(new ErrorHandler("Please Pay Payable Amount", 404));
    }

    const products: Product[] = [];

    await Promise.all(
      items.map(async (item) => {
        const product = await manager
          .getRepository(Product)
          .createQueryBuilder("product")
          .where("product.itemCode=:itemCode", {
            itemCode: item.itemCode,
          })
          .getOne();
        if (product) products.push(product);
      })
    );

    if (products.length === 0) {
      return next(new ErrorHandler("No unsold items found", 404));
    }

    await queryRunner.startTransaction();

    await Promise.all(
      products.map(async (product, i) => {
        const sellPriceAfterDiscount = Math.round(
          Number(product.sellPrice - discountTk[i])
        );
        product.sellingStatus = ProductStatus.Sold;
        product.discount = discounts[i];
        product.sellPriceAfterDiscount = sellPriceAfterDiscount;
        product.returnStatus = false;

        const emp = await manager
          .getRepository(Employee)
          .createQueryBuilder("emp")
          .leftJoinAndSelect("emp.sales", "sales")
          .where("emp.empPhone=:empPhone", { empPhone: employees[i] })
          .getOne();
        if (emp) {
          emp.addSale(product);
          await manager.save(emp);
        }
      })
    );

    //Creating Payment Method

    const payment = manager.create(Payment);
    payment.paymentMethod = paymentMethod;
    payment.amount = paidAmount;
    await manager.save(payment);
    //Initiating Invoice

    const invoice = manager.create(Invoice);

    invoice.paymentMethod = payment;
    invoice.products = products;
    invoice.businessName = "SPARKX Lifestyle";
    invoice.invoiceStatus = InvoiceStatus.Paid;
    invoice.invoiceAmount = withTax;
    invoice.netAmount = netAmount;
    invoice.paidAmount = Number(paidAmount);
    invoice.changeAmount = Number(
      withTax <= paidAmount ? paidAmount - withTax : 0
    );
    invoice.discountAmount = Number(discountAmount);
    invoice.subtotal = subtotal;
    invoice.customerName = customer.customerName;
    invoice.customerMobile = customer.customerPhone;
    invoice.quantity = products.length;
    invoice.cash =
      paymentMethod === "CASH" ? cash - invoice.changeAmount : cash;
    invoice.cbl = paymentMethod === "CBL" ? cbl - invoice.changeAmount : cbl;
    invoice.bkash =
      paymentMethod === "BKASH" ? bkash - invoice.changeAmount : bkash;

    invoice.vat = vat;

    if (returnId) {
      const returned = await manager
        .getRepository(ReturnProduct)
        .createQueryBuilder("re")
        .leftJoinAndSelect("re.returnProducts", "returnProducts")
        .where("re.id=:returnId", { returnId })
        .getOne();
      if (!returned) {
        return next(new ErrorHandler("Return Not Found On DB", 404));
      }

      const invoiceAmount = invoice.invoiceAmount - returned.amount;

      const cashAmount = invoice.cash - returned.cash;
      const bkashAmount = invoice.bkash - returned.bkash;
      const cblAmount = invoice.cbl - returned.cbl;

      const changeAmount = paidAmount - invoiceAmount;

      invoice.invoiceAmount = invoiceAmount;
      invoice.netAmount = invoiceAmount;
      invoice.bkash = invoice.bkash ? bkashAmount - changeAmount : 0;
      invoice.cash = invoice.cash ? cashAmount - changeAmount : 0;
      invoice.cbl = invoice.cbl ? cblAmount - changeAmount : 0;
      invoice.returnQuantity = returned.returnProducts.length;
      invoice.changeAmount = changeAmount;
      invoice.returned = returned;
    }

    // Sells Time Manual
    if (salesTime) {
      invoice.createdAt = new Date(salesTime);
    }

    //Updating invoice & Pushing into showroom

    if (showroom) {
      invoice.showroomInvoiceCode =
        showroom.showroomCode +
        (showroom.invoices.length + 1).toString().padStart(8, "0");
      invoice.showroomAddress = showroom.showroomAddress;
      invoice.showroomMobile = showroom.showroomMobile;
      invoice.showroomName = showroom.showroomName;
      showroom.invoices.push(invoice);
      await manager.save(showroom);
    }

    //Pushing products into Customer Purchase
    if (customer && req.body.invoiceStatus !== "Hold") {
      products.every(async (product) => {
        customer.addPurchase(product);
      });
      customer.paid = Math.round(customer.paid + withTax);
      customer.crm = employee.empPhone;
      await manager.save(customer);
    }

    await manager.save(invoice);

    await queryRunner.commitTransaction();
    res.status(200).json(invoice);
  } catch (e) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    await queryRunner.release();
  }
};

export const getInvoices: ControllerFn = async (req, res, _next) => {
  try {
    const { from_date, to_date, showroom_name } = req.query as {
      from_date: string;
      to_date: string;
      showroom_name: string;
    };

    const qb = dataSource
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.products", "products")
      .leftJoinAndSelect("products.employee", "employee")
      .leftJoinAndSelect("invoice.paymentMethod", "paymentMethod")
      .leftJoinAndSelect("invoice.returned", "returned")
      .leftJoinAndSelect("returned.returnProducts", "returnProducts")
      .orderBy("invoice.createdAt", "DESC");

    if (req.showroomId) {
      const showroom = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .where("showroom.id = :id", { id: req.showroomId })
        .getOne();

      if (showroom) {
        qb.andWhere("invoice.showroomName = :showroomName", {
          showroomName: showroom.showroomName,
        });
      }
    }

    if (showroom_name) {
      qb.andWhere("invoice.showroomName = :showroom_name", {
        showroom_name,
      });
    }

    if (
      from_date !== "undefined" &&
      to_date !== "undefined" &&
      from_date &&
      to_date
    ) {
      qb.andWhere("DATE(invoice.createdAt) BETWEEN :from_date AND :to_date", {
        from_date,
        to_date,
      });
    }

    const invoices = await qb.getMany();

    res.status(200).json(invoices);
  } catch (er) {
    console.log(er.message);
    res.status(500).json({ message: er.message });
  }
};
