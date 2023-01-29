import WareHouse from '../entities/warehouse';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createWarehouse: ControllerFn = async (req, res, next) => {
    const {whCode, whName} = req.body as WareHouse;

    if (!whCode || !whName) {
        return next(new ErrorHandler('Please enter Required Information', 404));
    }

    const isExist = await WareHouse.findOne({where: {whCode}});

    if (isExist) {
        return next(
            new ErrorHandler('Warehouse with this code already exist', 404)
        );
    }

    const warehouse = WareHouse.create(req.body);

    await warehouse.save();

    return res.status(200).json(warehouse);
};
export const updateWarehouse = async () => {
};
export const deleteWarehouse = async () => {
};
export const getWarehouse: ControllerFn = async (_req, res) => {
    const warehouses = await WareHouse.find();

    return res.status(200).json(warehouses);
};
