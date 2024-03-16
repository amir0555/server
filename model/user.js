const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  firstname:{
    type: String,
    required: [true, "Please enter your name!"],
  },
  lastname:{
    type: String,
    required: [true, "Please enter your name!"],
  },
  email:{
    type: String,
    required: [true, "Please enter your email!"],
    unique:true
  },
  password:{
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },
  PhoneNumber:{
    type: Number,
    unique:true
,
  },

  ZipCode:{
    type: Number,
  },
  Address:{
    type: String,
    required: [true, "Please enter your address!"],

  },
  role:{
    type: String,
    default: "user",
  },
  type: {
    type: String,
    required:true,
    enum: ["Active", "disabled"],
    default: "Active"
  },
friends: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Shop",
    },
  ],
  socket_id: {
    type: String
  },
  status: {
    type: String,
    enum: ["Online", "Offline"]
  },
 avatar:{
    type: String,
    required: true,
 },
 createdAt:{
  type: Date,
  default: Date.now(),
 },
 resetPasswordToken: String,
 resetPasswordTime: Date,
});


//  Hash password
userSchema.pre("save", async function (next){
  if(!this.isModified("password")){
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
