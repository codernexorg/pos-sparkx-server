import xlsx from "xlsx";
import Supplier from "../entities/supplier";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const createSupplier: ControllerFn = async (req, res, next) => {
  try {
    const { supplierName, contactPersonName, contactPersonNumber } =
      req.body as Supplier;
    if (!supplierName || !contactPersonNumber || !contactPersonName) {
      return next(new ErrorHandler("Please provide required information", 404));
    }
    const isExist = await dataSource.getRepository(Supplier).findOne({
      where: { contactPersonNumber },
    });
    if (isExist) {
      return next(
        new ErrorHandler("Supplier with this mobile number already exist", 404)
      );
    }

    const supplier = Supplier.create(req.body);

    await supplier.save();
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const getSupplier: ControllerFn = async (_req, res) => {

    const suppliers = await dataSource
      .getRepository(Supplier)
      .createQueryBuilder("supplier")
      .getMany();
    res.status(200).json(suppliers);
};

export const updateSupplier: ControllerFn = async (req, res, next) => {
  const { id } = req.params;

  const supplier = await dataSource
    .getRepository(Supplier)
    .createQueryBuilder("supplier")
    .where("supplier.id=:id", { id })
    .getOne();

  if (!supplier) return next(new ErrorHandler("Supplier not found", 404));
  Object.assign(supplier, req.body);
  await supplier.save();
  res.status(200).json(supplier);
};

export const deleteSupplier: ControllerFn = async (req, res, next) => {
  const { id } = req.params;

  const supplier = await dataSource
    .getRepository(Supplier)
    .createQueryBuilder("supplier")
    .where("supplier.id=:id", { id })
    .getOne();

  if (!supplier) return next(new ErrorHandler("Supplier not found", 404));
  await supplier.remove();
  res.status(200).json(await dataSource.getRepository(Supplier).find());
};

export const importSupplier: ControllerFn = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(new ErrorHandler("No File Found", 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (!data[0].supplierName || !data[0].contactPersonNumber) {
      return next(
        new ErrorHandler("Supplier Name, Contact Number, Showroom Code not found", 400)
      );
    }

    data.every(async (items) => {

      const supplier = new Supplier();

      supplier.supplierName = items?.supplierName;
      supplier.supplierEmail = items?.supplierEmail;
      supplier.supplierAddress = items?.supplierAddress;
      supplier.contactPersonName = items?.contactPersonName;
      supplier.contactPersonNumber = items?.contactPersonNumber;
      supplier.altContactNumber = items?.altContactNumber;
      supplier.extraInfo = items?.extraInfo;

      await supplier.save();
    });

    res.status(201).json({ message: "Supplier Imported Successfully" });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};
