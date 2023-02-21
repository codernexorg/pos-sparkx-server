import {ControllerFn} from "../types";

import ErrorHandler from "../utils/errorHandler";
import Employee from "../entities/employee";
import Showroom from "../entities/showroom";

export const createEmp: ControllerFn = async (req, res, next) => {
    const {empName, designation, empPhone, showroom} = req.body as Employee
    console.log(req.body)

    if (!empName || !designation || !empPhone || !showroom) {
        return next(new ErrorHandler("Please Provide required Information", 400))
    }

    const isExist = await Employee.findOne({where: {empPhone}})

    if (isExist) {
        return next(new ErrorHandler("Employee Already Exists", 400))
    }

    const employee = new Employee()
    employee.empPhone = empPhone
    employee.empName = empName
    employee.designation = designation
    employee.empEmail = req.body?.empEmail
    employee.empAddress = req.body?.empAddress
    employee.showroom = req.body?.showroom
    employee.empSalary = req.body?.empSalary

    await employee.save()

    res.status(201).json(employee)

}

export const getEmployee: ControllerFn = async (req, res, _next) => {
    const showroom = await Showroom.findOne({
        where: {
            id: req.showroomId
        }
    })
    if (showroom && req.showroomId) {
        res.status(200).json(await Employee.find({where: {showroom: showroom.showroomName}}))
    } else {
        res.status(200).json(await Employee.find())
    }

}

export const updateEmployee: ControllerFn = async (req, res, _next) => {
    const id = req.params.id

    const employee = await Employee.findOne({where: {id: id}})

    if (!employee) {
        return _next(new ErrorHandler('Employee Does not Exists', 404))
    }
    Object.assign(employee, req.body)

    await employee.save()
    res.status(200).json(employee)
}

export const deleteEmployee: ControllerFn = async (req, res, _next) => {
    const id = req.params.id

    const employee = await Employee.findOne({where: {id: id}})

    if (!employee) {
        return _next(new ErrorHandler('Employee Does not Exists', 404))
    }

    await employee.remove()
    res.status(200).json(await Employee.find())
}