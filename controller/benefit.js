const express = require("express");
const path = require("path");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendMail = require("../utils/sendMail");
const { requireSignin, adminMiddleware } = require("../common-middleware")
const Benefit = require('../model/benefit')


router.post('/createBenefit' ,requireSignin, adminMiddleware, async(req,res)=>{
    try {
        const benefit = await Benefit.create(req.body) 
         await benefit.save()
         res.status(201).send({
            success:true,
            benefit,
            message:'successfully created'
         })
    } catch (error) {
        res.status(400).send({
            success:false,
            message:error
         })   
    }

})

router.get('/' , async(req,res)=>{
    try {
       const benefit = await Benefit.find({});

        res.status(200).send({
            success:true,
            value:benefit[benefit?.length-1].value,
            message:'successfully created'
         })
    } catch (error) {
        res.status(400).send({
            success:false,
            message:error
         })

        
    }


})



module.exports = router;



