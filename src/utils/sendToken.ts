import { NextFunction, Response } from "express";
import sanitizedConfig from "../config";
import User from "../entities/user";
import ErrorHandler from "./errorHandler";

export function sendToken(
  token: string,
  user: User,
  res: Response,
  next: NextFunction
) {
  if (!token) {
    return next(
      new ErrorHandler(
        "Please Login Again There are some unexpected error",
        404
      )
    );
  }

  res
    .cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 12,
      httpOnly: true,
      sameSite: "none",
      secure: sanitizedConfig.NODE_ENV === "production",
    })
    .status(200)
    .json({ token, user });
}
