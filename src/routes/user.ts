import express from 'express';
import {createUser, getUsers} from '../controller/user';
import {isAuth, isSuperAdmin} from "../middleware/isAuth";

const router = express.Router();

router.route('/').post(createUser).get(isAuth, isSuperAdmin, getUsers);

export default router;
