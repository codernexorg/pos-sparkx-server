import {ControllerFn} from "../types";
import ErrorHandler from "../utils/errorHandler";
import Tax from "../entities/tax";

export const createTax: ControllerFn = async (req, res, next) => {

    if (!req.body?.tax || !req.body?.taxName) {
        return next(new ErrorHandler('Tax & Tax Name Required', 404))
    }
    const tax = new Tax()

    tax.taxName = req.body?.taxName

    tax.tax = req.body?.tax

    await tax.save()
    res.status(201).json(tax)
}

export const getTax: ControllerFn = async (_req, res, _next) => {
    res.status(200).json(await Tax.find())
}