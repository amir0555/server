/*const nodemailer = require("nodemailer");

const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_ADDRESS,
            pass:process.env.PASSWORD_EMAIL,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;*/
const nodemailer = require("nodemailer");

const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_ADDRESS,
            pass:process.env.PASSWORD_EMAIL,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: "saibabderrahman@gmail.com",
        subject: "test chargiliy",
        text: options,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;