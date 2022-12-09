import express from 'express';
import { createUser, getUsers } from '../controller/user';

const router = express.Router();

router.route('/').post(createUser).get(getUsers);

export default router;
