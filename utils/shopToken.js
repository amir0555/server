// create token and saving that in cookies
const jwt = require("jsonwebtoken");
const sendShopToken =async(user, statusCode, res) => {
  const seller = {
    firstname: user.firstname,
    lastname: user.lastname,
    ZipCode: user.ZipCode,
    PhoneNumber: user.PhoneNumber,
    email: user.email,
    avatar: user.avatar,
    Address: user.Address,
    PhoneNumber: user.PhoneNumber,
    _id : user._id
  };
  const secretKey = process.env.JWT_SECRET
  const token = await jwt.sign(seller, secretKey, {
    expiresIn: "10h",
  });
  user.password = " "



  
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };
  res.status(statusCode).cookie("seller_token", token, options).json({
    success: true,
    seller:user,
    token,
    user_id:seller._id
  });
};

module.exports = sendShopToken;
