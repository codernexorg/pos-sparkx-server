import express from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../controller/user";
import { isAuth, isSuperAdmin } from "../middleware/isAuth";

const router = express.Router();

router.route('/').post(createUser).get(isAuth, isSuperAdmin, getUsers);
router.route('/:id').patch(isAuth,isSuperAdmin,updateUser)
router.route('/:id').delete(isAuth,isSuperAdmin,deleteUser)
export default router;
