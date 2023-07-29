import Showroom from '../entities/showroom';
import dataSource from '../typeorm.config';

export const getShowroom = async (args: {
  showroomCode?: string;
  id?: number;
}) => {
  return await dataSource.getRepository(Showroom).findOne({
    where: args.showroomCode
      ? {
          showroomCode: args.showroomCode
        }
      : {
          id: args.id
        },
    relations: {
      customer: true,
      employees: true,
      invoices: true
    },
    cache: true,
    order: {
      customer: {
        customerPhone: 'DESC'
      }
    },
    transaction: true
  });
};
