import { ControllerFn } from "../types";

import ErrorHandler from "../utils/errorHandler";
import Employee from "../entities/employee";
import Showroom from "../entities/showroom";

export const createEmp: ControllerFn = async (req, res, next) => {
  try {
    const { empName, designation, empPhone } = req.body as Employee;

    if (!empName || !designation || !empPhone) {
      return next(new ErrorHandler("Please Provide required Information", 400));
    }
    let showroom: Showroom | null;

    if (req.showroomId) {
      showroom = await Showroom.findOne({ where: { id: req.showroomId } });
    } else {
      showroom = await Showroom.findOne({ where: { showroomCode: "HO" } });
    }

    if (!showroom) {
      return next(new ErrorHandler("Showroom Not Found", 400));
    }

    const isExist = await Employee.findOne({ where: { empPhone } });

    if (isExist) {
      return next(new ErrorHandler("Employee Already Exists", 400));
    }

    const employee = new Employee();
    employee.empPhone = empPhone;
    employee.empName = empName;
    employee.designation = designation;
    employee.empEmail = req.body?.empEmail;
    employee.empAddress = req.body?.empAddress;
    employee.empSalary = req.body?.empSalary;

    if (showroom) {
      showroom.employees.push(employee);
      await showroom.save();
    }

    await employee.save();

    res.status(201).json(employee);
  } catch (e) {
    console.log(e);
    res.status(500).json(e.message);
  }
};

export const getEmployee: ControllerFn = async (req, res, next) => {
    let showroom: Showroom | null;

    if (req.showroomId) {
        showroom = await Showroom.findOne({ where: { id: req.showroomId } });
    } else {
        showroom = await Showroom.findOne({ where: { showroomCode: "HO" } });
    }

    if (!showroom) {
        return next(new ErrorHandler("Showroom Not Found", 400));
    }

    res.status(200).json(showroom.employees)

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