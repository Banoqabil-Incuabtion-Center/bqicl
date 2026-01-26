import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import Owner from "../models/ownerModel.js";
import authController from "../controllers/authController.js";
import ownerController from "../controllers/ownerController.js";

export const requireAdminAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  // 1️⃣ If access token exists, verify it
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const admin = await Admin.findByPk(decoded.id);

      if (!admin) {
        // access token valid but admin not found
        if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Admin session invalid' });
        }
        return res.redirect(`/auth/admin/signin?redirect=${encodeURIComponent(req.originalUrl)}`);
      }

      // attach admin to request
      req.user = admin;
      res.locals.user = admin;
      res.locals.userType = 'admin';
      return next();

    } catch (err) {
      // access token expired/invalid → fallback to refresh token
      console.log("Access token expired/invalid, calling refreshToken controller");
      return authController.refreshToken(req, res, req.originalUrl); // pass original URL
    }
  }

  // 2️⃣ No access token → call refresh token controller
  return authController.refreshToken(req, res, req.originalUrl);
};

export const requireOwnerAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  // 1️⃣ If access token exists, verify it
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const owner = await Owner.findByPk(decoded.id);

      if (!owner) {
        // access token valid but owner not found
        if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Owner session invalid' });
        }
        return res.redirect(`/auth/owner/signin?redirect=${encodeURIComponent(req.originalUrl)}`);
      }

      // attach owner to request
      req.user = owner;
      res.locals.user = owner;
      res.locals.userType = 'owner';
      return next();

    } catch (err) {
      // access token expired/invalid → fallback to refresh token
      console.log("Access token expired/invalid, calling refreshToken controller");
      return ownerController.refreshToken(req, res, req.originalUrl); // pass original URL
    }
  }

  // 2️⃣ No access token → call refresh token controller
  return ownerController.refreshToken(req, res, req.originalUrl);
};

export const requireAdminOrOwner = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Helper to determine where to redirect on failure
  const getFailureRedirect = () => {
    if (req.path.includes('/owner/')) return '/auth/owner/signin';
    if (req.path.includes('/admin/')) return '/auth/admin/signin';
    return '/auth/admin/signin'; // Default fallback
  };

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      if (decoded.role === 'admin') {
        const admin = await Admin.findByPk(decoded.id);
        if (admin) {
          req.user = admin;
          req.userType = 'admin';
          res.locals.user = admin;
          res.locals.userType = 'admin';
          return next();
        }
      } else if (decoded.role === 'owner') {
        const owner = await Owner.findByPk(decoded.id);
        if (owner) {
          req.user = owner;
          req.userType = 'owner';
          res.locals.user = owner;
          res.locals.userType = 'owner';
          return next();
        }
      }

      // If token valid but user not found
      return res.redirect(`${getFailureRedirect()}?redirect=${encodeURIComponent(req.originalUrl)}`);

    } catch (err) {
      console.log("Hybrid Auth: Access token expired, checking refresh token...");
    }
  }

  if (!refreshToken) {
    if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No session found' });
    }
    return res.redirect(getFailureRedirect());
  }

  try {
    const decodedPeek = jwt.decode(refreshToken);

    if (!decodedPeek || !decodedPeek.role) {
      return res.redirect(getFailureRedirect());
    }

    if (decodedPeek.role === 'admin') {
      return authController.refreshToken(req, res, req.originalUrl);
    }
    else if (decodedPeek.role === 'owner') {
      return ownerController.refreshToken(req, res, req.originalUrl);
    }
    else {
      return res.redirect(getFailureRedirect());
    }

  } catch (error) {
    console.error("Hybrid Auth Error:", error);
    return res.redirect(getFailureRedirect());
  }
};

