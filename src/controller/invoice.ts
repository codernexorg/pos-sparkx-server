import { FindOptionsUtils } from "typeorm";
import Customer from "../entities/customer";
import Employee from "../entities/employee";
import Invoice from "../entities/invoice";
import Product from "../entities/product";
import Showroom from "../entities/showroom";
import dataSource from "../typeorm.config";
import { ControllerFn, InvoiceStatus, ProductStatus } from "../types";
import ErrorHandler from "../utils/errorHandler";

export const createInvoice: ControllerFn = async (req, res, next) => {
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
  };

  if (!items || !items.length) {
    return next(new ErrorHandler("No product to sell", 404));
  }

  if (!crmPhone) {
    return next(new ErrorHandler("Please Select A CRM For This Customer", 404));
  }

  const employee = await Employee.findOne({ where: { empPhone: crmPhone } });

  if (!employee) {
    return next(new ErrorHandler("No Employee Found", 404));
  }

  let showroom: Showroom | null = null;

  if (req.showroomId) {
    showroom = await Showroom.findOne({
      where: { id: req.showroomId },
      relations: { invoices: true },
    });
  } else {
    showroom = await Showroom.findOne({
      where: { showroomCode: "HO" },
      relations: { invoices: true },
    });
  }

  const customer = await Customer.findOne({
    where: { customerPhone: customerPhone },
    relations: { purchasedProducts: true },
  });
  if (!customer) {
    return next(new ErrorHandler("No Customer Found", 404));
  }

  if (!customer.crm && !crmPhone) {
    return next(new ErrorHandler("Please Select A CRM For This Customer", 404));
  }

  const netAmount =
    payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * vat);
  const discountAmount = discountTk.reduce((a, b) => a + b);

  if (req.body.invoiceStatus !== "Hold") {
    if (!customer && netAmount > Number(req.body?.paidAmount)) {
      return next(
        new ErrorHandler("Due Only Possible With Registered Customer", 404)
      );
    }
  }

  const products: Product[] = [];

  for (let i = 0; i < items.length; i++) {
    let product;
    if (showroom) {
      product = await Product.findOne({
        where: {
          itemCode: items[i].itemCode,
          showroomName: showroom.showroomName,
        },
      });
    } else
      product = await Product.findOne({
        where: { itemCode: items[i].itemCode },
      });
    if (product) {
      products.push(product);
    }
  }

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
  } else {
    for (let i = 0; i < products.length; i++) {
      for (let i = 0; i < products.length; i++) {
        products[i].sellingStatus = ProductStatus.Sold;
        const discount = Math.round(
          (discounts[i] * 100) / products[i].sellPrice
        );
        const sellPriceAfterDiscount = Math.round(
          Number(products[i].sellPrice - discountTk[i])
        );
        if (req.body.invoiceStatus === "Hold") {
          Object.assign(products[i], {
            sellingStatus: ProductStatus.Hold,
            discount,
            sellPriceAfterDiscount: sellPriceAfterDiscount,
          });
        } else {
          Object.assign(products[i], {
            sellingStatus: "Sold",
            discount,
            sellPriceAfterDiscount: sellPriceAfterDiscount,
          });
        }

        await products[i].save();
      }
    }
  }

  const invoice = new Invoice();

  invoice.products = products;
  invoice.businessName = "SPARKX Lifestyle";
  if (req.body.invoiceStatus === "Hold") {
    invoice.invoiceStatus = InvoiceStatus.Hold;
  } else {
    invoice.invoiceStatus =
      netAmount <= paidAmount ? InvoiceStatus.Paid : InvoiceStatus.Due;
  }
  invoice.invoiceAmount = Number(netAmount);
  invoice.paidAmount = Number(paidAmount);
  invoice.changeAmount = Number(
    netAmount <= paidAmount ? paidAmount - netAmount : 0
  );
  invoice.dueAmount = Number(
    netAmount > paidAmount ? netAmount - paidAmount : 0
  );
  invoice.customerName = customer.customerName;
  invoice.customerMobile = customer.customerPhone;
  invoice.quantity = products.length;
  invoice.discountAmount = Number(discountAmount);
  invoice.vat = vat;

  if (showroom) {
    invoice.showroomInvoiceCode =
      showroom.showroomCode +
      (showroom?.invoices.length + 1).toString().padStart(8, "0");
    invoice.showroomAddress = showroom.showroomAddress;
    invoice.showroomMobile = showroom.showroomMobile;
    invoice.showroomName = showroom.showroomName;
    showroom.invoices.push(invoice);
    await showroom.save();
  }
  if (customer && req.body.invoiceStatus !== "Hold") {
    products.every(async (product) => {
      customer.addPurchase(product);
    });
    customer.due = Math.round(customer.due + invoice.dueAmount);
    customer.paid = Math.round(customer.paid + invoice.paidAmount);
    customer.crm = employee.empPhone;
    await customer.save();
    console.log(customer);
  }

  products.every(async (product, i) => {
    const emp = await Employee.findOne({ where: { empPhone: employees[i] } });

    if (emp) {
      await emp.addSale(product);
    }
  });

  await invoice.save();
  res.status(200).json(invoice);
};

