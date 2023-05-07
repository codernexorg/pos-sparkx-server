import express from "express";
import {
  createExpense,
  createExpenseType,
  getExpenses,
  getExpenseTypes,
} from "../controller/expense";

export const expenseRoutes = express.Router();

expenseRoutes
  .route("/expense-types")
  .get(getExpenseTypes)
  .post(createExpenseType);
expenseRoutes.route("/").post(createExpense).get(getExpenses);

export default expenseRoutes;
