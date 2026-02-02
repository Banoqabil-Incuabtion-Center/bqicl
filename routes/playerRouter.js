import express, { Router } from 'express';
import playerController from '../controllers/playerController.js';
import { requireOwnerAuth, requireAdminAuth, requireAdminOrOwner } from "../middlewares/authMiddleware.js";
import upload from '../middlewares/uploadMiddleware.js';
import csrfProtection from '../middlewares/csrfMiddleware.js';
import validator from '../middlewares/formValidator.js';
import { registerSchema, loginSchema, playerRegisterSchema } from '../validators/authValidation.js'

import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
const uploadCsv = multer({ dest: 'uploads/' });

// const uploadCsv = multer({ 
//     dest: 'uploads/',
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
//             cb(null, true);
//         } else {
//             cb(new Error("Only CSV files are allowed!"), false);
//         }
//     }
// });

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const router = Router();

router.post('/bulk-upload', uploadCsv.single('csvFile'), playerController.handleBulkUpload);
router.get('/bulk-upload', requireAdminAuth, playerController.renderBulkUpload);
router.get('/download-template', requireAdminAuth, playerController.downloadTemplate);
router.get('/playerslist', requireAdminOrOwner, playerController.renderAllPlayers);
router.get('/profile/:id', requireAdminOrOwner, playerController.renderPlayerProfile);
// router.get('/profile/delete/:id', requireAdminOrOwner, playerController.renderDelete);
router.post('/profile/delete/:id', requireAdminOrOwner, playerController.handleDelete);
router.get('/profile/edit/:id', requireAdminAuth, playerController.renderEdit);
router.post('/profile/edit/:id', requireAdminAuth, upload.single('playerImage'), csrfProtection, validator(playerRegisterSchema, "editPlayer"), playerController.handleEdit);
export default router;