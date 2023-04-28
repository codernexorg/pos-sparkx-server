import WareHouse from "../entities/warehouse";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const createWarehouse: ControllerFn = async (req, res, next) => {
  const { whCode, whName } = req.body as WareHouse;

  if (!whCode || !whName) {
    return next(new ErrorHandler("Please enter Required Information", 404));
  }

  const isExist = await dataSource
    .getRepository(WareHouse)
    .findOne({ where: { whCode } });

  if (isExist) {
    return next(
      new ErrorHandler("Warehouse with this code already exist", 404)
    );
  }

  const warehouse = dataSource.getRepository(WareHouse).create(req.body);

  await dataSource.getRepository(WareHouse).save(warehouse);

  return res.status(200).json(warehouse);
};
export const updateWarehouse: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const wareHouse = await WareHouse.findOne({where: {whId: id}})
    if (!wareHouse) {
        return next(new ErrorHandler('Location Does not exist', 404))
    }

    Object.assign(wareHouse, req.body)

    await wareHouse.save(req.body)
    res.status(200).json(wareHouse)
};
export const deleteWarehouse: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const wareHouse = await WareHouse.findOne({where: {whId: id}})
    if (!wareHouse) {
        return next(new ErrorHandler('Location Does not exist', 404))
    }

    Object.assign(wareHouse, req.body)


    await wareHouse.remove()
    res.status(200).json(await WareHouse.find())
};
export const getWarehouse: ControllerFn = async (_req, res) => {
    const warehouses = await dataSource.getRepository(WareHouse).find();

    return res.status(200).json(warehouses);
};
