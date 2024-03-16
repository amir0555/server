const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  seller_bank: {
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
  shop_id:{
    type: mongoose.Schema.ObjectId,
    ref: "Shop",
    required:true
  },
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
  updatedAt:{
    type: Date,
  }
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
