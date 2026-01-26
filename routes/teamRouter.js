import express, { Router } from 'express';
import teamController from '../controllers/teamController.js';
import { requireOwnerAuth, requireAdminAuth, requireAdminOrOwner } from "../middlewares/authMiddleware.js";
import upload from '../middlewares/uploadMiddleware.js';
import validator from '../middlewares/formValidator.js';
import { registerSchema, loginSchema, editTeamRegisterSchema } from '../validators/authValidation.js'
const router = Router();

router.get('/teamslist', requireAdminAuth, teamController.renderAllTeams);
router.get('/profile/:id', requireAdminOrOwner, teamController.renderTeamProfile);
router.post('/profile/delete/:id', requireAdminOrOwner, teamController.handleDelete);
router.get('/profile/edit/:id', requireAdminAuth, teamController.renderEdit);
router.post('/profile/edit/:id', requireAdminAuth, upload.single('teamLogo'), validator(editTeamRegisterSchema), teamController.handleEdit);

export default router;