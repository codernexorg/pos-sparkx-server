import {DataSource} from 'typeorm';
import config from './config';

import {
    Barcode,
    Brand,
    Business,
    Category,
    Customer,
    Employee,
    Expenses,
    ExpenseType,
    Invoice,
    Product,
    ProductGroup,
    Salary,
    Showroom,
    Supplier,
    Tax,
    TransferProduct,
    User,
    WareHouse
} from "./entities";

const dataSource = new DataSource({
    type: 'mysql',
    username: config.DB_USER,
    password: config.DB_PASS,
    host: config.DB_HOST,
    database: config.DB_NAME,
    // logging: config.NODE_ENV === 'development',
    synchronize: true,
    port: config.DB_PORT,
    entities: [
        User,
        Product,
        WareHouse,
        ProductGroup,
        Category,
        Showroom,
        Supplier,
        Barcode,
        Invoice, Brand, Customer, Employee, TransferProduct, Tax, Business, Expenses, ExpenseType, Salary

    ]
});

// @ts-ignore
export default dataSource;
