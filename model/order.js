const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    service:{
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
    },
    shippingAddress:{
        type: Object,
        required: true,
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required:true
      },
    seller:{
        type: mongoose.Schema.ObjectId,
        ref: "Shop",
        required:true
    },
    type:{
        type:String,
        required:[true,'please enter your state'],
        enum: ["withdrawable", "non-withdrawable"],
        default:"non-withdrawable"
    },
    userIdea:{
        type:String,
        required:true,
        enum: ["nothing", "yes","no"],
        default:"nothing"
    },
    originalPrice:{
        type: Number,
        required: true,

    },
    totalPrice:{
        type: Number,
        required: true,
    },
    SellerPrice:{
        type: Number,
        required: true,
    },
    sitePrice:{
        type: Number,
        required: true,
    },
    status:{
        type: String,
        default: "create",
    },
    paymentInfo:{
        id:{
            type: String,
        },
        status: {
            type: String,
        },
        type:{
            type: String,
        },
        
    },
    paidAt:{
        type: Date,
        default: Date.now(),
    },
    deliveredAt: {
        type: Date,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Order", orderSchema);