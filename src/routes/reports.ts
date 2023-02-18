import express from "express";
import {sellsReport} from "../controller/reports";

const reportsRoutes = express.Router()

reportsRoutes.get('/sells', sellsReport)

export default reportsRoutes