import express from "express";
import {
  createShowroom,
  deleteShowroom,
  getShowroom,
  updateShowroom,
} from "../controller/shoroom";

export const showroomRoutes = express.Router();

showroomRoutes.route("/").post(createShowroom).get(getShowroom);
showroomRoutes.route("/:id").patch(updateShowroom).delete(deleteShowroom);

export default showroomRoutes;
