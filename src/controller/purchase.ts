import Purchase from '../entities/purchase';
import { ControllerFn } from '../types';

export const getPurchase: ControllerFn = async (_, res) => {
  const purchases = await Purchase.find();
  res.status(200).json(purchases);
};
