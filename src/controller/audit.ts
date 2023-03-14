import Product from '../entities/product';
import { ControllerFn, ProductStatus } from '../types';
import ErrorHandler from '../utils/errorHandler';

export const getAudit: ControllerFn = async (req, res, next) => {
  try {
    const { showroomName, productGroup, supplierName } = req.query;
    if (!showroomName) {
      return next(
        new ErrorHandler('Showroom Must Be Select For Auditing', 400)
      );
    }
    if (!supplierName && !productGroup) {
      res.status(200).json(
        await Product.find({
          where: { showroomName, sellingStatus: ProductStatus.Unsold }
        })
      );
    } else if (supplierName && productGroup) {
      res.status(200).json(
        await Product.find({
          where: {
            showroomName,
            supplierName,
            productGroup,
            sellingStatus: ProductStatus.Unsold
          }
        })
      );
    } else if (productGroup) {
      res.status(200).json(
        await Product.find({
          where: {
            showroomName,
            productGroup,
            sellingStatus: ProductStatus.Unsold
          }
        })
      );
    } else if (supplierName) {
      res.status(200).json(
        await Product.find({
          where: {
            showroomName,
            supplierName,
            sellingStatus: ProductStatus.Unsold
          }
        })
      );
    }
  } catch (e) {
    res.status(200).json({ message: e.message });
  }
};
