import express,{Router} from 'express';
import adminController from '../controllers/adminController.js';
import { requireAdminAuth } from "../middlewares/authMiddleware.js";


const router = Router();


router.get('/dashboard',requireAdminAuth, adminController.renderDashboard); 
router.get('/auction',requireAdminAuth, adminController.renderAuction); 

export default router;