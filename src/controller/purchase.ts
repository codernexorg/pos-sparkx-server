import {ControllerFn} from "../types";
import Purchase from "../entities/purchase";

export const getPurchase: ControllerFn = async (_, res) => {
    const purchases = await Purchase.find()
    res.status(200).json(purchases)
}

export const createPurchase: ControllerFn = async (_req, _res) => {
}