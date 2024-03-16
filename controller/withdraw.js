const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const Withdraw = require("../model/withdraw");
const router = express.Router();
const { requireSignin, adminMiddleware } = require("../common-middleware");
const { createEmailWorker } = require("../services/EmailWorker");



// create withdraw request --- only for seller
router.post(
  "/create-withdraw-request",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount } = req.body;


      const order = await Withdraw.findOne({
        shop_id:req.seller._id,
        status: "Processing"
      })
      if(order){
        res.status(400).json({
          success: false,
          message: "you already have an order please wait ...",
        });
      }else{

        const data = {
          seller_bank:req.seller.withdrawMethod,
          shop_id: req.seller._id,
          amount,
        };
        const withdraw = await Withdraw.create(data);
        res.status(201).json({
          success: true,
          withdraw,
        });

      }
    } catch (error) {
      console.log(error)
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all withdraws --- admnin

router.get(
  "/getAll",
  requireSignin, adminMiddleware,  catchAsyncErrors(async (req, res, next) => {
    try {
      const withdraws = await Withdraw.find( {status:"Processing"}).populate("shop_id");
      res.status(200).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update withdraw request ---- admin
router.put(
  "/updateWithdraw/:id",
  requireSignin,
  adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      
      const withdraw = await Withdraw.findByIdAndUpdate(
        req.params.id,
        {
          status: "paid"
        },
        { new: true } // to return the updated document
      );

      const transection = {
        _id: withdraw._id,
        amount: withdraw.amount,
        updatedAt: withdraw.updatedAt,
        status: withdraw.status,
      };

      const seller = await Shop.findByIdAndUpdate(
        withdraw.shop_id,
        {
          $push: { transection: transection },
          $inc: { availableBalance: -withdraw.amount }
        },
        { new: true } // to return the updated document
      );
      
      createEmailWorker({
        from: process.env.EMAIL_ADDRESS,
        to:  seller.email,
        template: 'withdrawableAccept',
        subject: 'accept your withdrawable mony order ',
        context: {
          name: seller.firstname + " " + seller.lastname,
           } })

      res.status(200).json({
        success: true,
        withdraw,
        seller
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


module.exports = router;
