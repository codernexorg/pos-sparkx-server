import User from '../entities/user';
import verifyToken from '../helper/verifyToken';
import {ControllerFn, UserAccessLevel, UserRole} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const isAuth: ControllerFn = async (req, _res, next) => {
    const token = req.cookies.token as string | undefined || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(new ErrorHandler('Please Login', 401));
    }

    const userId = await verifyToken(token);

    const user = await User.findOne({
        where: {
            id: userId
        }
    });

    if (!user?.id) {
        return next(new ErrorHandler('Please Login', 401));
    }
    req.user = user;

    next();
};

export const isSuperAdmin: ControllerFn = async (req, __res, next) => {
    const role = req.user?.role;
    if (role !== UserRole.SA) {
        return next(
            new ErrorHandler('You are not authorized to perform this action', 401)
        );
    }
    next();
};

export const commonAuth: ControllerFn = async (req, _res, next) => {
    const role = req.user?.role as string;
    if (UserAccessLevel.includes(role)) {
        return next();
    } else {
        return next(
            new ErrorHandler('You are not authorized to perform this action', 401)
        );
    }
};

export const isManager: ControllerFn = async (req, _res, next) => {
    const role = req.user?.role;

    if (role !== UserRole.SM) {
        return next(
            new ErrorHandler('You are not authorized to perform this action', 401)
        );
    }
    next();
};

export const isSalesOfficer: ControllerFn = async (req, _res, next) => {
    const role = req.user?.role;

    if (role !== UserRole.SO) {
        return next(
            new ErrorHandler('You are not authorized to perform this action', 401)
        );
    }
    next();
};
