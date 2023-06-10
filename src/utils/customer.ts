import Customer from "../entities/customer";
import dataSource from "../typeorm.config";

export const getCustomer = async (args: {
  customerPhone?: string;
  id?: number;
}) => {
  const qb = dataSource
    .getRepository(Customer)
    .createQueryBuilder("customer")
    .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
    .leftJoinAndSelect("customer.returnedProducts", "returnedProducts")
    .leftJoinAndSelect("customer.showroom", "showroom");

  if (args.customerPhone) {
    qb.where("customer.customerPhone=:customerPhone", {
      customerPhone: args.customerPhone,
    });
  } else if (args.id) {
    qb.where("customer.id", { id: args.id });
  }

  return await qb.getOne();
};
