import {ControllerFn} from "../types";
import Customer from '../entities/customer'
import Showroom from '../entities/showroom'
import ErrorHandler from "../utils/errorHandler";

export const getCustomers: ControllerFn = async (req, res, _next) => {
    const showroom = await Showroom.findOne({where: {id: req.showroomId}})
    if (req.showroomId && showroom) {
        res.status(200).json(showroom.customer)
    } else {
        const customers = await Customer.find()
        res.status(200).json(customers)
    }

}
export const createCustomer: ControllerFn = async (req, res, next) => {
    const {customerName, customerPhone} = req.body as Customer

    if (!customerName || !customerPhone) {
        return next(new ErrorHandler('Customer Name and Phone are required', 400))
    }

    const showroom = await Showroom.findOne({where: {id: req.showroomId}})

    const isExist = await Customer.findOne({where: {customerPhone}, relations: {products: true}})

    if (isExist) {
        return next(new ErrorHandler('Customer with this Phone already exists', 400))
    }

    if (req.showroomId && showroom) {
        const customer = Customer.create(req.body)
        showroom.customer.push(customer)
        await showroom.save()
        await customer.save()
        res.status(201).json(customer)


    } else {

        const customer = Customer.create(req.body)
        const headOffice = await Showroom.findOne({where: {showroomCode: 'HO'}})
        if (!headOffice) return next(new ErrorHandler('Showroom not found', 400))
        headOffice?.customer.push(customer)
        await headOffice.save()
        await customer.save()
        res.status(201).json(customer)
    }


}

export const deleteCustomer: ControllerFn = async (req, res, next) => {
    const id = req.params.id
    const customer = await Customer.findOne({where: {id}, relations: {products: true}})

    if (!customer) {
        return next(new ErrorHandler('Customer does not exist', 400))
    }
    await customer.remove()

    res.status(200).json(await Customer.find())
}

export const updateCustomer: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const customer = await Customer.findOne({where: {id}, relations: {products: true}})

    if (!customer) {
        return next(new ErrorHandler('Customer does not exist', 400))
    }

    Object.assign(customer, req.body)

    await customer.save()

    res.status(200).json(customer)
}