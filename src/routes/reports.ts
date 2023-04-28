import express from "express";
import ReportController, {
  getTopCustomer,
  salesAmountReport,
  salesQtyReport,
} from "../controller/reports";

const reportsRoutes = express.Router();

reportsRoutes.get("/sales", ReportController.sellReport)

const reportController = new ReportController()

reportsRoutes.get("/sales/qty", salesQtyReport);
reportsRoutes.get("/sales/amount",salesAmountReport);
reportsRoutes.get("/sales/daily", ReportController.dailySalesReport);
reportsRoutes.get("/sales/daily/employee", ReportController.dailySalesEmployee);
reportsRoutes.get('/sales/mom/qty', ReportController.employeeMoMSalesQTY);
reportsRoutes.get('/sales/mom/amount', ReportController.employeeMoMSalesAmount);
reportsRoutes.get('/sales/customer/qty',ReportController.customerYOYQty)
reportsRoutes.get('/sales/customer/amount',ReportController.customerYOYAmount)
reportsRoutes.get('/inventory/selling-status',ReportController.soldUnsoldReport)
reportsRoutes.get('/inventory/size',ReportController.inventorySizeReport)
reportsRoutes.get('/top/customer',getTopCustomer)
reportsRoutes.get('/unit',reportController.unitToUnitComparison)
export default reportsRoutes;