const { default: slugify } = require("slugify");
const Page = require("../../model/page");

exports.createPage = async(req, res) => {

  const  {
    title ,description
  } = req.body
  try {
    const data = {
      title ,description
      ,slug:slugify(title, { lower: true })

    }
    const files = req.files;
    data.banners = files.map((file) => `${file.filename}`);
    data.createdBy = req.user._id;
    const newPage = await Page.create(data)
    newPage.save()
    return res.status(200).send({
      success:true,
      message:"page create successfully"
      ,page:newPage
    })
    
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message:error.message
    })
    
  }
};

exports.getPage = (req, res) => {
  const { category, type } = req.params;
  if (type === "page") {
    Page.findOne({ category: category }).exec((error, page) => {
      if (error) return res.status(400).json({ error });
      if (page) return res.status(200).json({ page });
    });
  }
};
exports.PageDelete = async(req, res) => {
  try {
      const id = req.params.id
      await Page.findByIdAndDelete({_id:id})
      return res.status(202).send({
      success:true,
      message:"page delete successfully"
    })
    
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message:error.message
    })
   }

};
exports.getAllPages = async (req, res) => {
  
  try {
    const getAllPages = await Page.find();
     res.status(200).json({ getAllPages});

} catch (error) {    

    res.status(404).json({ error});
}
}


