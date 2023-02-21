import {DataSource} from 'typeorm';
import config from './config';
import Showroom from './entities/showroom'
import User from "./entities/user";
import Product from './entities/product'
import Purchase from './entities/purchase'
import Expenses from './entities/expenses'
import WareHouse from './entities/warehouse'
import Supplier from './entities/supplier'
import ExpenseType from './entities/expenseType'
import Business from './entities/business'
import Barcode from './entities/barcode'
import Brand from './entities/brand'
import ProductGroup from './entities/productGroup'
import Category from './entities/category'
import Salary from './entities/salary'
import Invoice from './entities/invoice'
import Customer from './entities/customer'
import Tax from './entities/tax'
import TransferProduct from './entities/transfer'
import Employee from "./entities/employee";

const dataSource = new DataSource({
    type: 'mysql',
    username: config.DB_USER,
    password: config.DB_PASS,
    host: config.DB_HOST,
    database: config.DB_NAME,
    logging: config.NODE_ENV === 'development',
    synchronize: true,
    port: config.DB_PORT,
    entities: [
        Showroom,
        User,
        Product,
        WareHouse,
        ProductGroup,
        Category,
        Supplier,
        Barcode,
        Invoice, Brand, Customer, TransferProduct, Tax, Business, Expenses, ExpenseType, Salary, Purchase, Employee

    ]
});

// @ts-ignore
export default dataSource;
