import express from "express";
import ReportController from "../controller/reports";

const reportsRoutes = express.Router();

reportsRoutes.get("/sales", ReportController.sellReport);
reportsRoutes.get("/sales/daily", ReportController.dailySalesReport);
reportsRoutes.get("/sales/daily/employee", ReportController.dailySalesEmployee);
reportsRoutes.get('/sales/mom/qty', ReportController.employeeMoMSalesQTY);
reportsRoutes.get('/sales/mom/amount', ReportController.employeeMoMSalesAmount);
reportsRoutes.get('/sales/customer/qty',ReportController.customerYOYQty)
export default reportsRoutes;