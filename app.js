const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");


require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/", express.static(path.join(__dirname,"./uploads")));
app.use("/test", (req, res) => {
  res.send("Hello world!");
});
app.enable('trust proxy')


app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));


app.get('/sendEmail', async(req,res)=>{
   const DATA={
      from:process.env.EMAIL_ADDRESS,
      to:"saibabderrahman@gmail.com",
      template:'dealCreate',
      subject:"acctivation your account",
      context:{
          name:'saib abderrahmane'
      }
   }
  await sendingEmail(DATA)
  res.send("Hello world!");




})

// import routes
const user = require("./controller/user");
const seller = require("./controller/seller");
const product = require("./controller/product");
const Order = require("./controller/order");
const withdraw = require("./controller/withdraw");
const Category = require('./routes/category')
const Admin = require('./routes/admin/auth')
const Initiale = require('./routes/admin/initialData')
const chargily= require('./controller/Chargily');
const benefit= require('./controller/benefit');
const video= require('./controller/video');
const pageRoutes = require("./routes/admin/page");


const { sendingEmail } = require("./utils/SendingEmaile");


app.use("/api/v2/user", user);
app.use("/api/v2/order", Order);
app.use("/api/v2/shop", seller);
app.use("/api/v2/product", product);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/", Category);
app.use("/api/v2/", Admin);
app.use("/api/v2/", Initiale);
app.use("/api/v2/", chargily);
app.use("/api/v2/Benefit", benefit);
app.use("/api/v2/video", video);
app.use("/api/v2/", pageRoutes);


// Define the email data

// Create a new worker and pass the emailData as workerData


app.get('/api',(req,res)=>{
res.status(200).json('hello world ')
})

// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
