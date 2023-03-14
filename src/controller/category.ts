import Category from "../entities/category";
import dataSource from "../typeorm.config";
import { ControllerFn } from "../types";
import ErrorHandler from "../utils/errorHandler";

export const createCat: ControllerFn = async (req, res, next) => {
  const { categoryName } = req.body as Category;

  if (!categoryName) {
    return next(new ErrorHandler("Please Enter Required Information", 404));
  }

  const category = new Category();
  category.categoryName = categoryName;

  await category.save();

  res.status(201).json(category);
};

export const getCat: ControllerFn = async (_req, res,_next) => {
  return res.status(200).json(await Category.find());
};
export const updateCat: ControllerFn = async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return next(new ErrorHandler("Category Not Exist", 404));
  }
  const category = await dataSource
    .createQueryBuilder()
    .update(Category)
    .set(req.body)
    .where("id = :id", { id })
    .execute();
  return res.status(200).json(category);
};
export const deleteCaT: ControllerFn = async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return next(new ErrorHandler("Category Not Exist", 404));
  }

  await dataSource
    .createQueryBuilder()
    .delete()
    .where("id = :id", { id })
    .execute();

  return res.status(200).json({ success: true, message: "Category Deleted" });
};
