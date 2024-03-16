const express = require("express");
const router = express.Router();
const { requireSignin, adminMiddleware } = require("../common-middleware")
const Video = require('../model/video')


router.post('/create' ,requireSignin, adminMiddleware, async(req,res)=>{
    try {
        const video = await Video.create(req.body) 
         await video.save()
         res.status(201).send({
            success:true,
            video,
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
       const video = await Video.find({});

        res.status(200).send({
            success:true,
            value:video[video?.length-1].value,
            message:'successfully '
         })
    } catch (error) {
        res.status(400).send({
            success:false,
            message:error
         })   
    }
})

module.exports = router;



