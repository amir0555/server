const  Admin = require("../../model/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

exports.Signup = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ email: req.body.email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already registered",
      });
    }

    const count = await Admin.estimatedDocumentCount();
    let role = "admin";
    if (count === 0) {
      role = "super-admin";
    }

    const { firstName, lastName, email, password } = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new Admin({
      firstName,
      lastName,
      email,
      hash_password,
      username: shortid.generate(),
      role,
    });

    const savedUser = await _user.save();

    if (savedUser) {
      return res.status(201).json({
        message: "Admin created Successfully..!",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong",
    });
  }
};

exports.Signin = async(req, res) => {
  const {email ,password}= req.body
  try {
    const user = await Admin.findOne({email})
    if(user){
      const isPassword = await user.authenticate(password);
      if( isPassword && (user.role === "admin" || user.role === "super-admin")){
        const token = await jwt.sign(
          { _id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        const { _id, firstName, lastName, email, role, fullName } = user;
        res.cookie("token", token, { expiresIn: "1d" });
        res.status(200).json({
          token,
          user: { _id, firstName, lastName, email, role, fullName },
        });
      }
    }else{
      res.status(404).json({message:"admin not found"})
    }
  
 } catch (error) {
  res.status(400).json({message:error})
  
 }

};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "Signout successfully...!",
  });
};

/*
  Admin.findOne({email}).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });
    if (user) {
      console.log(user)
      const isPassword = await user.authenticate(password);
      if (
        isPassword &&
        (user.role === "admin" || user.role === "super-admin")
      ) {
        const token = jwt.sign(
          { _id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        const { _id, firstName, lastName, email, role, fullName } = user;
        res.cookie("token", token, { expiresIn: "1d" });
        res.status(200).json({
          token,
          user: { _id, firstName, lastName, email, role, fullName },
        });
      } else {
        return res.status(400).json({
          message: "Invalid Password",
        });
      }
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  });

*/


