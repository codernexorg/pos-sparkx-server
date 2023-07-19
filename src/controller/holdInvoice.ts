import { In } from "typeorm";
import HoldInvoice from "../entities/holdInvoice";
import Product from "../entities/product";
import dataSource from "../typeorm.config";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";

export const createHoldInvoice: ControllerFn = async (req, res, next) => {
  try {
    const prevHold = await dataSource.getRepository(HoldInvoice).find();
    const hold = new HoldInvoice();
    const itemCodes = req.body.items.map((item: any) => item.itemCode);

    const products = await dataSource
      .getRepository(Product)
      .find({ where: { itemCode: In(itemCodes) } });

    hold.bkash = req.body.bkash;
    hold.cash = req.body.cash;
    hold.cbl = req.body.cbl;
    for (const prodcut of products) {
      hold.addProduct(prodcut);
    }
    hold.crmPhone = req.body?.crmPhone;
    hold.paidAmount = req.body?.paidAmount;
    hold.customerPhone = req.body?.customerPhone;
    hold.vat = req.body?.vat;
    hold.subtotal = req.body?.subtotal;
    hold.invoiceNo = "HOLD" + (prevHold.length + 1).toString().padStart(6, "0");

    await dataSource.getRepository(HoldInvoice).save(hold);

    res.status(201).json(hold);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHold: ControllerFn = async (req, res, next) => {
  const holds = await dataSource.getRepository(HoldInvoice).find();

  res.status(200).json(holds);
};

export const removeHold: ControllerFn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hold = await dataSource
      .getRepository(HoldInvoice)
      .createQueryBuilder("hold")
      .where("hold.id=:id", { id })
      .getOne();

    if (!hold) {
      return next(new ErrorHandler("Hold Not Exist on Database", 404));
    }
    await hold.remove();
    res.status(200).json(await HoldInvoice.find());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
