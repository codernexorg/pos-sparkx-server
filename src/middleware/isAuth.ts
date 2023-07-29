import User from '../entities/user';
import verifyToken from '../helper/verifyToken';
import { ControllerFn, UserAccessLevel, UserRole } from '../types';
import ErrorHandler from '../utils/errorHandler';
import dataSource from '../typeorm.config';

export const isAuth: ControllerFn = async (req, _res, next) => {
  try {
    const token =
      (req.cookies.token as string | undefined) ||
      req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new ErrorHandler('Please Login', 401));
    }

    const userId = await verifyToken(token);

    const user = await dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.id=:userId', { userId })
      .getOne();

    if (!user?.id) {
      return next(new ErrorHandler('Please Login', 401));
    }
    req.user = user;

    next();
  } catch (err) {
    console.log(err);
  }
};

export const isSuperAdmin: ControllerFn = async (req, __res, next) => {
  try {
    const role = req.user?.role;
    if (role !== UserRole.SA) {
      return next(
        new ErrorHandler('You are not authorized to perform this action', 403)
      );
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

export const commonAuth: ControllerFn = async (req, _res, next) => {
  try {
    const role = req.user?.role as string;
    if (UserAccessLevel.includes(role)) {
      return next();
    } else {
      return next(
        new ErrorHandler('You are not authorized to perform this action', 403)
      );
    }
  } catch (err) {
    console.log(err);
  }
};

export const isManager: ControllerFn = async (req, _res, next) => {
  try {
    const role = req.user?.role;

    if (role !== UserRole.SM) {
      return next(
        new ErrorHandler('You are not authorized to perform this action', 403)
      );
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

export const isSalesOfficer: ControllerFn = async (req, _res, next) => {
  try {
    const role = req.user?.role;

    if (role !== UserRole.SO) {
      return next(
        new ErrorHandler('You are not authorized to perform this action', 403)
      );
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

export const isManagerOrAdmin: ControllerFn = async (req, _res, next) => {
  try {
    const role = req.user?.role;

    if (role === UserRole.SA || role === UserRole.SM) {
      return next();
    }
    return next(
      new ErrorHandler('You are not authorized to perform this action', 403)
    );
  } catch (err) {
    console.log(err);
  }
};
