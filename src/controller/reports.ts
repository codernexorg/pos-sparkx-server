//Sells Reports

import {ControllerFn} from "../types";
import {Invoice} from "../entities";
import dataSource from "../typeorm.config";

export const sellsReport: ControllerFn = async (req, res, _next) => {
    const {to_date, from_date = new Date(Date.now()), today} = req.query

    const qb = dataSource.getRepository(Invoice).createQueryBuilder('invoice').orderBy('createdAt')


    if (to_date && from_date) {
        qb.where('Date(invoice.createdAt) <= :from_date', {
            from_date
        }).andWhere('Date(invoice.createdAt) >= :to_date', {to_date})
    }
    if (today) {
        qb.where('Date(invoice.createdAt) = :today', {
            today
        })
    }
    const sells = await qb.getMany()

    return res.status(200).json(sells)
}

