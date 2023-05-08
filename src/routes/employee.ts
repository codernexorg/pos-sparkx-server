import express from "express";
import {
  createEmp,
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from "../controller/employee";

export const employeeRoutes = express.Router();

employeeRoutes.route("/").get(getEmployee).post(createEmp);
employeeRoutes.route("/:id").patch(updateEmployee).delete(deleteEmployee);
export default employeeRoutes;
