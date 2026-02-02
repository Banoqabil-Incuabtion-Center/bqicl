import express, { Router } from 'express';
import authController from '../controllers/authController.js';
import ownerController from '../controllers/ownerController.js';
import playerController from '../controllers/playerController.js';
import teamController from '../controllers/teamController.js';
import { registerSchema, loginSchema, playerRegisterSchema, teamRegisterSchema } from '../validators/authValidation.js'
import validator from '../middlewares/formValidator.js';
import { requireAdminAuth, requireOwnerAuth } from "../middlewares/authMiddleware.js";
import blockInProduction from '../middlewares/productionBlock.js';
import upload from '../middlewares/uploadMiddleware.js';
import csrfProtection from '../middlewares/csrfMiddleware.js';

const router = Router();

// 2. ADMIN LOGIN
router.get('/admin/login', authController.renderSignin);
router.post('/admin/login', validator(loginSchema, 'adminLogin'), authController.handleSignin);
// 3. ADMIN LOGOUT 
router.post('/admin/logout', requireAdminAuth, authController.handleSignout);




// 1. OWNER REGISTER
router.get('/owner/register', requireAdminAuth, ownerController.renderRegister);
router.post('/owner/register', requireAdminAuth, upload.single('image'), csrfProtection, validator(registerSchema), ownerController.handleRegister);

// 2. OWNER LOGIN
router.get('/owner/login', ownerController.renderSignin);
router.post('/owner/login', validator(loginSchema, 'ownerLogin'), ownerController.handleSignin);

// 3. OWNER LOGOUT 
router.post('/owner/logout', requireOwnerAuth, authController.handleSignout);

// // 4. OWNER PASSWORD RESET
// router.get('/owner/forget-password', authController.renderForgetPassword);
// router.post('/owner/forget-password', authController.handleForgetPassword);
// router.get('/reset-password', authController.renderResetPassword);
// router.post('/reset-password', authController.handleResetPassword);


// // 6. OWNER DASHBOARD
// router.get('/owner/dashboard',adminOrOwner, authController.renderDashboard);


// 1. PLAYER REGISTER
router.get('/player/register', requireAdminAuth, playerController.renderRegister);
router.post('/player/register', requireAdminAuth, upload.single('playerImage'), csrfProtection, validator(playerRegisterSchema), playerController.handleRegister);



//1. TEAM REGISTER
router.get('/team/register', requireAdminAuth, teamController.renderRegister);
router.post('/team/register', requireAdminAuth, upload.single('teamLogo'), csrfProtection, validator(teamRegisterSchema), teamController.handleRegister);

export default router;