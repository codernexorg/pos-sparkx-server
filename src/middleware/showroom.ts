import {Showroom} from "../entities";
import ErrorHandler from "../utils/errorHandler";
import {ControllerFn} from "../types";


export const sellMiddleware: ControllerFn = async (req, _res, next) => {
    const user = req.user
    const showroom = await Showroom.find()

    if (showroom.includes(user!.assignedShowroom)) {
        next()
    } else {
        return next(new ErrorHandler("You don't have access to this showroom", 404))
    }
}