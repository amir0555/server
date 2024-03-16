const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const { requireSignin, adminMiddleware } = require("../common-middleware");
const { createEmailWorker } = require("../services/EmailWorker");


const fs = require("fs");

// create product
router.post(
  "/create-product",
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        const files = req.files;
        const imageUrls = files.map((file) => `${file.filename}`);

        const productData = req.body;
        productData.images = imageUrls;
        productData.shop = shop._id;

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
   catchAsyncErrors(async (req, res, next) => {

    try {
      const products = await Product.find({ shop: req.params.id , show:true });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);
router.get(
  "/productsById/:id",
   catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.findOne({ _id: req.params.id, state: "accepted" })
      .populate("category", "name")
      .populate("shopId", "firstname lastname avatar")
         
      if(products){
        res.status(201).json({
          success: true,
          message:"deal are exist to buy",
          products,
        });
      }else{
        res.status(201).json({
          success: true,
          message:"deal are still waiting admin   to accept",
          products:{},
        });

      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);


router.get(
  "/serviceById/:id",  requireSignin, adminMiddleware,
   catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.findById({ _id:req.params.id }).populate("shopId", "firstname lastname");
     
      if(products){
        res.status(200).json({
          success: true,
          message:"deal are exist to buy",
          products,
        });
      }else{
        res.status(200).json({
          success: true,
          message:"deal are still waiting admin   to accept",
          products:{},
        });

      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

router.put(
  "/delete/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {

    try {
      const updatedService = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { show: false }
        ,{
          new:true

        }
      ).populate("shopId",  "_id  email")
      createEmailWorker({
      from: process.env.EMAIL_ADDRESS,
      to:  updatedService.shopId.email,
      template: 'dealDelete',
      subject: 'your deal was delete ',
      context: {
        name: updatedService.name,
         } })
        res.status(200).json({
          success: true,
          message: "Service has been deleted successfully",
          sellerId: updatedService.shop
        });
    
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);
router.put(
  "/serviceById/:id",
  requireSignin,
  adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const updatedService = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { state: "accepted" },
        { new: true }
      );

      if (updatedService && updatedService.state === "accepted") {
        res.status(200).json({
          success: true,
          message: "Service has been accepted successfully",
          products: updatedService,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to accept the service",
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);
// delete product of a shop


router.delete(
  "/serviceById/:id", requireSignin,
  adminMiddleware,

  catchAsyncErrors(async (req, res, next) => {

    try {
      const productId = req.params.id;

      const productData = await Product.findById(productId);
      if(productData.state === "accepted"){
       return next(new ErrorHandler("you can not delete this service!", 500));
      }
      productData.images.forEach((imageUrl) => {
        const filename = imageUrl;
        const filePath = `uploads/${filename}`;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      });

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 500));
      }
      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);
// get all products
router.get(
  "/getProducts",requireSignin,
  adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({state: { $ne: "accepted" },}).sort({ createdAt: -1 });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({state: { $ne: "accepted" },}).sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
module.exports = router;
