import Payment from "../entities/Payment";
import Customer from "../entities/customer";
import Employee from "../entities/employee";
import Invoice from "../entities/invoice";
import Product from "../entities/product";
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

    const netAmount =
      payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * vat);

    // Calculating Discount Amount
    const discountAmount = discountTk.reduce((a, b) => a + b);

    if (paidAmount < netAmount) {
      return next(new ErrorHandler("Please Provide Amount Correctly", 404));
    }

    // Initiating Product To Sell

    const products = await dataSource
      .getRepository(Product)
      .createQueryBuilder("product")
      .where("product.itemCode IN (:...productCodes)", {
        productCodes: items.map((item) => item.itemCode),
      })
      .getMany();

    // Checking If The Product Already in Hold

    if (req.body?.invoiceStatus === "Hold") {
      const isHold = products.every((item) => item.sellingStatus === "Hold");
      if (isHold) {
        return next(new ErrorHandler("Products Already In Hold", 400));
      }
    }

    if (products.length === 0) {
      return next(new ErrorHandler("No unsold items found", 404));
    }

    for (const [i, product] of products.entries()) {
      const sellPriceAfterDiscount = Math.round(
        Number(product.sellPrice - discountTk[i])
      );
      product.sellingStatus =
        req.body.invoiceStatus === "Hold"
          ? ProductStatus.Hold
          : ProductStatus.Sold;
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
    if (req.body.invoiceStatus === "Hold") {
      invoice.invoiceStatus = InvoiceStatus.Hold;
    } else {
      invoice.invoiceStatus = InvoiceStatus.Paid;
    }
    invoice.invoiceAmount = Number(netAmount);
    invoice.paidAmount = Number(paidAmount);
    invoice.changeAmount = Number(
      netAmount <= paidAmount ? paidAmount - netAmount : 0
    );
    invoice.customerName = customer.customerName;
    invoice.customerMobile = customer.customerPhone;
    invoice.quantity = products.length;
    invoice.discountAmount = Number(discountAmount);
    invoice.withoutTax = subtotal;
    invoice.withTax = subtotal + Math.round((subtotal / 100) * vat);

    invoice.vat = vat;

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

    if (req.body.invoiceStatus !== "Hold") {
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
    }

    await invoice.save();
    res.status(200).json(invoice);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateInvoice: ControllerFn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({ where: { id } });

    if (!invoice) {
      return next(new ErrorHandler("Invoice not found", 404));
    }
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
    };

    if (!paymentMethod) {
      return next(new ErrorHandler("Please select a payment Method", 404));
    }

    if (!items || !items.length) {
      return next(new ErrorHandler("No product to sell", 404));
    }

    //Finding Showrooms
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

    //Finding The Customer

    const customer = await dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .where("customer.customerPhone=:customerMobile", {
        customerMobile: customerPhone,
      })
      .getOne();
    if (!customer) {
      return next(new ErrorHandler("No Customer Found", 404));
    }

    if (!customer.crm && !crmPhone) {
      return next(
        new ErrorHandler("Please Select A CRM For This Customer", 404)
      );
    }

    //Finding The CRM

    const employee = await dataSource
      .getRepository(Employee)
      .createQueryBuilder("emp")
      .where("emp.empPhone=:crmPhone", { crmPhone })
      .getOne();

    if (!employee) {
      return next(new ErrorHandler("No Employee Found", 404));
    }

    const netAmount =
      payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * vat);
    const discountAmount = discountTk.reduce((a, b) => a + b);

    if (paidAmount < netAmount) {
      return next(new ErrorHandler("Please Provide Correct Amount", 404));
    }

    const products = await dataSource
      .getRepository(Product)
      .createQueryBuilder("product")
      .where("product.itemCode IN (:...productCodes)", {
        productCodes: items.map((item) => item.itemCode),
      })
      .getMany();

    if (req.body?.invoiceStatus === "Hold") {
      const isHold = products.every((item) => item.sellingStatus === "Hold");
      if (isHold) {
        return next(new ErrorHandler("Products Already In Hold", 400));
      }
    }

    if (employees.length !== products.length) {
      return next(
        new ErrorHandler("Please Select Employee For All Products", 400)
      );
    }

    if (products.length === 0) {
      return next(new ErrorHandler("No unsold items found", 404));
    }
    for (const [i, product] of products.entries()) {
      const sellPriceAfterDiscount = Math.round(
        Number(product.sellPrice - discountTk[i])
      );
      product.sellingStatus =
        req.body.invoiceStatus === "Hold"
          ? ProductStatus.Hold
          : ProductStatus.Sold;
      product.discount = discounts[i];
      product.sellPriceAfterDiscount = sellPriceAfterDiscount;

      await product.save();
    }

    const payment = new Payment();

    payment.amount = paidAmount;

    payment.paymentMethod = paymentMethod;

    await payment.save();

    invoice.paymentMethod = payment;

    invoice.products = products;
    invoice.businessName = "SPARKX Lifestyle";
    if (req.body.invoiceStatus === "Hold") {
      invoice.invoiceStatus = InvoiceStatus.Hold;
    } else {
      invoice.invoiceStatus = InvoiceStatus.Paid;
    }
    invoice.invoiceAmount = Number(netAmount);
    invoice.paidAmount = Number(paidAmount);
    invoice.changeAmount = Number(
      netAmount <= paidAmount ? paidAmount - netAmount : 0
    );
    invoice.customerName = customer.customerName;
    invoice.customerMobile = customer.customerPhone;
    invoice.quantity = products.length;
    invoice.discountAmount = Number(discountAmount);
    invoice.withoutTax = subtotal;
    invoice.withTax = subtotal + Math.round((subtotal / 100) * vat);
    invoice.vat = vat;

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
    if (customer) {
      products.every(async (product) => {
        customer.addPurchase(product);
      });
      customer.paid = Math.round(customer.paid + invoice.paidAmount);
      customer.crm = employee.empPhone;
      await customer.save();
    }

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
  const { from_date, to_date, showroom_name } = req.query as {
    from_date: string;
    to_date: string;
    showroom_name: string;
  };

  let qb = dataSource
    .getRepository(Invoice)
    .createQueryBuilder("invoice")
    .leftJoinAndSelect("invoice.products", "products")
    .leftJoinAndSelect("products.employee", "employee")
    .leftJoinAndSelect("invoice.paymentMethod", "paymentMethod");

  if (req.showroomId) {
    const showroom = await dataSource
      .getRepository(Showroom)
      .createQueryBuilder("showroom")
      .where("showroom.id=:id", { id: req.showroomId })
      .getOne();
    if (showroom) {
      qb = qb.where("invoice.showroomName = :showroomName", {
        showroomName: showroom.showroomName,
      });
    }
  }

  if (from_date && to_date) {
    qb = qb
      .where("DATE(invoice.createdAt)>=:from_date", {
        from_date,
      })
      .andWhere("DATE(invoice.createdAt) <=:to_date", {
        to_date,
      });
  }
  if (showroom_name) {
    qb.andWhere("invoice.showroomName = :showroom_name", { showroom_name });
  }

  const invoices = await qb.getMany();

  res.status(200).json(invoices);
};

export const resetHoldInvoice: ControllerFn = async (req, res, next) => {
  const { id } = req.params;

  const invoice = await dataSource
    .getRepository(Invoice)
    .createQueryBuilder("invoice")
    .leftJoinAndSelect("invoice.products", "products")
    .where("invoice.id=:id", { id })
    .getOne();

  if (!invoice) {
    return next(new ErrorHandler("Invoice not found", 404));
  }
  invoice.invoiceAmount = 0;
  invoice.paidAmount = 0;

  for (const product of invoice.products) {
    product.sellingStatus = ProductStatus.Unsold;
    await product.save();
  }

  await invoice.save();
  res.status(200).json(invoice);
};
