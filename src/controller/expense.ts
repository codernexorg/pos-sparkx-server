import {ControllerFn} from "../types";
import ErrorHandler from "../utils/errorHandler";
import ExpenseType from "../entities/expenseType";
import Expenses from "../entities/expenses";
import Showroom from "../entities/showroom";
import Employee from "../entities/employee";
import Salary from "../entities/salary";

export const getExpenseTypes: ControllerFn = async (_req, res, _next) => {
    const expenseTypes = await ExpenseType.find();
    res.status(200).json(expenseTypes);
}

export const createExpenseType: ControllerFn = async (req, res, next) => {

    const {expenseName} = req.body;

    if (!expenseName) {
        return next(new ErrorHandler("expenseName is required", 400));
    }
    const expenseType = ExpenseType.create(req.body);
    await expenseType.save()
    res.status(200).json(expenseType)
}

export const createExpense: ControllerFn = async (req, res, next) => {
    const {expenseCost, expenseName, empId} = req.body

    if (!expenseCost) {
        return next(new ErrorHandler('Expense Cost Must Be Provide', 404));
    }


    let showroom: Showroom | null;

    if (req.showroomId) {
        showroom = await Showroom.findOne({where: {id: req.showroomId}})
    } else {
        showroom = await Showroom.findOne({where: {showroomCode: "HO"}})
    }

    if (expenseName.includes('Salary') && !empId) {
        return next(new ErrorHandler('Salary Expense Must Be Provide An Employee', 400));
    }


    const employee = await Employee.findOne({where: {id: empId}})

    if (employee && employee.empSalary < expenseCost) {
        return next(new ErrorHandler('Salary Expense Must Be Less Than Employee Basic Salary', 400));
    }

    const expense = new Expenses()
    expense.expenseCost = expenseCost
    expense.expenseName = expenseName
    expense.expenseReason = req.body?.expenseReason


    if (showroom) {
        showroom.expenses.push(expense)
        await showroom.save()
    }

    if (employee) {
        const salary = new Salary()
        salary.salaryAmount = expenseCost
        await salary.save()

        employee.salary.push(salary)
        await employee.save()

        expense.employeeId = employee.id
    }


    await expense.save()
    res.status(201).json(expense)
}

export const getExpenses: ControllerFn = async (req, res, _next) => {
    if (req.showroomId) {
        const showroom = await Showroom.findOne({where: {id: req.showroomId}})
        res.status(200).json(showroom?.expenses)
    } else {
        res.status(200).json(await Expenses.find({relations: {showroom: true}}))
    }
}

