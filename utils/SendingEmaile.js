const nodemailer = require('nodemailer')
const path = require('path')
var hbs = require('nodemailer-express-handlebars');


exports.sendingEmail =   (DATA) => {
    return new Promise((resolve,reject)=>{
        var transporter =nodemailer.createTransport({
            service:"gmail"
            ,auth:{
                user:"doondoon273@gmail.com",
                pass:"jdrtjxfudnfurmpe",

            },
        })
        const handlebarOptions = {
            viewEngine: {
              extName: ".handlebars",
              partialsDir: path.resolve('./view'),
              defaultLayout: false,
            },
            viewPath: path.resolve('./view'),
            extName: ".handlebars",
          }
          
          transporter.use('compile', hbs(handlebarOptions));
      //    const mail_config ={
      //      from:"doondoon273@gmail.com",
      //      to:email,
      //      template:'email',
      //      subject:"testing coding 101 email",
      //      context:{
      //          name:'saib abderrahmane'
      //      }
      //  };
        transporter.sendMail(DATA,function(err,info){
            if(err){
                console.log(err)
                return reject({message:'an error has occurred'})
            }
            return resolve({message:'email sent successfully'})
        })
    })

}

