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
    .leftJoinAndSelect("showroom.purchases", "purchases");

  if (args.showroomCode) {
    qb.where("showroom.showroomCode=:showroomCode", {
      showroomCode: args.showroomCode,
    });
  } else {
    qb.andWhere("showroom.id=:id", { id: args.id });
  }

  return await qb.getOne();
};
