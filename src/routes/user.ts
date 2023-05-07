import express from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../controller/user";
import { isAuth, isSuperAdmin } from "../middleware/isAuth";

export const userRoutes = express.Router();

userRoutes.route("/").post(createUser).get(isAuth, isSuperAdmin, getUsers);
userRoutes.route("/:id").patch(isAuth, isSuperAdmin, updateUser);
userRoutes.route("/:id").delete(isAuth, isSuperAdmin, deleteUser);
export default userRoutes;
