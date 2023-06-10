import Showroom from "../entities/showroom";
import dataSource from "../typeorm.config";

export const getShowroom = async (args: {
  showroomCode?: string;
  id?: number;
}) => {
  const qb = dataSource
    .getRepository(Showroom)
    .createQueryBuilder("showroom")
    .leftJoinAndSelect("showroom.customer", "customer")
    .leftJoinAndSelect("showroom.invoices", "invoices")
    .leftJoinAndSelect("showroom.employees", "employees")
    .leftJoinAndSelect("showroom.returned", "returned")
    .leftJoinAndSelect("showroom.purchases", "purchases");

  if (args.showroomCode) {
    qb.where("showroom.showrooCode", { showroomCode: args.showroomCode });
  } else {
    qb.where("showroom.id=:id", { id: args.id });
  }

  return await qb.getOne();
};
