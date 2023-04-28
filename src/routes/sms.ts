import express from "express";
import { sendSingleSms } from "../controller/sms";

const smsRoutes = express.Router();

smsRoutes.post('/',sendSingleSms)


export default smsRoutes
