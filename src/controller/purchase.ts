import Purchase from "../entities/purchase";
import { ControllerFn } from "../types";
import dataSource from "../typeorm.config";
import Showroom from "../entities/showroom";

export const getPurchase: ControllerFn = async (req, res) => {
  const showroom = await dataSource
    .getRepository(Showroom)
    .createQueryBuilder("showroom")
    .leftJoinAndSelect("showroom.purchases", "purchase")
    .where("showroom.id=:id", { id: req.showroomId })
    .getOne();

  const purchases =
    showroom?.purchases ||
    (await Purchase.find({ relations: { products: true } }));
  res.status(200).json(purchases);
};
