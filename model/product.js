const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  type: {
    type: String,
    required: [true, "Please enter your type"],
  },
  show:{
    type:Boolean,
    default:true
  },
  WarrantPeriod: {
    type: String,
    required: [true, "Please enter your Warrant Period!"],
  },
  deliveryTerm: {
    type: String,
    required: [true, "Please enter your deliveryTerm"],
  },
  tags: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  state:{
     type:String,
     required:[true,'please enter your state'],
     enum: ["waiting_confirmation", "accepted"],
     default:"waiting_confirmation"
  },
  priceTotal: {
    type:String,
    required: [true, "Please enter your product price!"],
  },
  stock: {
    type: String,
    required: [true, "Please enter your product state"],
  },
  SellerPrice:{
    type: Number,
    required: true,
},
sitePrice:{
    type: Number,
    required: true,
},
  images: [
    {
      type: String,
    },
  ],
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt:{
        type: Date,
        default: Date.now(),
      }
    },
  ],
  ratings: {
    type: Number,
  },
  shopId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  shop: {
    type: String,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Product", productSchema);
