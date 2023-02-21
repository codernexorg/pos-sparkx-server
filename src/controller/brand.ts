import Brand from '../entities/brand';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const getBrands: ControllerFn = async (_req, res, _next) => {
    const brands = await Brand.find();

    res.status(200).json(brands);
};

export const createBrand: ControllerFn = async (req, res, next) => {
    const {brandName} = req.body as Brand;

    if (!brandName) {
        return next(new ErrorHandler('Please provide a brand name', 404));
    }

    const brand = Brand.create(req.body);

    await brand.save();

    res.status(201).json(brand);
};

export const updateBrand: ControllerFn = async (req, res, next) => {
    const {id} = req.params;

    const brand = await Brand.findOne({
        where: {id}
    });

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    Object.assign(brand, req.body)

    await brand.save();

    res.status(200).json(brand);
};

export const deleteBrand: ControllerFn = async (req, res, next) => {
    const {id} = req.params;

    if (!id) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    try {
        await Brand.delete({id});

        res.status(200).json(await Brand.find());
    } catch (error) {
        res.status(200).json({message: 'Brand Not Deleted', success: false});
    }
};
