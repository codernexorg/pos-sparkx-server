import express from "express";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  importSupplier,
  updateSupplier,
} from "../controller/supplier";
import multer from "multer";

export const supplierRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

supplierRoutes.route("/").post(createSupplier).get(getSupplier);
supplierRoutes.post("/import", upload.single("file"), importSupplier);
supplierRoutes.route("/:id").patch(updateSupplier).delete(deleteSupplier);
export default supplierRoutes;
