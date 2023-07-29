import Customer from '../entities/customer';
import dataSource from '../typeorm.config';

export const getCustomer = async (args: {
  customerPhone?: string;
  id?: number;
}) => {
  return await dataSource.getRepository(Customer).findOne({
    where: args.customerPhone
      ? { customerPhone: args.customerPhone }
      : { id: args.id },
    relations: {
      showroom: true,
      purchasedProducts: true,
      returnedProducts: true
    },
    cache: true,
    transaction: true,
    loadEagerRelations: true
  });
};
