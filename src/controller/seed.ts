import { ControllerFn, UserRole } from "../types";
import bcrypt from "bcryptjs";
import Business from "../entities/business";
import User from "../entities/user";
import dataSource from "../typeorm.config";
import Showroom from "../entities/showroom";
import Barcode from "../entities/barcode";

export const seed: ControllerFn = async (_req, res, _next) => {
  const isBusiness = await Business.find();

  if (!isBusiness.length) {
    const business = new Business();

    business.name = "SPARKX Lifestyle";
    business.phone = "018888888";
    business.address = "Dhaka, Bangladesh";
    business.defaultTax = 0;
    business.currencyCode = "BDT";

    await business.save();
  }

  const hashPwd = await bcrypt.hash("Pass@#1234@#", 10);

  const isUser = await User.find();

  if (!isUser.length) {
    const user = new User();
    user.email = "superadmin@sparkx.com.bd";
    user.username = "pos.sparkx";
    user.password = hashPwd;
    user.name = "SPARKX Lifestyle";
    user.role = UserRole.SA;
    user.assignedShowroom = "All";

    await user.save();
  }

  const showroom = await dataSource.getRepository(Showroom).find();

  if (!showroom.length) {
    const headOffice = new Showroom();
    headOffice.showroomName = "Head Office";
    headOffice.showroomCode = "HO";
    headOffice.showroomMobile = "0199999247";
    headOffice.showroomAddress = "Dhaka, Bangladesh";

    await headOffice.save();
  }

  const barcodes = await dataSource.getRepository(Barcode).find();
  if (!barcodes.length) {
    const barcode = new Barcode();
    barcode.name = "Standard Barcode";
    barcode.description = `Standard (3x1)" Barcode Settings`;
    barcode.stickerInRow = 2;
    barcode.stickerWidth = 1.5;
    barcode.stickerHeight = 1;
    barcode.paperWidth = 3;
    barcode.paperHeight = 1;

    barcode.save();
  }

  res.status(200).json("Seed Successful");
};
