import xlsx from 'xlsx';
import Showroom from '../entities/showroom';
import Supplier from '../entities/supplier';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createSupplier: ControllerFn = async (req, res, next) => {
  try {
    const { supplierName, contactPersonName, contactPersonNumber } =
      req.body as Supplier;

    let showroom: Showroom | null;

    if (!supplierName || !contactPersonNumber || !contactPersonName) {
      return next(new ErrorHandler('Please provide required information', 404));
    }
    const isExist = await Supplier.findOne({
      where: { contactPersonNumber }
    });
    if (isExist) {
      return next(
        new ErrorHandler('Supplier with this mobile number already exist', 404)
      );
    }

    if (req.showroomId) {
      showroom = await Showroom.findOne({ where: { id: req.showroomId } });
    } else {
      showroom = await Showroom.findOne({ where: { showroomCode: 'HO' } });
    }

    const supplier = Supplier.create(req.body);

    await supplier.save();
    if (showroom) {
      showroom.supplier.push(supplier);
      await showroom.save();
    }

    return res.status(200).json(supplier);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
export const updateSupplier = async () => {};
export const deleteSupplier = async () => {};
export const getSupplier: ControllerFn = async (req, res) => {
  const showroom = await Showroom.findOne({ where: { id: req.showroomId } });

  if (showroom && req.showroomId) {
    res.status(200).json(showroom.supplier);
  } else {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  }
};

export const importSupplier: ControllerFn = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(new ErrorHandler('No File Found', 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (!data[0].supplierName || !data[0].contactPersonNumber) {
      return next(
        new ErrorHandler('Supplier name And Contact Number not found', 400)
      );
    }

    data.every(async items => {
      const showroom = await Showroom.findOne({
        where: { id: items.showroomCode }
      });
      const supplier = new Supplier();

      supplier.supplierName = items?.supplierName;
      supplier.supplierEmail = items?.supplierEmail;
      supplier.supplierAddress = items?.supplierAddress;
      supplier.contactPersonName = items?.contactPersonName;
      supplier.contactPersonNumber = items?.contactPersonNumber;
      supplier.altContactNumber = items?.altContactNumber;
      supplier.extraInfo = items?.extraInfo;

      showroom?.supplier.push(supplier);

      await showroom?.save();
      await supplier.save();
    });

    res.status(201).json({ message: 'Supplier Imported Successfully' });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};
