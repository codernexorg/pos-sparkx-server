import express from "express";
import {sendSms} from "../controller/sms";

const smsRoutes = express.Router();

smsRoutes.post('/send', sendSms)

export default smsRoutes;