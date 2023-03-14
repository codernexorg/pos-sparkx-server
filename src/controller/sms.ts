import {ControllerFn} from "../types";
import ErrorHandler from "../utils/errorHandler";
import Business from "../entities/business";

export const sendSms: ControllerFn = async (req, res, next) => {

    const {customers, message} = req.body as { customers: string[], message: string };

    if (!customers.length) {
        return next(new ErrorHandler('No customers found', 400));
    }
    if (!message.length) {
        return next(new ErrorHandler('No message found', 400));
    }
    const business = await Business.find()

    if (!business.length) {
        return next(new ErrorHandler('SomeThing Went Wrong', 400))
    }
    try {
        customers.forEach((number) => console.log(number))
        res.status(200).json('Message Send')
    } catch (err) {
        res.status(200).json({
            success: false, message: err.message
        })
    }
}