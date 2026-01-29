import express, { Router } from 'express';
import authRouter from './authRouter.js';
import ownerRouter from './ownerRouter.js';
import playerRouter from './playerRouter.js';
import teamRouter from './teamRouter.js';
import adminRouter from './adminRouter.js';

import landingController from '../controllers/landingController.js';
import auctionApiController from '../controllers/auctionApiController.js';
import playerController from '../controllers/playerController.js';
import teamController from '../controllers/teamController.js';

const router = Router();


router.get('/', landingController.renderLanding);
router.get('/auction', auctionApiController.renderAuctionPage);
router.get('/players', playerController.renderPublicPlayers);
router.get('/teams', teamController.renderPublicTeams);
router.get('/players/:id', playerController.renderPublicPlayerProfile);
router.get('/teams/:id', teamController.renderPublicTeamProfile);


router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/owner', ownerRouter);
router.use('/player', playerRouter);
router.use('/team', teamRouter);




export default router;