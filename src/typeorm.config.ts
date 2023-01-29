import {DataSource} from 'typeorm';
import config from './config';

import {
    Barcode,
    Brand,
    Category,
    Customer,
    Employee,
    Invoice,
    Product,
    ProductGroup,
    Showroom,
    Supplier,
    User,
    WareHouse
} from "./entities";

const dataSource = new DataSource({
    type: 'postgres',
    username: config.DB_USER,
    password: config.DB_PASS,
    host: config.DB_HOST,
    database: config.DB_NAME,
    logging: config.NODE_ENV === 'production',
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
        Invoice, Brand, Customer, Employee

    ]
});

// @ts-ignore
export default dataSource;
