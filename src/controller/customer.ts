import {ControllerFn} from "../types";
import {Customer} from "../entities";
import ErrorHandler from "../utils/errorHandler";

export const getCustomers: ControllerFn = async (_req, res, _next) => {
    const customers = await Customer.find()
    res.status(200).json(customers)
}
export const createCustomer: ControllerFn = async (req, res, next) => {
    const {customerName, customerPhone} = req.body as Customer

    if (!customerName || !customerPhone) {
        return next(new ErrorHandler('Customer Name and Phone are required', 400))
    }

    const isExist = await Customer.findOne({where: {customerPhone}})

    if (isExist) {
        return next(new ErrorHandler('Customer with this Phone already exists', 400))
    }
    const customer = Customer.create(req.body)

    await customer.save()
    res.status(201).json(customer)
}

export const deleteCustomer: ControllerFn = async (req, res, next) => {
    const id = req.params.id
    const customer = await Customer.findOne({where: {id}})

    if (!customer) {
        return next(new ErrorHandler('Customer does not exist', 400))
    }
    await customer.remove()

    res.status(200).json({message: 'Customer Deleted', data: customer})
}

export const updateCustomer: ControllerFn = async (req, res, next) => {
    const id = req.params.id

    const customer = await Customer.findOne({where: {id}})

    if (!customer) {
        return next(new ErrorHandler('Customer does not exist', 400))
    }
    customer.customerName = req.body?.customerName || customer.customerName
    customer.customerPhone = req.body?.customerPhone || customer.customerPhone
    customer.customerEmail = req.body?.customerEmail || customer.customerEmail
    customer.customerAddress = req.body?.customerAddress || customer.customerAddress

    await customer.save({
        reload: true
    })

    res.status(200).json({message: 'Customer Updated', data: customer})
}