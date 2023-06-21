import Payment from "../entities/Payment";
import Customer from "../entities/customer";
import Employee from "../entities/employee";
import Invoice from "../entities/invoice";
import Product from "../entities/product";
import ReturnProduct from "../entities/returnProduct";
import Showroom from "../entities/showroom";
import dataSource from "../typeorm.config";
import {
  ControllerFn,
  InvoiceStatus,
  PaymentMethod,
  ProductStatus,
} from "../types";
import ErrorHandler from "../utils/errorHandler";

export const createInvoice: ControllerFn = async (req, res, next) => {
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

    //Checking IF Payment Method Selected
    if (!paymentMethod) {
      return next(new ErrorHandler("Please Select A Payment Method", 404));
    }

    //Checking if there any product to sell

    if (!items || !items.length) {
      return next(new ErrorHandler("No product to sell", 404));
    }

    //Checking if employee selected for all products coming to sell

    if (employees.length !== items.length) {
      return next(
        new ErrorHandler("Please Select Employee For All Products", 400)
      );
    }

    //Checking if There Any Customer Relation Manager

    if (!crmPhone) {
      return next(
        new ErrorHandler("Please Select A CRM For This Customer", 404)
      );
    }

    // Finding The CRM For Customer

    const employee = await dataSource
      .getRepository(Employee)
      .createQueryBuilder("emp")
      .where("emp.empPhone=:crmPhone", { crmPhone })
      .getOne();

    // Checking If Employee Exist On Database

    if (!employee) {
      return next(new ErrorHandler("No Employee Found", 404));
    }

    // Finding The Showroom For Sells

    const showroom =
      (await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoices")
        .where("showroom.id=:id", { id: req.showroomId })
        .getOne()) ||
      (await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoices")
        .where("showroom.showroomCode='HO'")
        .getOne());

    // Finding the customer

    const customer = await dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .where("customer.customerPhone=:customerMobile", {
        customerMobile: customerPhone,
      })
      .getOne();

    // Checking If Customer Exist On Database
    if (!customer) {
      return next(new ErrorHandler("No Customer Found", 404));
    }

    // Checking If Customer Have CRM Or Not
    if (!customer.crm && !crmPhone) {
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

    const products = await dataSource
      .getRepository(Product)
      .createQueryBuilder("product")
      .where("product.itemCode IN (:...productCodes)", {
        productCodes: items.map((item) => item.itemCode),
      })
      .getMany();

    if (products.length === 0) {
      return next(new ErrorHandler("No unsold items found", 404));
    }

    for (const [i, product] of products.entries()) {
      const sellPriceAfterDiscount = Math.round(
        Number(product.sellPrice - discountTk[i])
      );
      product.sellingStatus = ProductStatus.Sold;
      product.discount = discounts[i];
      product.sellPriceAfterDiscount = sellPriceAfterDiscount;

      await product.save();
    }
    //Creating Payment Method

    const payment = new Payment();
    payment.paymentMethod = paymentMethod;
    payment.amount = paidAmount;
    await payment.save();
    //Initiating Invoice

    const invoice = new Invoice();

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
    invoice.cash = cash;
    invoice.cbl = cbl;
    invoice.bkash = bkash;
    invoice.vat = vat;

    if (returnId) {
      const returned = await dataSource
        .getRepository(ReturnProduct)
        .createQueryBuilder("re")
        .leftJoinAndSelect("re.returnProducts", "returnProducts")
        .where("re.id=:returnId", { returnId })
        .getOne();
      if (!returned) {
        return next(new ErrorHandler("Return Not Found On DB", 404));
      }
      invoice.invoiceAmount -= returned.amount;
      invoice.netAmount -= returned.amount;
      invoice.bkash -= returned.bkash;
      invoice.cash -= returned.cash;
      invoice.cbl -= returned.cbl;

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
      await showroom.save();
    }

    //Pushing products into Customer Purchase
    if (customer && req.body.invoiceStatus !== "Hold") {
      products.every(async (product) => {
        customer.addPurchase(product);
      });
      customer.paid = Math.round(customer.paid + invoice.paidAmount);
      customer.crm = employee.empPhone;
      await customer.save();
    }

    // Pushing Products Into Employee Sales List
    products.every(async (product, i) => {
      const emp = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .where("emp.empPhone=:empPhone", { empPhone: employees[i] })
        .getOne();

      if (emp) {
        await emp.addSale(product);
      }
    });
    await invoice.save();
    res.status(200).json(invoice);
  } catch (e) {
    res.status(500).json({ message: e.message });
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
