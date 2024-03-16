const express = require('express')
const { validateSignupRequest, isRequestValidated, validateSigninRequest } = require('../../validators/auth');
const { upload } = require("../../multer");



const {Signin , Signup , signout } =  require('../../controller/admin/auth')

const router = express.Router()
router.route('/admin/signin').post( validateSigninRequest,isRequestValidated , Signin)
router.route('/admin/signup').post( upload.single("file"),Signup)
router.post('/admin/signout', signout)




module.exports =  router