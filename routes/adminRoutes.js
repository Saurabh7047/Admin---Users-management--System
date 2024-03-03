const express = require("express");
const router = express.Router();
const session = require('express-session')
const config = require('../config/config')
const AdminController = require('../controllers/adminController')

const adminAuth = require('../middlewares/adminAuth')

const multer = require("multer");
const path = require("path");
const stroage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: stroage });


router.get('/',adminAuth.islogout,AdminController.loadLogin)
router.post('/login',AdminController.verifyUser)
router.get('/home',adminAuth.islogin,AdminController.loadDashboard)
router.get('/logout', adminAuth.islogin, AdminController.logout)
router.get("/forgot",adminAuth.islogout, AdminController.forgotLoad);
router.post("/forgot", AdminController.forgotVerify);
router.get("/forgot-password",adminAuth.islogout, AdminController.forgotPasswordLoad);
router.post("/forgot-password", AdminController.resetPassword);

router.get('/dashboard',adminAuth.islogin,AdminController.adminDashboard)
router.get('/new-user', adminAuth.islogin, AdminController.newUser)
router.post("/new-user",upload.single('image'), AdminController.addUser);

//actions edit
router.get('/edit-user',adminAuth.islogin,AdminController.editUserLoad)
router.post("/edit-user", AdminController.updateUserLoad);

router.get("/delete-user", adminAuth.islogin, AdminController.deleteUserLoad);

router.get("/export-user", adminAuth.islogin, AdminController.exportUser);
router.get("/export-user-pdf", adminAuth.islogin, AdminController.exportUserPdf);




router.get('*', (req, res) => {
    res.redirect('/admin')
})










module.exports = router;