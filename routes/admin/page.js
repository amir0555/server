const express = require('express');
const {  requireSignin, adminMiddleware } = require('../../common-middleware');
const { createPage, getPage , getAllPages, PageDelete } = require('../../controller/admin/page');
const { upload } = require("../../multer");

const router = express.Router();

router.post(`/page/create`, requireSignin, adminMiddleware, upload.array("banners"), createPage)
router.delete(`/page/delete/:id`, requireSignin, adminMiddleware, PageDelete)

router.get(`/page/:category/:type`, getPage);
router.get(`/page`, getAllPages);

module.exports = router;