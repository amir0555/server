const axios = require('axios');
const dotenv = require('dotenv')
const sendMail = require("../utils/sendMail");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
const Order = require("../model/order");
const { sendingEmail } = require("../utils/SendingEmaile");



router.post('/webhook', async (req, res) => {
  const order = {
    service: req.body.CurrentProduct._id,
    shippingAddress: {
      address1: req.body.Info.address1,
      address2: req.body.Info.address2,
      PhoneNumber: req.body.Info.PhoneNumber,
      email: req.body.Info.email,
      name: req.body.Info.name,
      bank: req.body.Info.selectedBank,
    },
    originalPrice:req.body.CurrentProduct.originalPrice,
    SellerPrice:req.body.CurrentProduct.SellerPrice,
    sitePrice:req.body.CurrentProduct.sitePrice,
    user: req.body.user._id,
    seller: req.body.CurrentProduct.shopId,
    totalPrice: req.body.CurrentProduct.priceTotal,
    status: "create",
    paymentInfo: {
      id: "",
      status: "",
      type: "",
    },
    paidAt: Date.now(),
    deliveredAt: null,
  };

  try {
    const savedOrder = await Order.create(order);
    const url = 'http://epay.chargily.com.dz/api/invoice';
    const headers = {
      'X-Authorization': process.env.CHARGILY_APP_KEY,
      'Accept': 'application/json',
    };
    const payload = {
      client: order.shippingAddress.name,
      client_email: order.shippingAddress.email,
      invoice_number: 500, // Replace with the actual logic to generate the invoice number
      amount: order.totalPrice,
      discount: 0,
      back_url: process.env.BACK_URL,
      webhook_url: process.env.WEBHOOK_URL,
      mode: order.shippingAddress.bank,
      comment: savedOrder._id,
    };
    const response = await axios.post(url, payload, { headers });
    res.status(201).json(response.data.checkout_url);
  } catch (error) {
    console.log(error)
    console.error(error);
    res.status(500).json({ message: error });
  }
});




    router.post('/data', async (req, res) => {
      try {
        if (req.body.invoice.status === 'canceled') {
          const order = await Order.findByIdAndDelete(req.body.invoice.comment);
          await sendMail('Order deleted because it was canceled.');
          res.sendStatus(200); // Send a success response to the client
        } else {
          const order = await Order.findByIdAndUpdate(req.body.invoice.comment, {
            status: req.body.invoice.status,
            paymentInfo: {
              id: req.body.invoice.id,
              status: req.body.invoice.status,
              type: req.body.invoice.mode,
            },
            paidAt: Date.now(),
          });
          await sendMail('Order payment confirmed.'); // Send an email confirming the payment
          res.sendStatus(200); // Send a success response to the client
        }
      } catch (error) {
        console.error(error);
        await sendMail('Internal Server Error'); // Send an email confirming the payment

        res.status(500).json({ error: 'Internal Server Error' }); // Send an error response to the client
      }
    });
    


    module.exports = router;


    /*router.post('/webhook', async(req, res) => {
    const order = {
      service: req.body.CurrentProduct._id,
      shippingAddress: {
        address1: req.body.Info.address1,
        address2: req.body.Info.address2,
        PhoneNumber: req.body.Info.PhoneNumber,
        email: req.body.Info.email,
        name: req.body.Info.name,
        bank :req.body.Info.selectedBank
      },
      user: req.body.user._id,
      seller: req.body.CurrentProduct.shopId,
      totalPrice: req.body.CurrentProduct.priceTotal,
      status: "create",
      paymentInfo: {
        id: "",
        status: "",
        type: "",
      },
      paidAt: Date.now(),
      deliveredAt: null,
    };    
  try {
    const savedOrder = await Order.create(order);
    const url = 'http://epay.chargily.com.dz/api/invoice';
    const headers = {
      'X-Authorization': process.env.CHARGILY_APP_KEY,
      'Accept': 'application/json'
    };
    const payload = {
      client: order.shippingAddress.name,
      client_email: order.shippingAddress.email,
      invoice_number:500,
      amount: order.totalPrice,
      discount: 0,
      back_url: process.env.BACK_URL,
      webhook_url: process.env.WEBHOOK_URL,
      mode: order.shippingAddress.bank,
      comment:savedOrder._id,
      CHARGILY_APP_KEY :  process.env.CHARGILY_APP_KEY,
      CHARGILY_APP_SECRET :  process.env.CHARGILY_APP_SECRET,
        };
        if(!savedOrder._id){
          res.status(404).json({message:"please make sure ti write all information"})
        }
        const response = await axios.post(url, payload ,{headers });
        res.status(201).json(response.data.checkout_url);
  } catch (error) {
    console.log(error)
     res.status(404).json({message:"something went wrong try again later "});
   }
    });*/
