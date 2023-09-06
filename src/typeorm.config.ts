import { DataSource } from "typeorm";
import config from "./config";
import Showroom from "./entities/showroom";
import User from "./entities/user";
import Product from "./entities/product";
import Purchase from "./entities/purchase";
import Supplier from "./entities/supplier";
import Business from "./entities/business";
import Barcode from "./entities/barcode";
import ProductGroup from "./entities/productGroup";
import Category from "./entities/category";
import Invoice from "./entities/invoice";
import Customer from "./entities/customer";
import Tax from "./entities/tax";
import TransferProduct from "./entities/transfer";
import Employee from "./entities/employee";
import BarcodeDefault from "./entities/barcodeDefault";
import Payment from "./entities/Payment";
import HoldInvoice from "./entities/holdInvoice";
import ReturnProduct from "./entities/returnProduct";

const appDataSource = new DataSource({
  type: "mysql",
  username: config.DB_USER,
  password: config.DB_PASS,
  host: config.DB_HOST,
  database: config.DB_NAME,
  // logging: config.NODE_ENV === 'development',
  synchronize: true,
  port: config.DB_PORT,
  entities: [
    Showroom,
    User,
    Product,
    ProductGroup,
    Category,
    Supplier,
    Barcode,
    Invoice,
    Customer,
    TransferProduct,
    Tax,
    Business,
    Purchase,
    Employee,
    BarcodeDefault,
    Payment,
    HoldInvoice,
    ReturnProduct,
  ],
});

export default appDataSource;
