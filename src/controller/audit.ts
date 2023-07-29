import Product from '../entities/product';
import appDataSource from '../typeorm.config';
import { ControllerFn } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const getAudit: ControllerFn = async (req, res, next) => {
  try {
    const { showroomName, productGroup, supplierName } = req.query;
    if (!showroomName) {
      return next(
        new ErrorHandler('Showroom Must Be Select For Auditing', 400)
      );
    }
    const productRepository = appDataSource.getRepository(Product);
    if (!supplierName && !productGroup) {
      const products = await productRepository
        .createQueryBuilder('product')
        .where('product.showroomName=:showroomName', { showroomName })
        .andWhere('product.sellingStatus="Unsold"')
        .getMany();
      console.log(products);

      res.status(200).json(products);
    } else if (supplierName && productGroup) {
      const products = await productRepository
        .createQueryBuilder('product')
        .where('product.showroomName=:showroomName', { showroomName })
        .andWhere('product.supplierName=:supplierName', { supplierName })
        .andWhere('product.productGroup=:productGroup', { productGroup })
        .andWhere('product.sellingStatus="Unsold"')
        .getMany();
      res.status(200).json(products);
    } else if (productGroup) {
      const products = await productRepository
        .createQueryBuilder('product')
        .where('product.showroomName=:showroomName', { showroomName })
        .andWhere('product.productGroup=:productGroup', { productGroup })
        .andWhere('product.sellingStatus="Unsold"')
        .getMany();
      res.status(200).json(products);
    } else if (supplierName) {
      const products = await productRepository
        .createQueryBuilder('product')
        .where('product.showroomName=:showroomName', { showroomName })
        .andWhere('product.supplierName=:supplierName', { supplierName })
        .andWhere('product.sellingStatus="Unsold"')
        .getMany();
      res.status(200).json(products);
    }
  } catch (e) {
    res.status(200).json({ message: e.message });
  }
};
