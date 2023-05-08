import Showroom from "../entities/showroom";
import { ControllerFn, UserRole } from "../types";
import ErrorHandler from "../utils/errorHandler";
import dataSource from "../typeorm.config";

export const showRoomAccess: ControllerFn = async (req, _res, next) => {
  const user = req.user;
  if (!user) {
    return next(new ErrorHandler("Unauthorized User", 401));
  }
  const showroom = await dataSource
    .getRepository(Showroom)
    .createQueryBuilder("showroom")
    .where("showroom.showroomName=:showroomName", {
      showroomName: user.assignedShowroom,
    })
    .getOne();

  if (user.assignedShowroom === "All" && user.role.includes(UserRole.SA)) {
    next();
  } else if (
    (showroom && user.role.includes(UserRole.SO)) ||
    user.role.includes(UserRole.SM)
  ) {
    req.showroomId = showroom?.id;
    next();
  } else {
    return next(
      new ErrorHandler("You Don't have permission to This Showroom", 401)
    );
  }
};
