import Returned from "../entities/Returned";
import Product from "../entities/product";
import Invoice from "../entities/invoice";
import Customer from "../entities/customer";
import { ControllerFn, ProductStatus } from "../types";
import ErrorHandler from "../utils/errorHandler";
import Employee from "../entities/employee";
import Showroom from "../entities/showroom";
import dataSource from "../typeorm.config";

export const createReturnProduct: ControllerFn = async (req, res, _next) => {
  try {
    // Get product codes and invoice ID from the request body
    const { productCodes, invoiceId } = req.body as {
      productCodes: string[];
      invoiceId: number;
    };

    // Check if there are any product codes
    if (!productCodes.length) {
      return _next(new ErrorHandler("No products to return", 404));
    }

    // Find the showroom
    const showroom =
      (await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.returned", "returned")
        .where("showroom.id=:id", { id: req.showroomId })
        .getOne()) ||
      (await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.returned", "returned")
        .where("showroom.showroomCode='HO'")
        .getOne());

    if (!showroom) {
      return _next(new ErrorHandler("Showroom not found", 404));
    }

    // Find the invoice
    const invoice = await dataSource
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.products", "products")
      .where("invoice.id=:invoiceId", { invoiceId })
      .getOne();
    if (!invoice) {
      return _next(new ErrorHandler("Invoice not found", 404));
    }

    // Find the customer
    const customer = await dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .leftJoinAndSelect("customer.returnedProducts", "returnedProducts")
      .where("customer.customerPhone=:customerMobile", {
        customerMobile: invoice.customerMobile,
      })
      .getOne();

    if (!customer) {
      return _next(new ErrorHandler("Customer not found", 404));
    }

    // Find the products to return
    const productsToReturn = await Product.createQueryBuilder("product")
      .where("product.itemCode IN (:...productCodes)", { productCodes })
      .leftJoinAndSelect("product.employee", "employee")
      .leftJoinAndSelect("employee.sales", "sales")
      .getMany();
    if (!productsToReturn.length) {
      return _next(new ErrorHandler("Products not found", 404));
    }

    console.log(productsToReturn);

    // Calculate the returned amount
    const returnedAmount = productsToReturn.reduce(
      (total, product) => total + product.sellPriceAfterDiscount,
      0
    );

    // Create a new Returned object
    const returned = new Returned();
    returned.amount = returnedAmount;
    returned.customerPhone = customer.customerPhone;
    returned.check = req.body?.check;
    returned.salesDate = invoice.createdAt;

    // Update the products, customer, and invoice
    for (const product of productsToReturn) {
      product.returnStatus = 1;
      product.sellingStatus = ProductStatus.Unsold;
      product.discount = 0;
      returned.addReturn(product);
      returned.invoiceNo = invoice.showroomInvoiceCode;

      customer.paid =
        customer.paid - returnedAmount > 0
          ? customer.paid - returnedAmount
          : customer.paid;
      customer.returnPurchase(product);

      invoice.invoiceAmount = invoice.invoiceAmount - returnedAmount;
      invoice.paidAmount = invoice.paidAmount - returnedAmount;
      invoice.returnProductFromInvoice(product);

      const employee = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where("emp.id=:id", { id: product.employee.id })
        .getOne();
      if (employee) {
        employee.returnSale(product);
      }

      await product.save();

      await Promise.all([product.save(), employee?.save()]);
    }

    // Save the changes to the database
    await Promise.all([customer.save(), invoice.save(), returned.save()]);

    showroom.returned.push(returned);
    await showroom.save();

    // Return a success response
    res.status(200).json("Returned successfully");
  } catch (error) {
    // Log the error
    console.error(error);

    // Return an error response
    const statusCode = error instanceof ErrorHandler ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
export const getReturnProduct: ControllerFn = async (req, res, _next) => {
  const showroom = await dataSource
    .getRepository(Showroom)
    .createQueryBuilder("showroom")
    .leftJoinAndSelect("showroom.returned", "returned")
    .leftJoinAndSelect("returned.products", "products")
    .leftJoinAndSelect("products.employee", "employee")
    .where("showroom.id=:id", { id: req.showroomId })
    .getOne();
  if (req.showroomId && showroom) {
    res.status(200).json(showroom.returned);
  } else
    res
      .status(200)
      .json(
        await dataSource
          .getRepository(Returned)
          .createQueryBuilder("returned")
          .leftJoinAndSelect("returned.products", "products")
          .leftJoinAndSelect("products.employee", "employee")
          .getMany()
      );
};
