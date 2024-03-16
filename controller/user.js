const express = require("express");
const path = require("path");
const User = require("../model/user");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { requireSignin, adminMiddleware } = require("../common-middleware");
const Order = require("../model/order");
const { createEmailWorker } = require("../services/EmailWorker");
const bcrypt = require("bcryptjs");





const createActivationToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
};

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    let user = req.body
    const {email } = req.body
    const userEmail = await User.findOne({email});
    if (userEmail) {
      const filename = req.file?.filename;
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
    let   fileUrl = ""
  
    if(filename){

     fileUrl = path.join(filename);
    }
    user.avatar = fileUrl
{/*    const activationToken = createActivationToken(user);
    const activationUrl = `${process.env.CLIENT_URL}/activation/${activationToken}`;

    const emailData = {
      from: process.env.EMAIL_ADDRESS,
      to: user.email,
      template: 'activation',
      subject: 'activation your account ',
      context: {
        token: activationUrl,
      },
    };
  createEmailWorker(emailData) */}
  user = await User.create(user);
  await user.save()
  sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});



// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.JWT_SECRET
      );
      console.log(newUser)

      
      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { firstname,lastname,PhoneNumber,Address, ZibCode ,email, password, avatar } = newUser;
      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }

      user = await User.create({
        firstname,lastname,PhoneNumber,Address, ZibCode ,email, password, avatar});

      await user.save()
      sendToken(user, 201, res);
    } catch (error) {
      console.log({error})
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      if ( user.type ==="disabled") {
        return next(
          new ErrorHandler("sorry your account has been blocked by admin", 400)
          );
        }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//forget password
router.post(
  "/forgetpassword",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email} = req.body;
      if (!email) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      
      const user = await User.findOne({ email });
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
        const activationUrl = `${process.env.CLIENT_URL}auth/new-password?token=${activationToken}`;
    
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

/// change user password
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
          const user = await User.findOneAndUpdate({ _id : data.id } , {
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


// load user
router.get(
  "/getuser/:id",
  requireSignin, adminMiddleware,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const Customer = await User.findById(req.params.id);

      if (!Customer) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      const orders = await Order.find({user:Customer._id}).populate("service").populate("seller", "firstname lastname")
      res.status(200).json({
        success: true,
        Customer,
        orders
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
      try {
      res.cookie("token", null, {
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

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);

      const existAvatarPath = `uploads/${existsUser.avatar}`;

      fs.unlinkSync(existAvatarPath);

      const fileUrl = path.join(req.file.filename);

      const user = await User.findByIdAndUpdate(req.user.id, {
        avatar: fileUrl,
      });

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.put(
  "/UpdateUser/:id",
  requireSignin, adminMiddleware,  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("user is not available with this id", 400)
        );
      }
       if(user.type === "Active"){
         await User.findByIdAndUpdate(req.params.id,{
           type:"disabled"
         });
         res.status(201).json({
          success: true,
          message: "Seller disabled successfully!",
        });

       }else{
        await User.findByIdAndUpdate(req.params.id,{
          type:"Active"
        });
        res.status(201).json({
          success: true,
          message: "user Active successfully!",
        });
       }

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get("/get-friends" ,  requireSignin,async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstname avatar lastname "
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "Friends found successfully!",
  });
});

module.exports = router;
