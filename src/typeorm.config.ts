import { DataSource } from 'typeorm';
import config from './config';
import Barcode from './entities/barcode';
import Category from './entities/category';
import Product from './entities/product';
import ProductGroup from './entities/productGroup';
import Showroom from './entities/showroom';
import Supplier from './entities/supplier';
import User from './entities/user';
import WareHouse from './entities/warehouse';
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
    Barcode
  ]
});

export default dataSource;
