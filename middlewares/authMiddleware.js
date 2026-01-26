import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import Owner from "../models/ownerModel.js";
import authController from "../controllers/authController.js";
import ownerController from "../controllers/ownerController.js";

export const checkAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      let user = null;
      if (decoded.role === 'admin') {
        user = await Admin.findByPk(decoded.id);
      } else if (decoded.role === 'owner') {
        user = await Owner.findByPk(decoded.id);
      }

      if (user) {
        req.user = user;
        req.userType = decoded.role;
        res.locals.user = user;
        res.locals.userType = decoded.role;
      }
    } catch (err) {
      // Ignore errors for checkAuth, just don't set user
    }
  }
  next();
};

export const requireAdminAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const admin = await Admin.findByPk(decoded.id);

      if (!admin) {
        if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Admin session invalid' });
        }
        return res.redirect(`/auth/admin/signin?redirect=${encodeURIComponent(req.originalUrl)}`);
      }

      req.user = admin;
      res.locals.user = admin;
      res.locals.userType = 'admin';
      return next();

    } catch (err) {
      return authController.refreshToken(req, res, req.originalUrl);
    }
  }

  return authController.refreshToken(req, res, req.originalUrl);
};

export const requireOwnerAuth = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const owner = await Owner.findByPk(decoded.id);

      if (!owner) {
        if (req.xhr || req.path.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Owner session invalid' });
        }
        return res.redirect(`/auth/owner/signin?redirect=${encodeURIComponent(req.originalUrl)}`);
      }

      req.user = owner;
      res.locals.user = owner;
      res.locals.userType = 'owner';
      return next();

    } catch (err) {
      return ownerController.refreshToken(req, res, req.originalUrl);
    }
  }

  return ownerController.refreshToken(req, res, req.originalUrl);
};

export const requireAdminOrOwner = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  const getFailureRedirect = () => {
    if (req.path.includes('/owner/')) return '/auth/owner/signin';
    if (req.path.includes('/admin/')) return '/auth/admin/signin';
    return '/auth/admin/signin';
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
    } catch (err) {
      // silent fail here, fall through to refresh token check
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
    if (!decodedPeek || !decodedPeek.role) return res.redirect(getFailureRedirect());

    if (decodedPeek.role === 'admin') {
      return authController.refreshToken(req, res, req.originalUrl);
    } else if (decodedPeek.role === 'owner') {
      return ownerController.refreshToken(req, res, req.originalUrl);
    } else {
      return res.redirect(getFailureRedirect());
    }
  } catch (error) {
    return res.redirect(getFailureRedirect());
  }
};

