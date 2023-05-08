import xlsx from "xlsx";
import Customer from "../entities/customer";
import Showroom from "../entities/showroom";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const getCustomers: ControllerFn = async (req, res, _next) => {
  const showroom = await dataSource
    .getRepository(Showroom)
    .createQueryBuilder("showroom")
    .leftJoinAndSelect("showroom.customer", "customer")
    .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
    .leftJoinAndSelect("customer.returnedProducts", "returnedProducts")
    .where("showroom.id=:id", { id: req.showroomId })
    .getOne();
  const customers =
    showroom?.customer ||
    (await dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .leftJoinAndSelect("customer.returnedProducts", "returnedProducts")
      .getMany());
  res.status(200).json(customers);
};
export const createCustomer: ControllerFn = async (req, res, next) => {
  try {
    const { customerName, customerPhone } = req.body as Customer;

    if (!customerName || !customerPhone) {
      return next(
        new ErrorHandler("Customer Name and Phone are required", 400)
      );
    }
    const isExist = await Customer.findOne({ where: { customerPhone } });

    if (isExist) {
      return next(
        new ErrorHandler("Customer with this Phone already exists", 400)
      );
    }
    let showroom;

    if (req.showroomId) {
      showroom = await Showroom.findOne({
        where: { id: req.showroomId },
      });
    } else {
      showroom = await Showroom.findOne({
        where: { showroomCode: "HO" },
      });
    }

    if (!showroom) {
      return next(new ErrorHandler("Showroom not found", 400));
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
      return next(new ErrorHandler("Customer does not exist", 400));
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
      return next(new ErrorHandler("Customer does not exist", 400));
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
      return next(new ErrorHandler("No File Found", 400));
    }
    const workbook = xlsx.read(file?.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data: any[] = xlsx.utils.sheet_to_json(sheet);


    const requiredFieldsCustomer:{key:keyof {customerName:string,customerPhone:string,showroomCode:string},label:string}[] = [
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'showroomCode', label: 'Showroom Code' },
    ];

    for (const customer of data) {
      const missingFields = requiredFieldsCustomer.filter(field => !customer[field.key]);

      if (missingFields.length > 0) {
        const missingFieldsLabels = missingFields.map((field) => field.label).join(', ');
        return next(new ErrorHandler(`Customer is missing value(s) for ${missingFieldsLabels}`,404)) ;
      }
    }


    data.every(async (items) => {
      const showroom = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect('showroom.customers','customers')
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: items.showroomCode,
        })
        .getOne();

      const customer = new Customer();

      customer.customerName = items?.customerName;
      customer.customerPhone = items?.customerPhone;
      customer.customerEmail = items?.customerEmail;
      customer.customerAddress = items?.customerAddress;
      customer.crm = items?.crmPhone;
      customer.paid = items?.paid;

      showroom?.customer.push(customer);
      await customer.save();
      await showroom?.save();
    });

    res.status(201).json({ message: "Supplier Imported Successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
