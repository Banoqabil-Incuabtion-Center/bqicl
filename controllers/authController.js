import db from '../models/index.js';
const { Admin } = db;
import bcrypt from 'bcrypt';
import RefreshToken from '../models/refreshTokenModel.js';
import tokenHash from '../utils/tokenHasher.js';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
const authController = {}

// console

authController.renderRegister = async (req, res) => {
   try {
      res.render('adminRegister', { title: 'Register New Admin' });
   }
   catch (error) {
      console.error("Error in GET /register:", error);
      res.status(500).json({ message: "Internal server error" });
   }
}
authController.handleRegister = async (req, res) => {
   try {

      const { name, email, password } = req.validatedData;


      const existingAdmin = await Admin.findOne({ where: { email } });

      if (existingAdmin) {
         return res.render('adminRegister', {
            title: 'Register New Admin',
            error_msg: 'Email already exists!',
            oldInput: {
               name: req.body.name,
               email: req.body.email
            }
         });
      }


      const hash = await bcrypt.hash(password, 10);
      await Admin.create({ name, email, password: hash });


      req.flash('success', 'Registration successful! Please log in.');
      return res.redirect('/auth/admin/login');

   } catch (error) {
      console.error("Error creating admin:", error);


      return res.render('adminRegister', {
         title: 'Register New Admin',
         error_msg: 'Something went wrong. Please try again.',
         oldInput: req.body
      });
   }
}


authController.renderSignin = (req, res) => {
   try {
      res.render('adminSignin', { title: 'Sign In Admin' });
   }
   catch (error) {
      console.error("Error in GET /register:", error);
      res.status(500).json({ message: "Internal server error" });
   }
}
authController.handleSignin = async (req, res) => {
   try {
      const { email, password } = req.validatedData;

      const admin = await Admin.findOne({ where: { email } });

      if (!admin) {
         req.flash('error', 'Invalid email or password.');
         return res.status(400).redirect('/auth/admin/login');
      }
      // console.log(admin.id)

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
         // console.log("Password did not match");
         req.flash('error', 'Invalid email or password.');
         return res.status(400).redirect('/auth/admin/login');
      }
      // console.log("Password matched");

      const accessToken = generateAccessToken(admin, "admin");

      const oldRefreshToken = await RefreshToken.findOne({ where: { userId: admin.id, userType: 'admin' } });
      if (oldRefreshToken) {
         await RefreshToken.destroy({ where: { userId: admin.id, userType: 'admin' } });
      }
      const refreshToken = generateRefreshToken(admin, "admin");
      const hashedToken = tokenHash(refreshToken);
      const expiryDate = new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_LIFE));

      await RefreshToken.create({
         token: hashedToken,
         userId: admin.id,
         userType: 'admin',
         expiryDate: expiryDate
      })


      res.cookie("accessToken", accessToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", refreshToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 7 * 24 * 60 * 60 * 1000
      });


      req.flash('success', 'Signed in successfully!');
      return res.status(200).redirect('/admin/dashboard');

   }
   catch (error) {
      console.error("Error in POST /signin:", error);
      req.flash('error', 'An error occurred during sign in. Please try again.');
      return res.status(500).redirect('/auth/admin/signin');
   }
}


authController.renderForgetPassword = (req, res) => {
   res.send("forget get endpoint working fine!");
}
authController.handleForgetPassword = (req, res) => {
   res.send("forget post endpoint working fine!");
}


authController.renderResetPassword = (req, res) => {
   res.send("reset get endpoint working fine!");
}
authController.handleResetPassword = (req, res) => {
   res.send("reset post endpoint working fine!");
}


authController.handleSignout = async (req, res) => {
   const userType = res.locals.userType;
   // Always clear cookies first
   res.clearCookie("accessToken");
   const refreshToken = req.cookies.refreshToken;
   res.clearCookie("refreshToken");

   try {
      let userId = req.user ? req.user.id : null;

      // If req.user is missing (session expired), try to get ID from refresh token to clean up DB
      if (!userId && refreshToken) {
         const decoded = jwt.decode(refreshToken);
         if (decoded && decoded.id) {
            userId = decoded.id;
         }
      }

      if (userId && userType) {
         await RefreshToken.destroy({ where: { userId: userId, userType: userType } });
      }
   } catch (error) {
      console.error("Error during signout cleanup:", error);
      // Continue to logout even if DB cleanup fails
   }

   req.flash('success', 'You have been signed out successfully.');

   if (userType === 'owner') {
      return res.redirect('/auth/owner/login');
   }
   return res.redirect('/auth/admin/login');
}


authController.handleUpdateProfile = (req, res) => {
   const { id } = req.params;
   res.send(`update patch endpoint for id ${id} is working fine!`);
}
authController.renderUpdateProfile = (req, res) => {
   res.send("update Get endpoint working fine!");
}

authController.handleDeleteProfile = (req, res) => {
   const { id } = req.params;
   res.send("delete delete endpoint for id ${id} is working fine!");
}



authController.refreshToken = async (req, res, originalUrl) => {
   const refreshTokenFromCookie = req.cookies.refreshToken;

   if (!refreshTokenFromCookie) {
      if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
         return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }
      req.flash('error', 'Invalid refresh token. Please login again.');
      return res.status(403).redirect('/auth/admin/login');
   }
   try {
      const decoded = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET);
      // Use role from token instead of hardcoding 'admin'
      const userType = decoded.role || 'admin';

      const storedToken = await RefreshToken.findOne({ where: { userId: decoded.id, userType: userType } });

      if (!storedToken || storedToken.token !== tokenHash(refreshTokenFromCookie) || storedToken.expiryDate < new Date()) {
         if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(401).json({ success: false, message: 'Session expired or invalid' });
         }
         req.flash('error', 'Session expired. Please login again.');
         // Redirect based on user type
         return res.status(403).redirect(userType === 'owner' ? '/auth/owner/login' : '/auth/admin/login');
      }

      const newAccessToken = generateAccessToken(decoded, userType);
      const newRefreshToken = generateRefreshToken(decoded, userType);

      storedToken.token = tokenHash(newRefreshToken);
      storedToken.expiryDate = new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_LIFE));
      await storedToken.save();

      res.cookie("refreshToken", newRefreshToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie("accessToken", newAccessToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 15 * 60 * 1000
      });
      // req.flash('success', 'User verified!'); // No need to flash on silent refresh

      const redirectUrl = originalUrl && !originalUrl.includes('login') && !originalUrl.includes('signin')
         ? originalUrl
         : (userType === 'owner' ? '/owner/dashboard' : '/admin/dashboard');

      return res.redirect(redirectUrl);
   }
   catch (error) {
      console.error("Error in refreshing token:", error);
      req.flash('error', 'An error occurred while verifying user. Please login again.');
      return res.redirect('/auth/admin/login');
   }

}

export default authController;