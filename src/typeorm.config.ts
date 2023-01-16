import {DataSource} from 'typeorm';
import config from './config';

import {Barcode, User, Product, WareHouse, ProductGroup, Category, Showroom, Supplier, Invoice} from "./entities";

const dataSource = new DataSource({
    type: 'postgres',
    username: config.DB_USER,
    password: config.DB_PASS,
    host: config.DB_HOST,
    database: config.DB_NAME,
    logging: config.NODE_ENV === 'development',
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
        Invoice
    ]
});

// @ts-ignore
export default dataSource;
