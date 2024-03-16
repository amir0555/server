const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const { upload } = require("../multer");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken");
const { requireSignin, adminMiddleware } = require("../common-middleware");
const Order = require("../model/order");
const Product = require("../model/product");
const { createEmailWorker } = require("../services/EmailWorker");
const bcrypt = require("bcryptjs");





// create shop
router.post("/create-shop", upload.single("file"), async (req, res, next) => {
  try {
    let  seller = req.body;
    const email = req.body.email
    const sellerEmail = await Shop.findOne({ email });
    if (sellerEmail) {
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ message: "Error deleting file" });
        }
      });
      return next(new ErrorHandler("User already exists", 400));
    }

    const filename = req.file?.filename;
  
    if(filename){

     fileUrl = path.join(filename);
    }
    seller.avatar = fileUrl
    seller = await Shop.create(seller);
    await seller.save()
{/*    const activationToken = createActivationToken(seller);
    const activationUrl = `${process.env.CLIENT_URL}/seller/activation/${activationToken}`;
    const emailData = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      template: 'activation',
      subject: 'activation your account ',
      context: {
        token: activationUrl,
      },
    }; */}
   // createEmailWorker(emailData)
    res.status(201).json({
      success: true,
      message: `your account has been create successfully`,
    });
  } catch (error) {
    console.log(error)
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newSeller = jwt.verify(
        activation_token,
        process.env.JWT_SECRET
      );
      if (!newSeller) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { firstname,lastname,PhoneNumber,Address, ZibCode ,email, password, avatar } =
        newSeller;

      let seller = await Shop.findOne({ email });

      if (seller) {
        return next(new ErrorHandler("User already exists", 400));
      }

      seller = await Shop.create({
        firstname,lastname,PhoneNumber,Address, ZibCode ,email, password, avatar });
      await seller.save()

      sendShopToken(seller, 201, res);
    } catch (error) {
      console.log(error)
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.post("/login-shop",catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      const user = await Shop.findOne({ email }).select("+password +withdrawMethod");
        
      if (!user) {
        return next(new ErrorHandler("Please provide the correct information", 400));
      }
      const isPasswordValid = await user.comparePassword(password , process.env.JWT_SECRET);
      
      if ( user.type ==="disabled") {
        return next(
          new ErrorHandler("sorry your account has been blocked by admin", 400)
          );
        }
        if (!isPasswordValid) {
          return next(
            new ErrorHandler("Please provide the correct information", 400)
            );
          }
          
        
       await sendShopToken(user, 201, res);
    } catch (error) {
      console.log(error)
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load shop
router.get(
  "/getSeller/:id",
  requireSignin,
  adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id).populate("products")
      if (!seller) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      const orders = await Order.find({seller:req.params.id})
        .populate("service")
        .populate("user");
      const services = await Product.find({shop:req.params.id}).populate("category", "name");
      res.status(200).json({
        success: true,
        seller,
        services,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.get(
  "/SellerBy/:id",
  requireSignin,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id)
      if (!seller) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/SellerBalance/:id",
  requireSignin,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id)
      if (!seller) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      res.status(200).json({
        success: true,
        balance:seller.availableBalance
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out from shop
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


/// forget password 
router.post(
  "/forgetpassword",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email} = req.body;
      if (!email) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      
      const user = await Shop.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }
      if ( user.type ==="disabled") {
        return next(
          new ErrorHandler("sorry your account has been blocked by admin", 400)
          );
        }
        const activationToken = await jwt.sign({
          id : user._id,
          email : user.email,
          firstname : user.firstname,
          lastname : user.lastname
        }, process.env.JWT_SECRET, {
          expiresIn: "10m",
        });
        const activationUrl = `${process.env.CLIENT_URL}auth/seller/new-password?token=${activationToken}`;
    
        const emailData = {
          from: process.env.EMAIL_ADDRESS,
          to: user.email,
          template: 'forgetPassworduser',
          subject: ' did you  forget your  Password ',
          context: {
            name: user?.firstname + "  " + user?.lastname ,
            token: activationUrl,
          },
        };
       createEmailWorker(emailData)
       res.status(200).send({
        message: "check your email address to update your password "
       })
    
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//seller rest password 
router.post(
  "/reset-password",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { token, password } = req.body;

      const data = jwt.verify(token, process.env.JWT_SECRET)
      console.log({data})


      if(!data.id){
        return next(
          new ErrorHandler("token has been expired", 400)
        );
      }else{
          let hashPassword =  await bcrypt.hash(password, 10)
          const user = await Shop.findOneAndUpdate({ _id : data.id } , {
            password : hashPassword
           })
          res.status(201).json({
            success: true,
            message:"your password has been changed"
          });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await Shop.findById(req.seller._id);

      const existAvatarPath = `uploads/${existsUser.avatar}`;

      fs.unlinkSync(existAvatarPath);

      const fileUrl = path.join(req.file.filename);

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        avatar: fileUrl,
      });

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;

      const shop = await Shop.findOne(req.seller._id);

      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all sellers --- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller ---admin
router.put(
  "/UpdateSeller/:id",
  requireSignin, adminMiddleware,  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }
       if(seller.type === "Active"){
         await Shop.findByIdAndUpdate(req.params.id,{
           type:"disabled"
         });
         res.status(201).json({
          success: true,
          message: "Seller disabled successfully!",
        });

       }else{
        await Shop.findByIdAndUpdate(req.params.id,{
          type:"Active"
        });
        res.status(201).json({
          success: true,
          message: "Seller Active successfully!",
        });
       }

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        withdrawMethod:{
          bankName:  req.body.bankName,
          bankAccountNumber: req.body.bankAccountNumber,
          bankHolderName: req.body.bankHolderName
        }
      });
      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = null;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
