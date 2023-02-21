import express from "express";
import ErrorHandler from "../utils/errorHandler";
import Business from "../entities/business";

const businessRoutes = express.Router();

businessRoutes.get('/', async (_req, res) => {
    res.status(200).json(await Business.find())
})

businessRoutes.patch('/:id', async (req, res, next) => {
    const id = req.params.id;

    const business = await Business.findOne({where: {id: Number(id)}})

    console.log(req.body)

    if (!business) {
        return next(new ErrorHandler('Business not found', 404))
    }
    Object.assign(business, req.body)

    await business.save()

    res.status(200).json(business)
})

export default businessRoutes