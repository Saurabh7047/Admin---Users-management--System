const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const RandomString = require('randomstring')
const config = require('../config/config')
 const sendVerifyMAail = async (name, email, user_id) => {
   try {
     var transporter = nodemailer.createTransport({
       //   service: "gmail",
       host: "smtp.gmail.com",
       port: 587,
       secure: false,
       requireTLS: true,
       auth: {
         user: config.userEmail,
         pass: config.userMailPassword,
       },
     });

     var mailOptions = {
       from: config.userEmail,
       to: email,
       subject: "For verification mail",
       html:
         "Hello," +
         name +
         ',Thank you for registering. Please click the following link to verify your email: <a href="http://localhost:3000/verify?id=' +
         user_id +
         '">verify</a>"If you did not register, please ignore this email.',
     };

     transporter.sendMail(mailOptions, function (error, info) {
       if (error) {
         console.log(error);
       } else {
         console.log("Email sent: " + info.response);
       }
     });
   } catch (error) {
     console.log(error.message);
   }
 };
class userControl {
  static loadRegister = async (req, res) => {
    try {
      res.render("users/register");
    } catch (error) {
      console.log(error.message);
    }
  };
  //register route and send mail for verification
  static createUser = async (req, res) => {
    try {
      const sendVerifyMAail = async (name, email, user_id) => {
        try {
          var transporter = nodemailer.createTransport({
            //   service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
              user: config.userEmail,
              pass: config.userMailPassword,
            },
          });

          var mailOptions = {
            from: config.userEmail,
            to: email,
            subject: "For verification mail",
            html:
              "Hello," +
              name +
              ',Thank you for registering. Please click the following link to verify your email: <a href="http://localhost:3000/verify?id=' +
              user_id +
              '">verify</a>"If you did not register, please ignore this email.',
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        } catch (error) {
          console.log(error.message);
        }
      };
      const { password } = req.body;
      const securePassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        image: req.file.filename,
        password: securePassword,
        is_admin: 0,
      });
      const userData = await newUser.save();
      if (userData) {
        sendVerifyMAail(req.body.name, req.body.email, userData._id);
        res.render("users/register", {
          message: "you are registered successfully. please verify your mail",
        });
      } else {
        res.render("users/register", {
          message: "your registration has been failed.",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  //verify user
  static verifyMail = async (req, res) => {
    try {
      const updateInfo = await User.updateOne(
        { _id: req.query.id },
        { $set: { is_verified: 1 } }
      );
      //   console.log(updateInfo);
      res.render("users/email-verified");
    } catch (error) {
      console.log(error.message);
    }
  };

  //login user
  static login = async (req, res) => {
    try {
      res.render("users/login");
    } catch (error) {
      console.log(error.message);
    }
  };
  //verify login user
  static verifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const userData = await User.findOne({
        email: email,
      });
      if (userData) {
        const isMatch = await bcrypt.compare(password, userData.password);
        if (isMatch) {
          if (userData.is_verified === 0) {
            res.render("users/login", {
              message: "Please verify your mail.",
            });
          } else {
            req.session.user_id = userData._id;
            res.redirect("users/home");
          }
        } else {
          res.render("users/login", {
            message: "Enter email and password is incorrect",
          });
        }
      } else {
        res.render("users/login", {
          message: "Enter email and password is incorrect",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  //home
  static home = async (req, res) => {
    try {
      const user = await User.findOne({_id:req.session.user_id})
      res.render("users/home" ,{user:user});
    } catch (error) {
      console.log(error.message);
    }
  };
  //user logout
  static userlogout = async (req, res) => {
    try {
      req.session.destroy();
      res.redirect("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  //forgot password
  static forgotLoad = async (req, res) => {
    try {
      res.render("users/forgot");
    } catch (error) {
      console.log(error.message);
    }
  };
  // send forgot link to mail
  static forgotverify = async (req, res) => {
    try {
      const sendResetPasswordMail = async (name, email, token) => {
        try {
          var transporter = nodemailer.createTransport({
            //   service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
              user: config.userEmail,
              pass: config.userMailPassword,
            },
          });

          var mailOptions = {
            from: config.userEmail,
            to: email,
            subject: "For Reset Pasword",
            html:
              "Hello," +
              name +
              ',Thank you for registering. Please click the following link to reset password your email: <a href="http://localhost:3000/forgot-password?token=' +
              token +
              '">forget password</a>"',
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        } catch (error) {
          console.log(error.message);
        }
      };
      const { email } = req.body;
      const userData = await User.findOne({ email: email });
      if (userData) {
        if (userData.is_verified === 0) {
          res.render("users/forgot", { message: "Please verify your mail" });
        } else {
          const randomStr = RandomString.generate();
          const updateData = await User.updateOne(
            { email: email },
            { $set: { token: randomStr } }
          );
          sendResetPasswordMail(userData.name, userData.email, randomStr);
          res.render("users/forgot", {
            message: "Please check your mail to reset password",
          });
        }
      } else {
        res.render("users/forgot", { message: "User mail is incorrect" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  // forgot page
  static forgotPassword = async (req, res) => {
    try {
      const { token } = req.query;
      const tokenData = await User.findOne({ token: token });
      if (tokenData) {
        res.render("users/forgot-password", { user_id: tokenData._id });
      } else {
        res.status(400).send("Invalid or expired verification token.");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  //reset password here
  static ResetPassword = async (req, res) => {
    try {
      const { password, user_id } = req.body;
      const securePassword = await bcrypt.hash(password, 10);
      const Data = await User.findByIdAndUpdate(
        { _id: user_id },
        { $set: { password: securePassword, token: "" } }
      );
      res.redirect("/");
    } catch (error) {
      console.log(error.message);
    }
  };
  static verification = async (req, res) => {
    try {
      res.render("users/verification");
    } catch (error) {
      console.log(error.message);
    }
  };
  static sendVerification = async (req, res) => {
      try {
        const {email} = req.body
       const userData =  await User.findOne({email:email})
       if (userData) {
           
           
           
        sendVerifyMAail(req.body.name, req.body.email, userData._id);

           res.render("users/verification", {
             message: "please check your Email for verify ",
           });

       } else {
        
           res.render("users/verification",{message:"Your Email is wrong"});
       }
    } catch (error) {
      console.log(error.message);
    }
  };
  // edit profile & update
   static editload = async (req, res) => {
    try {
      const id = req.query.id
      const userData = await User.findOne({ _id: id })
      if (userControl) {
        res.render('users/edit',{user:userData})
      } else {
        res.redirect('/home')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  static updateProfile = async (req, res) => {
    try {
      if (req.file) {
        const user = await User.findByIdAndUpdate(
          { _id: req.body.user_id },
          {
            $set: {
              name: req.body.name,
              email: req.body.email,
              mobile: req.body.mobile,
              image:req.file.filename,
            },
          }
        );
        
      } else {
        const user = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set:{name:req.body.name,email:req.body.email,mobile:req.body.mobile} })
      }
      res.redirect('/home')
    } catch (error) {
      console.log(error.message);
    }
  }
}

module.exports = userControl;
