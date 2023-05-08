import express from "express";
import ErrorHandler from "../utils/errorHandler";
import Business from "../entities/business";

export const businessRoutes = express.Router();

businessRoutes.get("/", async (_req, res) => {
  const business = await Business.find();
  res.status(200).json(business[0]);
});

businessRoutes.post("/", async (req, res, _next) => {
  const business = await Business.find();

  if (business.length > 1) {
    Object.assign(business[0], req.body);
    await business[0].save();

    res.status(200).json(business[0]);
  } else {
    const business = Business.create(req.body);

    await business.save();
    res.status(200).json(business);
  }
});
businessRoutes.patch("/", async (req, res, next) => {
  const business = await Business.find();
  if (!business) {
    return next(new ErrorHandler("Business not found", 404));
  }
  Object.assign(business[0], req.body);

  await business[0].save();

  res.status(200).json(business[0]);
});

export default businessRoutes;
