const {
  Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');
const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');

// Extract the email data from the workerData object
const {emailData} = workerData;

// Define the sendingEmail function
const sendingEmail = (data) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.PASSWORD_EMAIL,
      },
    });

    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve('./view'),
        defaultLayout: false,
      },
      viewPath: path.resolve('./view'),
      extName: ".handlebars",
    };

    transporter.use('compile', hbs(handlebarOptions));
    transporter.sendMail(workerData, function (err, info) {
      if (err) {
        console.log(err);
        return reject({ message: 'An error has occurred' });
      }
      return resolve({ message: 'Email sent successfully' });
    });
  });
};

sendingEmail()
  .then((result) => {
    parentPort.postMessage({ success: true, result });
  })
  .catch((error) => {
    parentPort.postMessage({ success: false, error });
  });




