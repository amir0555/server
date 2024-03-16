const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const { requireSignin, adminMiddleware } = require("../common-middleware");


// create new order
router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      //   group cart items by shopId
      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      // create an order for each shop
      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user": req.params.userId , status: { $ne: "create" },}).sort({
        createdAt: -1,
      }).populate("service").populate("seller", "firstname lastname PhoneNumber")
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        seller: req.params.shopId,
        status: { $ne: "create" },
       }).sort({
        createdAt: -1,
      }).populate("service");

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.get(
  "/getOrdersByID/:id", requireSignin, adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id).populate("service").populate("seller", "firstname lastname").populate("user");

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    console.log({data:req.body})
    try {
      const order = await Order.findByIdAndUpdate(req.params.id , {
        status:req.body.status
      },
      { new: true }
      );
      res.status(200).json({
        message: 'Order successfully updated',
      });

    } catch (error) {
      console.log(error)
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// give a refund ----- user
router.put(
  "/userUpdateOrder/:id",requireSignin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if(order.userIdea !== "nothing"){
        return next(new ErrorHandler("You have already given your answer", 400));

      }
      if(req.body.type === "yes"){
        order.userIdea = req.body.type;
  
        await order.save({ validateBeforeSave: false });
  
        res.status(200).json({
          success: true,
          order,
          message: "Thank you for ordering from us.",
        });

      }else{
        order.userIdea = req.body.type;
        await order.save({ validateBeforeSave: false });
        res.status(200).json({
          success: true,
          order,
          message:"We have received your answer. We will get back to you as soon as possible.",
        });

      }

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successfull!",
      });

      if (req.body.status === "Refund Success") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock += qty;
        product.sold_out -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all orders --- for admin
router.get(
  "/adminAllOrders",requireSignin, adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        status: { $ne: "create" },
      }).sort({
        deliveredAt: -1,
        createdAt: -1,
      }).populate("service").populate("seller", "firstname lastname").populate("user", "firstname lastname").exec();
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order for admin 
router.put(
  "/updateOrderType/:id",
  requireSignin,
  adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if (order.type === "withdrawable") {
        return next(new ErrorHandler("Order is already accepted", 400));
      } else if (order.type === "non-withdrawable") {
        const updateOrder = await Order.findOneAndUpdate(
          { _id: req.params.id },
          { type: "withdrawable" }
        ).populate("service").populate("seller", "firstname lastname").populate("user", "firstname lastname")

        const seller = await Shop.findOneAndUpdate(
          { _id: order.seller },
          { $inc: { availableBalance: order.SellerPrice } },
          { new: true }
        );

        res.status(201).json({
          message: 'Order successfully updated',
          seller,
          updateOrder
        });
      }
    } catch (error) {
      console.log(error)
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
