import express from 'express';
import { loginUser, logoutUser } from '../controller/user';

const authRoute = express.Router();

authRoute.post('/login', loginUser);
authRoute.post('/logout', logoutUser);

export default authRoute;