// export const updateInvoice: ControllerFn = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const {
//       items,
//       subtotal,
//       customerPhone,
//       crmId,
//       discounts,
//       vat,
//       paidAmount,
//       discountTk,
//       payable,
//       employees,
//     } = req.body as {
//       items: Product[];
//       subtotal: number;
//       customerPhone: string;
//       crmId: number;
//       discounts: number[];
//       vat: number;
//       paidAmount: number;
//       discountTk: number[];
//       payable: number[];
//       employees: string[];
//     };
//
//     const invoice = await Invoice.findOne({
//       where: {
//         id,
//       },
//     });
//     if (!invoice) {
//       return next(new ErrorHandler("No such invoice found", 404));
//     }
//
//     if (!items || !items.length) {
//       return next(new ErrorHandler("No product to sell", 404));
//     }
//
//     if (!crmId) {
//       return next(
//         new ErrorHandler("Please Select A CRM For This Customer", 404)
//       );
//     }
//
//     const employee = await Employee.findOne({ where: { id: crmId } });
//
//     if (!employee) {
//       return next(new ErrorHandler("No Employee Found On Database", 404));
//     }
//
//     let showroom: Showroom | null = null;
//
//     if (req.showroomId) {
//       showroom = await Showroom.findOne({
//         where: { id: req.showroomId },
//         relations: { invoices: true },
//       });
//     } else {
//       showroom = await Showroom.findOne({ where: { showroomCode: "HO" } });
//     }
//
//     if (!showroom) {
//       return next(new ErrorHandler("No Showroom Found To Sell For", 404));
//     }
//
//     if(!employees.length){
//       return next(new ErrorHandler("No Employees Found To Sell For", 404));
//     }
//
//     //Checking If Customer Exist
//
//     const customer = await Customer.findOne({
//       where: { customerPhone: customerPhone },
//     });
//
//     if (!customer) {
//       return next(new ErrorHandler("No Customer Found", 404));
//     }
//
//     if (!customer.crm && !crmId) {
//       return next(
//         new ErrorHandler("Please Select A CRM For This Customer", 404)
//       );
//     } else {
//       customer.crm = employee.empName;
//     }
//
//     //Generating Subtotal & Discount
//     const netAmount =
//       payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * vat);
//     const discountAmount = discountTk.reduce((a: number, b: number) => a + b);
//
//     if (!customer && netAmount > Number(req.body?.paidAmount)) {
//       return next(
//         new ErrorHandler("Due Only Possible With Registered Customer", 404)
//       );
//     }
//
//     const products: Product[] = [];
//
//     if (req.body?.invoiceStatus === InvoiceStatus.Hold) {
//       return next(new ErrorHandler("Invoice Status Already In Hold", 400));
//     }
//
//     for (let i = 0; i < items.length; i++) {
//       let product;
//       if (showroom) {
//         product = await Product.findOne({
//           where: {
//             itemCode: items[i].itemCode,
//             showroomName: showroom.showroomName,
//           },
//         });
//       } else
//         product = await Product.findOne({
//           where: { itemCode: items[i].itemCode },
//         });
//
//       if (product) {
//         products.push(product);
//       }
//     }
//
//     if (products.length === 0) {
//       return next(new ErrorHandler("No unsold items found", 404));
//     } else {
//       for (let i = 0; i < products.length; i++) {
//         products[i].sellingStatus = ProductStatus.Sold;
//         const discount = Math.round(
//           (discounts[i] * 100) / products[i].sellPrice
//         );
//         const sellPriceAfterDiscount = products[i].sellPrice - discountTk[i];
//         Object.assign(products[i], {
//           discount,
//           sellPriceAfterDiscount: sellPriceAfterDiscount,
//         });
//         await products[i].save();
//
//         const employee = await Employee.findOne({where:{empPhone:employees[i]}})
//
//         if(!employee?.sales.includes(products[i])){
//           employee?.sales.push(products[i])
//           await employee?.save();
//         }
//       }
//     }
//
//     invoice.products = products;
//     invoice.businessName = "SPARKX Lifestyle";
//
//     invoice.invoiceStatus =
//       netAmount <= paidAmount ? InvoiceStatus.Paid : InvoiceStatus.Due;
//     invoice.invoiceAmount = Number(netAmount);
//     invoice.paidAmount = Number(paidAmount);
//     invoice.changeAmount = Math.round(
//       Number(netAmount <= paidAmount ? paidAmount - netAmount : 0)
//     );
//     invoice.dueAmount = Math.round(
//       Number(netAmount > paidAmount ? netAmount - paidAmount : 0)
//     );
//     invoice.customerName = customer.customerName;
//     invoice.customerMobile = customer.customerPhone;
//
//     invoice.quantity = products.length;
//     invoice.discountAmount = Number(discountAmount);
//     invoice.vat = vat;
//
//     customer.due = Math.round(customer.due + invoice.dueAmount);
//     customer.paid = Math.round(customer.paid + invoice.paidAmount);
//     customer.invoices.push(invoice);
//
//     await customer.save();
//     await invoice.save();
//     res.status(200).json(invoice);
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

