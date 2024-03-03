const express = require('express');
const router = express.Router();
const session = require('express-session')

const userControl = require('../controllers/userController')
const auth = require('../middlewares/auth')

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

router.get("/", auth.islogout, userControl.login);
router.get('/register',auth.islogout, userControl.loadRegister)
router.post("/register", upload.single("image"), userControl.createUser);
router.get('/verify', userControl.verifyMail)
router.get("/login", auth.islogout, userControl.login);
router.post('/login',userControl.verifyLogin)
router.get("/users/home", auth.islogin, userControl.home);
router.get("/home", auth.islogin, userControl.home);
router.get('/logout', auth.islogin, userControl.userlogout)
// password reset
router.get('/forgot',auth.islogout,userControl.forgotLoad)
router.post("/forgot",userControl.forgotverify);
router.get('/forgot-password',auth.islogout,userControl.forgotPassword)
router.post("/forgot-password", userControl.ResetPassword);

router.get('/verification',userControl.verification)
router.post("/verification", userControl.sendVerification);

router.get('/edit',auth.islogin,userControl.editload)
router.post('/edit',upload.single('image'),userControl.updateProfile)

module.exports = router;
