const Category = require("../model/category");
const slugify = require("slugify");
const shortid = require("shortid");
const path = require("path");



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
      img : cate.categoryImage,
      name: cate.name,
      slug: cate.slug,
      parentId: cate.parentId,
      type: cate.type,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}
exports.getCategoryById = async (req,res)=>{
  const id =  req.params.id
  try {
    const category =  await Category.findById(id).populate('Product')
    res.status(200).json(category)
    
  } catch (error) {
    res.status(404).json(error)
    
  }

 

}

exports.addCategory = async (req, res) => {
  try {
    const categoryObj = {
      name: req.body.name,
      slug: `${slugify(req.body.name)}-${shortid.generate()}`,
      createdBy: req.user._id,
    };  
    if (req.file) {
      const filename = req.file.filename;
      categoryObj.categoryImage =  path.join(filename);
    }

    const cat = await  Category.create(categoryObj);
  
    await cat.save()
    return res.status(201).json({ category:cat });
  
    
  } catch (error) {
     return res.status(400).json({ error });

    
  }

};

exports.getCategories = async(req, res) => {
  try {
    const categories = await Category.find({})
    const categoryList = createCategories(categories);
    res.status(200).json({ categoryList });
  } catch (error) {
    res.status(404).json({ message:error });
  }
};

exports.updateCategories = async (req, res) => {
  try {
    const { _id , name } = req.body;
    if (req.file) {
      const filename = req.file.filename;
      categoryImage =  path.join(filename);
      const category = await Category.findByIdAndUpdate(_id,{
        name,
        categoryImage
      })
      res.status(201).json({success:true , message : "category update successfully"})
    }else{
      const category = await Category.findByIdAndUpdate(_id,{
        name,
      })
      res.status(201).json({success:true , message : "category update successfully"})

    }
    
  } catch (error) {
    res.status(400).json({ message:error.message });

    
  }

};

exports.deleteCategories = async (req, res) => {
  const { ids } = req.body.payload;
  const deletedCategories = [];
  for (let i = 0; i < ids.length; i++) {
    const deleteCategory = await Category.findOneAndDelete({
      _id: ids[i]._id,
      createdBy: req.user._id,
    });
    deletedCategories.push(deleteCategory);
  }

  if (deletedCategories.length == ids.length) {
    res.status(201).json({ message: "Categories removed" });
  } else {
    res.status(400).json({ message: "Something went wrong" });
  }
};



/*const Category = require('../models/category')
const slugify = require('slugify');
const shortid = require("shortid")



function createCategory(categories, parentId = null) {
    const categoryList = [];
    let category;
    if (parentId === null) {
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
        children: createCategory(categories, cate._id),
      });
    }
  
    return categoryList;
  }


const addCategory = async(req,res)=>{
    const categoryObj = {
        name: req.body.name,
        slug: slugify(req.body.name),
        createdBy: req.user._id,

    }
    if (req.file) {
      categoryObj.categoryImage = process.env.API + "/public/" + req.file.filename;
    }

  
    const cat = new Category(categoryObj)
    cat.save((err,category)=>{
        if(err) return res.status(400).json({err})

       if(category) return res.status(200).json({category})
       
    })
        
    }
  
    const getCategories = async(req,res)=>{

        try {
            const categories = await Category.find()

            const categoryList =  await createCategory(categories)

            res.status(200).json({categoryList})

            
        } catch (error) {
            res.status(400).json({error})
            
        }
    }
    const updateCategories = async (req, res) => {
      const { _id, name, parentId, type } = req.body;
      const updatedCategories = [];
      if (name instanceof Array) {
        for (let i = 0; i < name.length; i++) {
          const category = {
            name: name[i],
            type: type[i],
          };
          if (parentId[i] !== "") {
            category.parentId = parentId[i];
          }
    
          const updatedCategory = await Category.findOneAndUpdate(
            { _id: _id[i] },
            category,
            { new: true }
          );
          updatedCategories.push(updatedCategory);
        }
        return res.status(201).json({ updateCategories: updatedCategories });
      } else {
        const category = {
          name,
          type,
        };
        if (parentId !== "") {
          category.parentId = parentId;
        }
        const updatedCategory = await Category.findOneAndUpdate({ _id }, category, {
          new: true,
        });
        return res.status(201).json({ updatedCategory });
      }
    };
    const deleteCategories = async (req, res) => {
      const { ids } = req.body.payload;
      const deletedCategories = [];
      for (let i = 0; i < ids.length; i++) {
        const deleteCategory = await Category.findOneAndDelete({
          _id: ids[i]._id,
          createdBy: req.user._id,
        });
        deletedCategories.push(deleteCategory);
      }
    
      if (deletedCategories.length === ids.length) {
        res.status(201).json({ message: "Categories removed" });
      } else {
        res.status(400).json({ message: "Something went wrong" });
      }
    };
    

        
    

module.exports ={ 
    addCategory, getCategories ,deleteCategories , updateCategories



} */