export const getInvoices: ControllerFn = async (req, res, _next) => {
  const showroom = await Showroom.findOne({ where: { id: req.showroomId } });
  const { from_date, to_date, showroom_name } = req.query as {
    from_date: string;
    to_date: string;
    showroom_name: string;
  };

  if (showroom && req.showroomId) {
    const repository = dataSource.getRepository(Invoice);
    const qb = repository
      .createQueryBuilder('invoice')
      .where('invoice.showroomName = :showroomName', {
        showroomName: showroom.showroomName
      });
    FindOptionsUtils.joinEagerRelations(qb, qb.alias, repository.metadata);
    if (from_date && to_date) {
      qb.where('invoice.createdAt BETWEEN :from_date AND :to_date', {
        from_date: new Date(from_date),
        to_date: new Date(to_date)
      });
    }

    const invoices = await qb.getMany();
    res.status(200).json(invoices);
  } else {
    const repository = dataSource.getRepository(Invoice);
    const qb = repository.createQueryBuilder('invoice');

    FindOptionsUtils.joinEagerRelations(qb, qb.alias, repository.metadata);
    if (from_date && to_date) {
      await qb
        .where('Date(invoice.createdAt)>= :from_date', { from_date })
        .andWhere('Date(invoice.createdAt) <= :to_date', { to_date });
    }
    if (showroom_name) {
      qb.where('invoice.showroomName = :showroom_name', { showroom_name })
        .andWhere('Date(invoice.createdAt)>= :from_date', { from_date })
        .andWhere('Date(invoice.createdAt) <= :to_date', { to_date });
    }

    const invoices = await qb.getMany();
    res.status(200).json(invoices);
  }
};
