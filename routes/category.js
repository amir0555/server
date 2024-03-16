
const express = require("express");
const {
  addCategory,
  getCategories,
  updateCategories,
  deleteCategories,
  getCategoryById
} = require("../controller/category");
const {
  requireSignin,
  adminMiddleware,
  superAdminMiddleware,
} = require("../common-middleware");
const router = express.Router();
const shortid = require("shortid");
const path = require("path");
const { upload } = require("../multer");



router.post(
  "/category/create",
  requireSignin,
  adminMiddleware,
  upload.single("file"),
  addCategory
);
router.get("/category/getcategory", getCategories);
router.post(
  "/category/update",
  requireSignin,
  adminMiddleware,
  upload.single("file"),
  updateCategories
);
router.post(
  "/category/delete",
  requireSignin,
  adminMiddleware,
  deleteCategories
);
router.route('/category/:id').get(getCategoryById)

module.exports = router;

