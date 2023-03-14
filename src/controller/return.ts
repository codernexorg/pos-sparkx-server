import Returned from "../entities/Returned";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";
import Product from "../entities/product";
import Invoice from "../entities/invoice";
import Customer from "../entities/customer";
import { ProductStatus } from "../types";

export default class ReturnProduct {
  public static async createReturnProduct(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    function calculateReturnedAmount(productsToReturn: Product[]) {
      return productsToReturn.reduce(
        (total, product) => total + product.sellPriceAfterDiscount,
        0
      );
    }

    // const returnProduct = async (
    //   productCodes: string[]
    // ): Promise<Product[]> => {
    //   const productsToReturn: Product[] = [];
    //   const product = await dataSource
    //     .getRepository(Product)
    //     .findOne({ where: { id: Number(productCodes[0]) } });
    //   if (product) {
    //     product.sellingStatus = ProductStatus.Unsold;
    //     product.returnStatus = 1;
    //     productsToReturn.push(product);
    //   }
    //   return productsToReturn;
    // };

    try {
      const { productCodes, invoiceId } = req.body as {
        productCodes: string[];
        invoiceId: number;
      };

      if (!productCodes.length) {
        return _next(new ErrorHandler("No Product To Return", 404));
      }
      const invoice = await dataSource
        .getRepository(Invoice)
        .findOne({ where: { id: invoiceId } });
      if (!invoice) {
        return _next(new ErrorHandler("There are no Invoice To Return", 404));
      }

      const customer = await Customer.findOne({
        where: { customerPhone: invoice.customerMobile },
      });

      if (!customer) {
        return _next(
          new ErrorHandler("There are no Customer To Return From", 404)
        );
      }

      const productToReturn: Product[] = [];
      for (const productCode of productCodes) {
        const product = await dataSource.getRepository(Product).findOne({
          where: { itemCode: productCode },
          relations: { employee: true },
        });
        if (product) {
          productToReturn.push(product);
        }
      }

      const returned = new Returned();
      returned.amount = calculateReturnedAmount(productToReturn);
      returned.customerPhone = customer.customerPhone;
      returned.note = req.body?.note;
      for (const product of productToReturn) {
        product.returnStatus = 1;
        product.sellingStatus = ProductStatus.Unsold;
        product.discount = 0;
        product.sellPriceAfterDiscount = product.sellPrice;
        returned.addReturn(product);
        customer.returnPurchase(product);
        customer.paid = customer.paid - returned.amount;
        await invoice.returnProductFromInvoice(product);
        await customer.save();
        await product.save();
      }

      await returned.save();
      res.status(200).json("Returned Successful");
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }

  public static async getReturnProduct(
    _req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    res.status(200).json(await Returned.find());
  }
}
