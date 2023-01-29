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
export const updateShowroom: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const showroom = await Showroom.findOne({where: {id}, relations: {invoices: true}})
    if (!showroom) {
        return next(new ErrorHandler('Showroom Does not exist', 404))
    }

    Object.assign(showroom, req.body)

    await showroom.save(req.body)
    res.status(200).json(showroom)
};
export const deleteShowroom: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const showroom = await Showroom.findOne({where: {id}, relations: {invoices: true}})
    if (!showroom) {
        return next(new ErrorHandler('Showroom Does not exist', 404))
    }

    Object.assign(showroom, req.body)

    await showroom.remove()
    res.status(200).json({message: 'Showroom Deleted', updatedData: await Showroom.find({relations: {invoices: true}})})
};
export const getShowroom: ControllerFn = async (_req, res) => {
    const showrooms = await Showroom.find({relations: {invoices: true}});
    return res.status(200).json(showrooms);
};
