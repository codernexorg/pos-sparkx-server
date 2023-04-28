import Showroom from "../entities/showroom";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const createShowroom: ControllerFn = async (req, res, next) => {
  const { showroomName, showroomCode } = req.body as Showroom;

  if (!showroomCode || !showroomName) {
    return next(new ErrorHandler("Please Provide Required Data", 404));
  }

  const isExist = await Showroom.findOne({ where: { showroomCode } });

  if (isExist) {
    return next(new ErrorHandler("Showroom with this code already exist", 404));
  }
  const showroom = new Showroom();
  showroom.showroomCode = req.body.showroomCode;
  showroom.showroomName = req.body.showroomName;
  showroom.showroomMobile = req.body?.showroomMobile;
  showroom.showroomAddress = req.body?.showroomAddress;

  await showroom.save();

  return res.status(200).json(showroom);
};
export const updateShowroom: ControllerFn = async (req, res, next) => {
  try {
    const id = req.params.id;

    const showroom = await Showroom.findOne({
      where: { id },
      relations: { invoices: true }
    });
    if (!showroom) {
      return next(new ErrorHandler('Showroom Does not exist', 404));
    }

    Object.assign(showroom, req.body);

    await showroom.save(req.body);
    res.status(200).json(showroom);
  } catch (error) {
    console.log(
      '🚀 ~ file: shoroom.ts:35 ~ constupdateShowroom:ControllerFn= ~ error:',
      error
    );
    res.status(500).json({ message: error.message });
  }
};
export const deleteShowroom: ControllerFn = async (req, res, next) => {
  try {
    const id = req.params.id;

    const showroom = await Showroom.findOne({
      where: { id },
      relations: { invoices: true }
    });
    if (!showroom) {
      return next(new ErrorHandler('Showroom Does not exist', 404));
    }

    Object.assign(showroom, req.body);

    await showroom.remove();
    res
      .status(200)
      .json(await Showroom.find({ relations: { invoices: true } }));
  } catch (e) {
    console.log(
      '🚀 ~ file: shoroom.ts:66 ~ constdeleteShowroom:ControllerFn= ~ e:',
      e
    );
    res.status(500).json({ message: e.message });
  }
};
export const getShowroom: ControllerFn = async (_req, res) => {
  const showrooms = await dataSource.getRepository(Showroom).createQueryBuilder('showroom')
      .leftJoinAndSelect('showroom.invoices', 'invoices').leftJoinAndSelect('showroom.returned', 'returned').getMany()
  return res.status(200).json(showrooms);
};
