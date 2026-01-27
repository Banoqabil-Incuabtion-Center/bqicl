import express, { Router } from 'express';
import ownerController from '../controllers/ownerController.js';
import { requireOwnerAuth, requireAdminAuth, requireAdminOrOwner } from "../middlewares/authMiddleware.js";
import validator from "../middlewares/formValidator.js"
import { updateOwnerSchema } from '../validators/authValidation.js';
import upload from '../middlewares/uploadMiddleware.js';
import csrfProtection from '../middlewares/csrfMiddleware.js';
const router = Router();


router.get('/dashboard', requireOwnerAuth, ownerController.renderDashboard);
router.get('/ownerslist', requireAdminAuth, ownerController.renderAllOwners);
router.get('/profile/:id', requireAdminOrOwner, ownerController.renderOwnerProfile);
router.get('/profile/edit/:id', requireAdminAuth, ownerController.renderEdit);
router.get('/auction', requireOwnerAuth, ownerController.renderAuction);

// Squad Management Routes
router.get('/squad', requireOwnerAuth, ownerController.renderSquad);
router.post('/squad/captain/:playerId', requireOwnerAuth, ownerController.handleSetCaptain);
router.post('/squad/vice-captain/:playerId', requireOwnerAuth, ownerController.handleSetViceCaptain);
router.post('/squad/remove-role/:playerId', requireOwnerAuth, ownerController.handleRemoveRole);

router.post('/profile/delete/:id', requireAdminAuth, ownerController.handleDelete);
router.post('/profile/edit/:id', requireAdminAuth, upload.single('image'), csrfProtection, validator(updateOwnerSchema), ownerController.handleEdit);



export default router;