import Showroom from '../entities/showroom';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createShowroom: ControllerFn = async (req, res, next) => {
    const {showroomName, showroomCode} = req.body as Showroom;

    if (!showroomCode || !showroomName) {
        return next(new ErrorHandler('Please Provide Required Data', 404));
    }

    const isExist = await Showroom.findOne({where: {showroomCode}});

    if (isExist) {
        return next(new ErrorHandler('Showroom with this code already exist', 404));
    }

    const showroom = Showroom.create({...req.body, creator: req.user});

    await showroom.save();

    return res.status(200).json(showroom);
};
export const updateShowroom = async () => {
};
export const deleteShowroom = async () => {
};
export const getShowroom: ControllerFn = async (_req, res) => {
    const showrooms = await Showroom.find();
    return res.status(200).json(showrooms);
};
