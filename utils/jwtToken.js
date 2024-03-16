// create token and saving that in cookies

const jwt = require("jsonwebtoken");
const sendToken = async(user, statusCode, res) => {
  const USER = {
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
  const token = await jwt.sign(USER, secretKey, {
    expiresIn: "10h",
  });

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.status(statusCode).json({
    success: true,
    USER,
    token,
    user_id :USER._id
  });
};

module.exports = sendToken;
