const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const shopSchema = new mongoose.Schema({
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
 avatar:{
    type: String,
    required: true,
 },
 products: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
],

  description: {
    type: String,
  },
  withdrawMethod: {
    bankName: {
      type: String,
      default: "",
    },
    bankAccountNumber: {
      type: Number,
      default: null,
    },
    bankHolderName: {
      type: String,
      default: "",
    },
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  friends: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  socket_id: {
    type: String
  },
  status: {
    type: String,
    enum: ["Online", "Offline"]
  },
  type: {
    type: String,
    required:true,
    enum: ["Active", "disabled"],
    default: "disabled"
  },
  transections: [
    {
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: "Processing",
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});


// Hash password
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// comapre password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Shop", shopSchema);
