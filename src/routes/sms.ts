import express from "express";
import { sendSingleSms } from "../controller/sms";

export const smsRoutes = express.Router();

smsRoutes.post("/", sendSingleSms);

export default smsRoutes;
