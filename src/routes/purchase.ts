import express from "express";
import {getPurchase} from "../controller/purchase";

const purchase = express.Router()


purchase.route('/').get(getPurchase)

export default purchase