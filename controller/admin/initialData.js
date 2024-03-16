const Category = require("../../model/category");
const Product = require("../../model/product");
const Order = require("../../model/order");
const User = require("../../model/user");
const Shop = require("../../model/shop");
const Benefit = require("../../model/benefit");
const Video = require("../../model/video");
const withdraw = require("../../model/withdraw");
const OneToOneMessage = require("../../model/OneToOneMessage");

function createCategories(categories, parentId = null) {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      parentId: cate.parentId,
      type: cate.type,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}

exports.initialData = async (req, res) => {
  const categories = await Category.find({}).exec();
  const users = await User.find({}).exec();
  const Sellers = await Shop.find({}).exec();
  const chat = await OneToOneMessage.find({}).populate("participants" , "firstname lastname avatar").populate("seller" , "firstname lastname avatar")
  const WithdrawInvitations = await withdraw.find({status:"Processing"}).populate("shop_id")
  const orders = await Order.find({
    status: { $ne: "create" },
    type: { $ne: "withdrawable" },

  }).sort({
    createdAt: -1,
  }).populate("service").populate("seller", "firstname lastname").populate("user", "firstname lastname").exec();
  const products = await Product.find({state: { $ne: "accepted" },}).sort({ createdAt: -1, }).populate("category", "name").populate("shopId", "firstname lastname")
  const benefit = await Benefit.find({});
  const video = await Video.find({});

  res.status(200).json({
    categories: createCategories(categories),
    products,
    orders,
    users,
    Sellers,
    value:benefit[benefit?.length-1]?.value,
    video:video[video?.length-1]?.value,
    WithdrawInvitations,
    chat
  });
};