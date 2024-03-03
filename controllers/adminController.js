const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const RandomString = require("randomstring");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const exceljs = require("exceljs");

// html to pdf
const ejs = require("ejs");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

const { use } = require("../routes/adminRoutes");
const { response } = require("express");

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
        ',Thank you for registering. Please click the following link to reset password your email: <a href="http://localhost:3000/admin/forgot-password?token=' +
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

const sendUserMail = async (name, email, password, user_id) => {
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
      subject: "Admin add you and verify your mail",
      html:
        "Hello," +
        name +
        ',Thank you for registering. Please click the following link to verify your email: <a href="http://localhost:3000/verify?id=' +
        user_id +
        '">verify</a>"<br><br><b>Email:- </b>' +
        email +
        "<br><b>password :-</b>" +
        password +
        "",
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

class AdminController {
  static loadLogin = async (req, res) => {
    try {
      res.render("admin/login");
    } catch (error) {
      console.log(error.message);
    }
  };
  static verifyUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const userData = await userModel.findOne({ email: email });
      if (userData) {
        const isMatch = await bcrypt.compare(password, userData.password);
        if (isMatch) {
          if (userData.is_admin === 0) {
            res.render("admin/login", {
              message: "Email and password is incorrect",
            });
          } else {
            req.session.user_id = userData._id;
            res.redirect("/admin/home");
          }
        } else {
          res.render("admin/login", {
            message: "Email and password is incorrect",
          });
        }
      } else {
        res.render("admin/login", {
          message: "Email and password is incorrect",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  static loadDashboard = async (req, res) => {
    try {
      const userData = await userModel.findOne({ _id: req.session.user_id });
      res.render("admin/home", { admin: userData });
    } catch (error) {
      console.log(error.message);
    }
  };

  static logout = async (req, res) => {
    try {
      req.session.destroy();
      res.redirect("/admin");
    } catch (error) {
      console.log(error.message);
    }
  };

  static forgotLoad = async (req, res) => {
    try {
      res.render("admin/forgot");
    } catch (error) {
      console.log(error.message);
    }
  };
  static forgotVerify = async (req, res) => {
    try {
      const { email } = req.body;
      const userData = await userModel.findOne({ email: email });
      if (userData) {
        if (userData.is_admin === 0) {
          res.render("admin/forgot", { message: "Email is incorrect" });
        } else {
          const randomStr = RandomString.generate();
          const upadateData = await userModel.updateOne(
            { email: email },
            { $set: { token: randomStr } }
          );
          sendResetPasswordMail(userData.name, userData.email, randomStr);
          res.render("admin/forgot", {
            message: "Please check your mail to reset password",
          });
        }
      } else {
        res.render("admin/forgot", { message: "Email is incorrect" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  static forgotPasswordLoad = async (req, res) => {
    try {
      const { token } = req.query;
      const tokenData = await userModel.findOne({ token: token });
      if (tokenData) {
        res.render("admin/forgot-password", { user_id: tokenData._id });
      } else {
        res.status(400).send("Invalid or expired verification token.");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  //reset password here
  static resetPassword = async (req, res) => {
    try {
      const { password, user_id } = req.body;
      const securePassword = await bcrypt.hash(password, 10);
      const Data = await userModel.findByIdAndUpdate(
        { _id: user_id },
        { $set: { password: securePassword, token: "" } }
      );
      res.redirect("/admin");
    } catch (error) {
      console.log(error.message);
    }
  };
  static adminDashboard = async (req, res) => {
    try {
      var search = ''
      if (req.query.search) {
        search = req.query.search;
      }
       var page = 1;
       if (req.query.page) {
         page = req.query.page;
       }
      const limit = 2;
      const users = await userModel.find({
        is_admin: 0,
        // multiple searching
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } },
          { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      }).limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      
      const count = await userModel.find({
        is_admin: 0,
        // multiple searching
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } },
          { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      }).countDocuments();
      
      res.render("admin/dashboard", {
        users: users,
        totalPages: Math.ceil(count / limit),
        currentPage:page
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  static newUser = async (req, res) => {
    try {
      res.render("admin/newUser");
    } catch (error) {
      console.log(error.message);
    }
  };
  static addUser = async (req, res) => {
    try {
      const { name, email, mobile } = req.body;
      const image = req.file.filename;
      const password = RandomString.generate(8);
      const securePassword = await bcrypt.hash(password, 10);
      const newUser = new userModel({
        name: name,
        email: email,
        mobile: mobile,
        image: image,
        password: securePassword,
        is_admin: 0,
      });
      const userData = await newUser.save();
      if (userData) {
        sendUserMail(name, email, password, userData._id);
        res.redirect("/admin/dashboard");
      } else {
        res.render("admin/newUser", { message: "something wrong" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  static editUserLoad = async (req, res) => {
    try {
      const { id } = req.query;
      const userData = await userModel.findById({ _id: id });
      if (userData) {
        res.render("admin/editUser", { user: userData });
      } else {
        res.redirect("/admin/dashboard");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  static updateUserLoad = async (req, res) => {
    try {
      const { name, email, mobile, is_verified } = req.body;
      const updateUser = await userModel.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            name: name,
            email: email,
            mobile: mobile,
          },
        }
      );
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.log(error.message);
    }
  };
  static deleteUserLoad = async (req, res) => {
    try {
      const { id } = req.query;
      await userModel.deleteOne({ _id: id });
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.log(error.message);
    }
  };
  static exportUser = async (req, res) => {
    try {
      const workBook = new exceljs.Workbook();
      const workSheet = workBook.addWorksheet("my User");
      workSheet.columns = [
        { header: "S.no", key: "s_no" },
        { header: "Name", key: "name" },
        { header: "Email ID", key: "email" },
        { header: "Mobile", key: "mobile" },
        { header: "Image", key: "image" },
        { header: "Is Admin", key: "is_admin" },
        { header: "Is Verified", key: "is_verified" },
      ];
      let counter = 1;
      const userData = await userModel.find({ is_admin: 0 });
      userData.forEach((user) => {
        user.s_no = counter;
        workSheet.addRow(user);
        counter++;
      });
      workSheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
      );

      res.setHeader("Content-Disposition", `attachement; filename=users.xlsx`);

      return workBook.xlsx.write(res).then(() => {
        res.status(200);
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  static exportUserPdf = async (req, res) => {
    try {
      const userData = await userModel.find({ is_admin: 0 });
      const data = {
        users: userData,
      };
      const filePathName = path.resolve(
        __dirname,
        "../views/admin/htmltopdf.ejs"
      );
      const htmlString = fs.readFileSync(filePathName).toString();
      let options = {
        format: "Letter",
        orientation: "portrait",
        border: "10mm",
      };
      const ejsData = ejs.render(htmlString, data);
      pdf.create(ejsData, options).toFile("users.pdf", (err, response) => {
        if(err) console.log(err);
        //  console.log('file generated')

        const filePath = path.resolve(__dirname, "../users.pdf");
        fs.readFile(filePath, (err, file) => {
          if(err) {
            console.log(err);
            return res.status(500).send("Could not download file");
          }
          res.setHeader("Content-Type", "application/pdf");

          res.setHeader(
            "Content-Disposition",
            `attachement; filename=users.pdf`
          );

          res.send(file);
        });
      });
    } catch (error) {
      console.log(error.message);
    }
  };
}

module.exports = AdminController;
