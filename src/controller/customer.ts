import xlsx from 'xlsx';
import Customer from '../entities/customer';
import Showroom from '../entities/showroom';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const getCustomers: ControllerFn = async (req, res, _next) => {
  const showroom = await Showroom.findOne({ where: { id: req.showroomId } });
  if (req.showroomId && showroom) {
    res.status(200).json(showroom.customer);
  } else {
    const customers = await Customer.find();
    res.status(200).json(customers);
  }
};
export const createCustomer: ControllerFn = async (req, res, next) => {
  try {
    const { customerName, customerPhone } = req.body as Customer;

    if (!customerName || !customerPhone) {
      return next(
        new ErrorHandler('Customer Name and Phone are required', 400)
      );
    }
    const isExist = await Customer.findOne({ where: { customerPhone } });

    if (isExist) {
      return next(
        new ErrorHandler('Customer with this Phone already exists', 400)
      );
    }
    let showroom;

    if (req.showroomId) {
      showroom = await Showroom.findOne({
        where: { id: req.showroomId }
      });
    } else {
      showroom = await Showroom.findOne({
        where: { showroomCode: 'HO' }
      });
    }

    if (!showroom) {
      return next(new ErrorHandler('Showroom not found', 400));
    }

    const customer = Customer.create(req.body);
    showroom.customer.push(customer);
    await showroom.save();
    await customer.save();
    res.status(201).json(customer);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const deleteCustomer: ControllerFn = async (req, res, next) => {
  try {
    const id = req.params.id;
    const customer = await Customer.findOne({ where: { id } });

    if (!customer) {
      return next(new ErrorHandler('Customer does not exist', 400));
    }
    await customer.remove();

    res.status(200).json(await Customer.find());
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const updateCustomer: ControllerFn = async (req, res, next) => {
  try {
    const id = req.params.id;

    const customer = await Customer.findOne({ where: { id } });

    if (!customer) {
      return next(new ErrorHandler('Customer does not exist', 400));
    }

    Object.assign(customer, req.body);

    await customer.save();

    res.status(200).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const importCustomers: ControllerFn = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(new ErrorHandler('No File Found', 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (
      !data[0].customerName ||
      !data[0].customerPhone ||
      !data[0].showroomCode
    ) {
      return next(
        new ErrorHandler(
          'Supplier name And Contact Number & Showroom Code not found ',
          400
        )
      );
    }

    data.every(async items => {
      const showroom = await Showroom.findOne({
        where: { showroomCode: items.showroomCode }
      });
      const customer = new Customer();

      customer.customerName = items?.customerName;
      customer.customerPhone = items?.customerPhone;
      customer.customerEmail = items?.customerEmail;
      customer.customerAddress = items?.customerAddress;

      showroom?.customer.push(customer);
      await customer.save();
      await showroom?.save();
    });

    res.status(201).json({ message: 'Supplier Imported Successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
