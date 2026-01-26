import express, { Router } from 'express';
import playerController from '../controllers/playerController.js';
import { requireOwnerAuth, requireAdminAuth, requireAdminOrOwner } from "../middlewares/authMiddleware.js";
import upload from '../middlewares/uploadMiddleware.js';
import validator from '../middlewares/formValidator.js';
import { registerSchema, loginSchema, playerRegisterSchema } from '../validators/authValidation.js'
const router = Router();


router.get('/playerslist', requireAdminAuth, playerController.renderAllPlayers);
router.get('/profile/:id', requireAdminOrOwner, playerController.renderPlayerProfile);
// router.get('/profile/delete/:id', requireAdminOrOwner, playerController.renderDelete);
router.post('/profile/delete/:id', requireAdminOrOwner, playerController.handleDelete);
router.get('/profile/edit/:id', requireAdminAuth, playerController.renderEdit);
router.post('/profile/edit/:id', requireAdminAuth, upload.single('playerImage'), validator(playerRegisterSchema, "editPlayer"), playerController.handleEdit);
export default router;